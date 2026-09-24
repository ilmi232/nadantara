# Nadantara

Platform instrumen musik digital untuk membantu guru mengajar musik, dimulai dari gamelan Jawa.

## Prototipe saat ini

- **Saron**: demung, barung, peking dalam laras sléndro dan pélog, dengan redam otomatis (*mathet*)
- **Bonang**: bonang barung dan bonang penerus, dua baris pencon (oktaf rendah dan tinggi)
- **Gong, kenong, kethuk & kempul**: gong ageng, gong suwukan, kenong, kethuk, dan kempul sesuai laras
- **Kendang**: kendang ageng (dha), ketipung (dhung, tak), dan kendang ciblon (dlang, lung, thung, tong, tak)
- **Pemutar balungan**: tulis notasi kepatihan, lalu putar dengan sorotan per ketukan, pola kolotomik
  lancaran (kethuk di ketukan ganjil, kenong 4/8/12/16, kempul 6/10/14, gong 16), pola sederhana untuk
  bonang (*gembyang*) dan kendang (*tak–dhung–tak–dha*), serta tombol untuk menyalakan/mematikan tiap instrumen

Keyboard: `A`–`J` = bilah saron, `Q`–`U` / `Z`–`M` = pencon bonang atas / bawah, `K` / `L` / `O` = kendang
dha / dhung / tak, `1`–`7` = nada saron, `Spasi` = gong ageng.

## Menjalankan

```bash
npm install
npm run dev
```

## Sampel suara

File MP3 di `public/samples/` dibuat oleh `npm run samples`. Skrip ini mengunduh WAV dari
[CDM Gamelan Sample Library](https://github.com/Digitopia/CDM-GAMELAN-SAMPLE-LIBRARY)
(Digitopia – Casa da Música, Artistic License 2.0) ke `assets-src/`, lalu mengubahnya jadi MP3 mono 96 kbps
yang sudah dipangkas dan dinormalkan (total ±4,9 MB; yang dimuat saat halaman dibuka ±2 MB).

## Deploy

Aplikasi tayang di https://nadantara.vercel.app. Setiap push ke branch `main` otomatis di-deploy oleh Vercel;
branch lain mendapat preview URL sendiri.
