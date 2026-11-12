// Proxy server→server ke Google Apps Script (menghindari CORS).
// Browser memanggil /api/proxy (same-origin), fungsi ini meneruskan ke
// Apps Script /exec memakai POST text/plain, lalu mengembalikan JSON-nya.
//
// Pengamanan (2026-11-12): request harus same-origin (Origin/Referer harus
// se-host dengan deployment ini) + batas request kasar per IP.
//
// JUJUR soal batasnya: cek Origin/Referer cuma menahan pemakaian iseng dari
// browser (console/DevTools). Klien non-browser (curl/Kali) bisa MEMALSUKAN
// header ini, jadi jangan dianggap tembok. Pertahanan asli tetap token di
// sisi Apps Script (tiap fungsi yang penting nolak tanpa token).

const HITS = new Map(); // ip -> { count, ts }
const WINDOW_MS = 60000;
const MAX_HITS = 120;

function hostOf(v) {
  try { return new URL(v).host; } catch (e) { return ''; }
}

function clientIp(req) {
  const xff = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return xff || String((req.socket && req.socket.remoteAddress) || 'unknown');
}

function rateLimited(ip) {
  const now = Date.now();
  const rec = HITS.get(ip);
  if (!rec || now - rec.ts > WINDOW_MS) { HITS.set(ip, { count: 1, ts: now }); return false; }
  rec.count += 1;
  if (HITS.size > 5000) {
    HITS.forEach(function (r, k) { if (now - r.ts > WINDOW_MS) HITS.delete(k); });
  }
  return rec.count > MAX_HITS;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, message: 'Gunakan POST.' });
    return;
  }

  // Cek same-origin: Origin atau Referer harus se-host dengan deployment ini.
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '');
  const originHost = hostOf(req.headers.origin || '');
  const refererHost = hostOf(req.headers.referer || '');
  const extra = String(process.env.ALLOWED_ORIGINS || '')
    .split(',').map(function (s) { return s.trim(); }).filter(Boolean).map(hostOf);
  const sameOrigin = (originHost && originHost === host) || (refererHost && refererHost === host);
  const allowExtra = extra.indexOf(originHost) >= 0 || extra.indexOf(refererHost) >= 0;
  if (!sameOrigin && !allowExtra) {
    res.status(403).json({ ok: false, message: 'Akses ditolak.' });
    return;
  }

  if (rateLimited(clientIp(req))) {
    res.status(429).json({ ok: false, message: 'Terlalu banyak permintaan. Coba lagi sebentar lagi.' });
    return;
  }

  const url = process.env.APPS_SCRIPT_URL;
  if (!url) {
    res.status(500).json({ ok: false, message: 'APPS_SCRIPT_URL belum diset di environment Vercel.' });
    return;
  }

  let body = req.body;
  if (typeof body !== 'string') body = JSON.stringify(body || {});

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(function () { ctrl.abort(); }, 40000);
    let r;
    try {
      r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body,
        redirect: 'follow',
        signal: ctrl.signal
      });
    } finally {
      clearTimeout(timer);
    }
    const text = await r.text();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(text);
  } catch (e) {
    res.status(502).json({ ok: false, message: 'Proxy gagal: ' + (e && e.message ? e.message : e) });
  }
}
