// Data instrumen, laras, dan notasi balungan (kepatihan).

export type Laras = 'slendro' | 'pelog';
export type SaronKind = 'demung' | 'barung' | 'peking';

export interface Bilah {
  /** id nada pada nama file sampel, mis. "6l", "1", "1h" */
  id: string;
  /** angka kepatihan */
  num: string;
  /** -1 = titik di bawah (rendah), 1 = titik di atas (tinggi) */
  octave: -1 | 0 | 1;
}

export const LARAS: Record<Laras, { label: string; desc: string }> = {
  slendro: { label: 'Sléndro', desc: '5 nada per oktaf, jaraknya hampir sama rata' },
  pelog: { label: 'Pélog', desc: '7 nada per oktaf, jaraknya tidak sama (ada yang rapat, ada yang lebar)' },
};

export const SARON: Record<SaronKind, { label: string; desc: string; gain: number }> = {
  demung: { label: 'Demung', desc: 'Saron paling besar, suara rendah', gain: 0.95 },
  barung: { label: 'Saron Barung', desc: 'Saron ukuran sedang, pembawa balungan', gain: 0.8 },
  peking: { label: 'Peking', desc: 'Saron paling kecil, suara tinggi', gain: 0.55 },
};

export const BILAH: Record<Laras, Bilah[]> = {
  slendro: [
    { id: '6l', num: '6', octave: -1 },
    { id: '1', num: '1', octave: 0 },
    { id: '2', num: '2', octave: 0 },
    { id: '3', num: '3', octave: 0 },
    { id: '5', num: '5', octave: 0 },
    { id: '6', num: '6', octave: 0 },
    { id: '1h', num: '1', octave: 1 },
  ],
  pelog: ['1', '2', '3', '4', '5', '6', '7'].map((n) => ({ id: n, num: n, octave: 0 as const })),
};

export type BonangKind = 'bonang-barung' | 'bonang-penerus';

export const BONANG: Record<BonangKind, { label: string; desc: string; gain: number }> = {
  'bonang-barung': { label: 'Bonang Barung', desc: 'Bonang besar, memimpin dan menghias lagu', gain: 0.8 },
  'bonang-penerus': { label: 'Bonang Penerus', desc: 'Bonang kecil, satu oktaf lebih tinggi, bermain lebih rapat', gain: 0.6 },
};

/** Pencon (pot) bonang dan kenong: `id` sesuai nama file, "h" = oktaf atas. */
export interface Pencon {
  id: string;
  num: string;
  octave: 0 | 1;
}

const row = (nums: string[], octave: 0 | 1): Pencon[] =>
  nums.map((n) => ({ id: octave ? `${n}h` : n, num: n, octave }));

// Susunan disederhanakan: baris bawah = oktaf rendah, baris atas = oktaf tinggi,
// nada naik dari kiri ke kanan (susunan asli di rancakan bonang berbeda-beda).
export const BONANG_PENCON: Record<Laras, { high: Pencon[]; low: Pencon[] }> = {
  slendro: { high: row(['1', '2', '3', '5', '6'], 1), low: row(['1', '2', '3', '5', '6'], 0) },
  pelog: { high: row(['1', '2', '3', '4', '5', '6', '7'], 1), low: row(['1', '2', '3', '4', '5', '6', '7'], 0) },
};

export const KENONG: Record<Laras, Pencon[]> = {
  slendro: [...row(['2', '3', '5', '6'], 0), ...row(['1'], 1)],
  pelog: [...row(['2', '3', '5', '6', '7'], 0), ...row(['1'], 1)],
};
export const KENONG_GAIN = 0.8;

// Kethuk: satu pencon kecil, bunyinya pendek ("thuk"). Di perangkat ini
// kethuk sléndro bernada 2 dan kethuk pélog bernada 6.
export const KETHUK: Record<Laras, string> = { slendro: '2', pelog: '6' };
export const KETHUK_GAIN = 0.7;

export type KendangDrum = 'ageng' | 'ciblon' | 'ketipung';

export interface Stroke {
  id: string;
  label: string;
  gain: number;
  key?: string;
}

