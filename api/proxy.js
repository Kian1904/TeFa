// Proxy server→server ke Google Apps Script (menghindari CORS).
// Browser memanggil /api/proxy (same-origin), fungsi ini meneruskan ke
// Apps Script /exec memakai POST text/plain, lalu mengembalikan JSON-nya.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, message: 'Gunakan POST.' });
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
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body,
      redirect: 'follow'
    });
    const text = await r.text();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(text);
  } catch (e) {
    res.status(502).json({ ok: false, message: 'Proxy gagal: ' + (e && e.message ? e.message : e) });
  }
}
