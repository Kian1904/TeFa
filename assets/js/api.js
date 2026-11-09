// Pemanggil API: selalu lewat /api/proxy (same-origin, tanpa CORS).
// Ada timeout biar tombol gak nyangkut "Memproses..." selamanya.
export async function api(fn, ...args) {
  const ctrl = new AbortController();
  const timer = setTimeout(function () { ctrl.abort(); }, 45000);
  try {
    const res = await fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'tefa', fn, args }),
      signal: ctrl.signal
    });
    let data;
    try { data = await res.json(); }
    catch (e) { throw new Error('Respons tidak valid dari server (' + res.status + ').'); }
    return data;
  } catch (e) {
    if (e && e.name === 'AbortError') throw new Error('Server kelamaan merespons (timeout). Coba lagi.');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