// Bunyi kendang diberi nama sesuai suaranya.
export const KENDANG: { id: KendangDrum; label: string; desc: string; strokes: Stroke[] }[] = [
  {
    id: 'ageng', label: 'Kendang Ageng', desc: 'Kendang besar, suaranya rendah dan berat',
    strokes: [{ id: 'dha', label: 'Dha', gain: 1, key: 'k' }],
  },
  {
    id: 'ketipung', label: 'Ketipung', desc: 'Kendang kecil, pasangan kendang ageng',
    strokes: [{ id: 'dhung', label: 'Dhung', gain: 0.8, key: 'l' }, { id: 'tak', label: 'Tak', gain: 0.7, key: 'o' }],
  },
  {
    id: 'ciblon', label: 'Kendang Ciblon', desc: 'Kendang sedang, untuk pola yang lincah (misalnya iringan tari)',
    strokes: [
      { id: 'dlang', label: 'Dlang', gain: 0.8 },
      { id: 'lung', label: 'Lung', gain: 0.8 },
      { id: 'thung', label: 'Thung', gain: 0.8 },
      { id: 'tong', label: 'Tong', gain: 0.8 },
      { id: 'tak', label: 'Tak', gain: 0.7 },
    ],
  },
];

export const KEMPUL: Record<Laras, string[]> = {
  slendro: ['1', '2', '3', '5', '6'],
  pelog: ['1', '2', '3', '5', '6', '7'],
};

export const GONG = {
  ageng: { id: 'gong-ageng', label: 'Gong Ageng', desc: 'Menandai akhir satu putaran (gongan)', gain: 1 },
  suwukan: { id: 'gong-suwukan', label: 'Gong Suwukan', desc: 'Gong lebih kecil, untuk gending pendek', gain: 0.9 },
} as const;
export const KEMPUL_GAIN = 0.75;

export const saronSample = (kind: SaronKind, laras: Laras, note: string) => `${kind}-${laras}-${note}`;
export const kempulSample = (laras: Laras, note: string) => `kempul-${laras}-${note}`;
export const bonangSample = (kind: BonangKind, laras: Laras, id: string) => `${kind}-${laras}-${id}`;
export const kenongSample = (laras: Laras, id: string) => `kenong-${laras}-${id}`;
export const kethukSample = (laras: Laras) => `kethuk-${laras}`;
export const kendangSample = (drum: KendangDrum, stroke: string) => `kendang-${drum}-${stroke}`;

// Tombol keyboard, kiri ke kanan.
export const KEYS = ['a', 's', 'd', 'f', 'g', 'h', 'j'];
export const BONANG_KEYS = {
  high: ['q', 'w', 'e', 'r', 't', 'y', 'u'],
  low: ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
};

// ---------------------------------------------------------------------------
// Notasi balungan
//   angka 1-7 = nada, "." = pin (tidak dipukul)
//   6, = oktaf rendah (titik bawah)   1' = oktaf tinggi (titik atas)
// ---------------------------------------------------------------------------

export interface Beat {
  num: string | null;
  octave: -1 | 0 | 1;
  /** id bilah yang dipukul; null = pin atau nada tidak tersedia */
  bilah: string | null;
  /** nada ditulis tapi tidak ada di saron laras ini */
  invalid?: boolean;
}

