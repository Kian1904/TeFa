// Util bersama: token login (localStorage), helper DOM.
const KEY = 'tefa_token';

export function getToken() { try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; } }
export function setToken(t) { try { localStorage.setItem(KEY, t); } catch (e) {} }
export function clearToken() { try { localStorage.removeItem(KEY); } catch (e) {} }

export function $(id) { return document.getElementById(id); }

export function el(tag, attrs, children) {
  const e = document.createElement(tag);
  if (attrs) Object.keys(attrs).forEach(function (k) {
    if (k === 'class') e.className = attrs[k];
    else if (k === 'text') e.textContent = attrs[k];
    else e.setAttribute(k, attrs[k]);
  });
  (children || []).forEach(function (c) { e.appendChild(c); });
  return e;
}

export function say(node, msg, jenis) {
  node.className = 'status ' + (jenis || 'info');
  node.textContent = msg;
  node.classList.remove('hidden');
}

export function csv(row) {
  return row.map(function (v) {
    let s = String(v == null ? '' : v);
    if (/^[=+@]/.test(s) || (/^-/.test(s) && !/^-\d/.test(s))) s = "'" + s;
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }).join(',');
}

export function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename || 'rekap.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(url); }, 3000);
}
