# TeFa — Frontend Absensi TeFa (SMK Yappa Depok)

Frontend static (tanpa build) untuk modul Absensi TeFa. Backend tetap **Google Apps Script**;
semua panggilan lewat **proxy serverless** `/api/proxy` (server→server) supaya bebas CORS.

## Halaman

| File | Fungsi |
|------|--------|
| `index.html` | Beranda / pemilih halaman |
| `siswa.html` | Halaman siswa: scan QR guru → form nama/kelas → GPS → check-in |
| `guru.html` | Dashboard guru PJ: login token, QR rotating, upload, tombol admin |
| `rekap.html` | Rekap: tabel check-in, filter, unduh CSV |

## Konfigurasi (wajib)

Set environment variable di Vercel:

```
APPS_SCRIPT_URL = https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec
```

(`<DEPLOYMENT_ID>` = id deployment produksi Apps Script.)

## Deploy

1. Import repo ini di Vercel (Add New → Project → pilih repo).
2. Framework Preset: **Other**. Build Command: dikosongkan. Output dir: root.
3. Tambahkan `APPS_SCRIPT_URL` di Settings → Environment Variables.
4. Deploy.

## Lokal (opsional)

```bash
npx vercel dev
```

## Arsitektur

```
Browser  →  /api/proxy (Vercel function)  →  Apps Script /exec  →  Google Sheets
```

Frontend memanggil API lewat `assets/js/api.js`:

```js
api('tefaLogin', token)                 // POST {action:'tefa', fn, args}
```

Hanya fungsi yang ada di whitelist (lihat `TeFaApi.gs` di backend) yang bisa dipanggil.