export function parseBalungan(text: string, laras: Laras): Beat[] {
  const beats: Beat[] = [];
  const re = /([1-7])([,']?)|(\.)/g;
  for (const m of text.matchAll(re)) {
    if (m[3]) {
      beats.push({ num: null, octave: 0, bilah: null });
      continue;
    }
    const num = m[1];
    const octave = m[2] === ',' ? -1 : m[2] === "'" ? 1 : 0;
    const bilah = BILAH[laras].find((b) => b.num === num && b.octave === octave)
      // saron hanya 7 bilah: nada di luar jangkauan dimainkan di oktaf tengah
      ?? BILAH[laras].find((b) => b.num === num && b.octave === 0);
    beats.push({ num, octave, bilah: bilah?.id ?? null, invalid: !bilah });
  }
  return beats;
}

export type Structure = 'lancaran' | 'bebas';

export interface KendangHit {
  drum: KendangDrum;
  stroke: string;
}

export interface Colotomic {
  kethuk?: boolean;
  kendang?: KendangHit;
  kenong?: string;
  kempul?: string;
  gong?: boolean;
}

// Pola kolotomik (instrumen penanda struktur).
// Lancaran: 16 ketukan per gongan; kethuk di ketukan ganjil; kenong di 4, 8, 12, 16;
//           kempul di 6, 10, 14; gong di 16 (bersamaan dengan kenong).
// Bebas: kethuk di ketukan ke-2 dan kenong di akhir setiap gatra, gong di ketukan terakhir.
// Kendang: pola sederhana penjaga ketukan per gatra (tak, dhung, tak, dha),
// bukan kendhangan baku.
export function colotomic(beats: Beat[], laras: Laras, structure: Structure): Colotomic[] {
  const out: Colotomic[] = beats.map(() => ({}));
  if (beats.length === 0) return out;
  const last = beats.length - 1;
  beats.forEach((_, i) => {
    const pos = structure === 'lancaran' ? (i % 16) + 1 : (i % 4) + 1;
    if (pos % 4 === 0 || i === last) out[i].kenong = kenongFor(beats, i, laras);
    else if (structure === 'lancaran' ? pos % 2 === 1 : pos === 2) out[i].kethuk = true;
    out[i].kendang = SIMPLE_KENDANG[i % 4];
    if (structure === 'lancaran') {
      if (pos === 16 || i === last) out[i].gong = true;
      else if (pos === 6 || pos === 10 || pos === 14) out[i].kempul = kempulFor(beats, i, laras);
    }
  });
  if (structure === 'bebas') out[last].gong = true;
  return out;
}

const SIMPLE_KENDANG: KendangHit[] = [
  { drum: 'ketipung', stroke: 'tak' },
  { drum: 'ketipung', stroke: 'dhung' },
  { drum: 'ketipung', stroke: 'tak' },
  { drum: 'ageng', stroke: 'dha' },
];

// Nada balungan pada ketukan itu, atau nada terakhir sebelumnya jika ketukan itu pin.
function noteAt(beats: Beat[], i: number): string | undefined {
  for (let j = i; j >= 0; j--) if (beats[j].num) return beats[j].num!;
  return undefined;
}

// Kempul dan kenong mengikuti nada balungan. Pencon untuk nada 4 (pélog) tidak ada
// di perangkat ini, jadi diganti nada 5.
function kempulFor(beats: Beat[], i: number, laras: Laras): string | undefined {
  const n = noteAt(beats, i);
  if (!n) return undefined;
  if (KEMPUL[laras].includes(n)) return n;
  return n === '4' ? '5' : undefined;
}

function kenongFor(beats: Beat[], i: number, laras: Laras): string | undefined {
  let n = noteAt(beats, i);
  if (n === '4') n = '5';
  return KENONG[laras].find((k) => k.num === n)?.id;
}

/** Pola bonang sederhana (gembyang): nada balungan dipukul di dua oktaf bersamaan. */
export function gembyang(beat: Beat, laras: Laras): string[] {
  if (!beat.num || beat.invalid) return [];
  const { low, high } = BONANG_PENCON[laras];
  return [...low, ...high].filter((p) => p.num === beat.num).map((p) => p.id);
}

export interface Preset {
  name: string;
  laras: Laras;
  structure: Structure;
  text: string;
}

export const PRESETS: Preset[] = [
  { name: 'Tangga nada sléndro', laras: 'slendro', structure: 'bebas', text: "6,123 561'. 1'653 216,." },
  { name: 'Latihan pola lancaran (sléndro)', laras: 'slendro', structure: 'lancaran', text: '.5.3 .5.3 .6.5 .3.2  .5.3 .5.3 .6.5 .3.2' },
  { name: 'Tangga nada pélog', laras: 'pelog', structure: 'bebas', text: '1234 567. 7654 321.' },
  { name: 'Latihan pola lancaran (pélog)', laras: 'pelog', structure: 'lancaran', text: '.3.2 .3.2 .5.6 .5.3' },
];
