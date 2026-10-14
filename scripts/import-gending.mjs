// Membaca file isian gending dari guru (content/gending-isian.xlsx) dan menulis
// src/data/gending.json yang dipakai aplikasi. Baris yang bermasalah dilewati
// dan dilaporkan, supaya bisa dibetulkan di file Excel lalu diimpor ulang.
//   npm run gending                 -> baca content/gending-isian.xlsx
//   npm run gending -- file.xlsx    -> baca file lain
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ExcelJS from 'exceljs';
import { parseBalungan } from '../src/gamelan.ts';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const input = path.resolve(process.argv[2] ?? path.join(root, 'content', 'gending-isian.xlsx'));
const output = path.join(root, 'src', 'data', 'gending.json');

// kolom di lembar "Gending" (lihat scripts/make-gending-template.py)
const COL = { judul: 2, bentuk: 3, laras: 4, pathet: 5, jenjang: 6, buka: 7, balungan: 8, sumber: 11, catatan: 12, oleh: 13 };
const FIRST_ROW = 5;

const plain = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').trim().toLowerCase();
const LARAS = { slendro: 'slendro', pelog: 'pelog' };
const PLAYABLE = { lancaran: 'lancaran', bebas: 'bebas' };

function text(cell) {
  const v = cell.value;
  if (v == null) return '';
  if (typeof v === 'object' && 'richText' in v) return v.richText.map((t) => t.text).join('').trim();
  if (typeof v === 'object' && 'result' in v) return String(v.result ?? '').trim();
  return String(v).trim();
}

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(input);
const sheet = wb.getWorksheet('Gending');
if (!sheet) {
  console.error(`Lembar "Gending" tidak ditemukan di ${input}`);
  process.exit(1);
}

const gending = [];
const problems = [];
for (let r = FIRST_ROW; r <= sheet.rowCount; r++) {
  const row = sheet.getRow(r);
  const get = (k) => text(row.getCell(COL[k]));
  const judul = get('judul');
  if (!judul || /^contoh\b/i.test(judul)) continue;

  const where = `baris ${r} "${judul}"`;
  const laras = LARAS[plain(get('laras'))];
  const bentuk = get('bentuk');
  const balungan = get('balungan');
  const errs = [];
  if (!laras) errs.push('laras belum dipilih (Sléndro/Pélog)');
  if (!bentuk) errs.push('bentuk belum dipilih');
  if (!balungan) errs.push('balungan kosong');

  if (laras && balungan) {
    const beats = parseBalungan(balungan, laras);
    const salah = [...new Set(beats.filter((b) => b.invalid).map((b) => b.num))];
    if (salah.length) errs.push(`nada ${salah.join(', ')} tidak ada di laras ${laras === 'slendro' ? 'sléndro' : 'pélog'}`);
    if (plain(bentuk) === 'lancaran' && beats.length % 16 !== 0) {
      errs.push(`lancaran harus kelipatan 16 ketukan (sekarang ${beats.length})`);
    }
  }
  if (errs.length) {
    problems.push(`  ✗ ${where}: ${errs.join('; ')}`);
    continue;
  }

  const structure = PLAYABLE[plain(bentuk)] ?? 'bebas';
  if (!PLAYABLE[plain(bentuk)]) problems.push(`  ! ${where}: bentuk ${bentuk} belum didukung, sementara diputar sebagai Bebas`);
  gending.push({
    name: judul,
    laras,
    structure,
    text: balungan,
    bentuk,
    ...(get('pathet') && { pathet: get('pathet') }),
    ...(get('jenjang') && { jenjang: get('jenjang') }),
    ...(get('buka') && { buka: get('buka') }),
    ...(get('sumber') && { sumber: get('sumber') }),
    ...(get('catatan') && { catatan: get('catatan') }),
    ...(get('oleh') && { oleh: get('oleh') }),
  });
}

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(gending, null, 2) + '\n');
console.log(`${gending.length} gending ditulis ke ${path.relative(root, output)}`);
if (problems.length) {
  console.log(`\nPerlu diperhatikan:\n${problems.join('\n')}`);
  if (problems.some((p) => p.includes('✗'))) process.exitCode = 1;
}
