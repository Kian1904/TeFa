// Pemanggil API: selalu lewat /api/proxy (same-origin, tanpa CORS).
export async function api(fn, ...args) {
  const res = await fetch('/api/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'tefa', fn, args })
  });
  let data;
  try { data = await res.json(); }
  catch (e) { throw new Error('Respons tidak valid dari server (' + res.status + ').'); }
  return data;
}
