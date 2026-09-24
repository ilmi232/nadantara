// Mengunduh sampel gamelan Casa da Música (Artistic License 2.0) dari GitHub,
// lalu memprosesnya jadi MP3 mono ringan di public/samples/.
//   node scripts/fetch-samples.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Mp3Encoder } from '@breezystack/lamejs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const REPO = 'https://raw.githubusercontent.com/Digitopia/CDM-GAMELAN-SAMPLE-LIBRARY/master/';
const BASE = 'Gamelao_CdM/WAV/Gamelão da Casa Da Música - Porto, Portugal/';
const CACHE = path.join(__dirname, '..', 'assets-src');
const OUT = path.join(__dirname, '..', 'public', 'samples');

const SLENDRO = ['6l', '1', '2', '3', '5', '6', '1h'];
const PELOG = ['1', '2', '3', '4', '5', '6', '7'];
const SARON = { demung: 'SD', barung: 'SB', peking: 'SP' };
const BONANG = { 'bonang-barung': 'BB', 'bonang-penerus': 'BP' };
const MAX_SECONDS = {
  demung: 4.5, barung: 3.5, peking: 2.5,
  'bonang-barung': 3, 'bonang-penerus': 2.5,
  kenong: 5, kempul: 6, gong: 9, kethuk: 1.2, kendang: 1.5,
};

// [id sampel, file sumber, batas durasi]
const jobs = [];
for (const [name, code] of Object.entries(SARON)) {
  for (const n of SLENDRO) jobs.push([`${name}-slendro-${n}`, `SARON/${code}SL${n}.wav`, MAX_SECONDS[name]]);
  for (const n of PELOG) jobs.push([`${name}-pelog-${n}`, `SARON/${code}PL${n}.wav`, MAX_SECONDS[name]]);
}
// bonang: dua baris pencon, "h" = oktaf atas
for (const [name, code] of Object.entries(BONANG)) {
  for (const n of ['1', '2', '3', '5', '6']) {
    jobs.push([`${name}-slendro-${n}`, `BONANG/${code}SL${n}.wav`, MAX_SECONDS[name]]);
    jobs.push([`${name}-slendro-${n}h`, `BONANG/${code}SL${n}h.wav`, MAX_SECONDS[name]]);
  }
  for (const n of PELOG) {
    jobs.push([`${name}-pelog-${n}`, `BONANG/${code}PL${n}.wav`, MAX_SECONDS[name]]);
    jobs.push([`${name}-pelog-${n}h`, `BONANG/${code}PL${n}h.wav`, MAX_SECONDS[name]]);
  }
}
// kenong: varian "s" = dibiarkan berdengung (tidak diredam)
for (const n of ['1h', '2', '3', '5', '6']) jobs.push([`kenong-slendro-${n}`, `KENONG/KSL${n}s.wav`, MAX_SECONDS.kenong]);
for (const n of ['1h', '2', '3', '5', '6', '7']) jobs.push([`kenong-pelog-${n}`, `KENONG/KPL${n}s.wav`, MAX_SECONDS.kenong]);
for (const n of ['1', '2', '3', '5', '6']) jobs.push([`kempul-slendro-${n}`, `GONG/GKSL${n}f.wav`, MAX_SECONDS.kempul]);
for (const n of ['1', '2', '3', '5', '6', '7']) jobs.push([`kempul-pelog-${n}`, `GONG/GKPL${n}f.wav`, MAX_SECONDS.kempul]);
// kethuk: hanya satu nada per laras; varian tanpa "s" = bunyi pendek (diredam)
jobs.push(['kethuk-slendro', 'KETHUK/KtSL2.wav', MAX_SECONDS.kethuk]);
jobs.push(['kethuk-pelog', 'KETHUK/KtPL6.wav', MAX_SECONDS.kethuk]);
// kendang: nama file = nama bunyi pukulan
const KENDANG = {
  ageng: ['KENDHANG AGENG', ['DHA']],
  ketipung: ['KETIPUNG_TAMBOR PEQUENO', ['DHUNG', 'TAK']],
  ciblon: ['CIBLON_TAMBOR_MEDIO', ['DLANG', 'LUNG', 'TAK', 'THUNG', 'TONG']],
};
for (const [drum, [dir, strokes]] of Object.entries(KENDANG)) {
  for (const st of strokes) jobs.push([`kendang-${drum}-${st.toLowerCase()}`, `DRUMS/${dir}/${st}.wav`, MAX_SECONDS.kendang]);
}
jobs.push(['gong-ageng', 'GONG/GAf.wav', MAX_SECONDS.gong]);
jobs.push(['gong-suwukan', 'GONG/GSf.wav', MAX_SECONDS.gong]);

async function download(rel) {
  const local = path.join(CACHE, rel);
  if (fs.existsSync(local)) return fs.readFileSync(local);
  const url = REPO + (BASE + rel).normalize('NFD').split('/').map(encodeURIComponent).join('/');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(local), { recursive: true });
  fs.writeFileSync(local, buf);
  return buf;
}

// WAV PCM 16/24/32-bit atau float32 -> Float32Array mono
function decodeWav(buf) {
  let pos = 12, fmt, data;
  while (pos < buf.length - 8) {
    const id = buf.toString('ascii', pos, pos + 4);
    const size = buf.readUInt32LE(pos + 4);
    if (id === 'fmt ') fmt = buf.subarray(pos + 8, pos + 8 + size);
    if (id === 'data') data = buf.subarray(pos + 8, pos + 8 + size);
    pos += 8 + size + (size & 1);
  }
  let format = fmt.readUInt16LE(0);
  const channels = fmt.readUInt16LE(2);
  const sampleRate = fmt.readUInt32LE(4);
  const bits = fmt.readUInt16LE(14);
  if (format === 0xfffe) format = fmt.readUInt16LE(24);
  const bytes = bits / 8;
  const frames = Math.floor(data.length / (bytes * channels));
  const out = new Float32Array(frames);
  for (let i = 0; i < frames; i++) {
    let sum = 0;
    for (let c = 0; c < channels; c++) {
      const o = (i * channels + c) * bytes;
      let v;
      if (format === 3) v = data.readFloatLE(o);
      else if (bits === 16) v = data.readInt16LE(o) / 32768;
      else if (bits === 24) v = data.readIntLE(o, 3) / 8388608;
      else if (bits === 32) v = data.readInt32LE(o) / 2147483648;
      else throw new Error(`bit depth ${bits} tidak didukung`);
      sum += v;
    }
    out[i] = sum / channels;
  }
  return { samples: out, sampleRate };
}

function process_(samples, sampleRate, maxSeconds) {
  let peak = 0;
  for (const v of samples) peak = Math.max(peak, Math.abs(v));
  // buang hening di awal supaya bunyi langsung terdengar saat bilah dipukul
  let start = samples.findIndex((v) => Math.abs(v) > peak * 0.02);
  start = Math.max(0, start - Math.round(sampleRate * 0.002));
  const len = Math.min(samples.length - start, Math.round(maxSeconds * sampleRate));
  const out = new Int16Array(len);
  const fade = Math.round(Math.min(0.6, maxSeconds * 0.2) * sampleRate);
  const gain = 0.89 / peak;
  for (let i = 0; i < len; i++) {
    const f = i > len - fade ? (len - i) / fade : 1;
    out[i] = Math.round(samples[start + i] * gain * f * 32767);
  }
  return out;
}

function encodeMp3(pcm, sampleRate) {
  const enc = new Mp3Encoder(1, sampleRate, 96);
  const chunks = [];
  for (let i = 0; i < pcm.length; i += 1152) {
    const b = enc.encodeBuffer(pcm.subarray(i, i + 1152));
    if (b.length) chunks.push(Buffer.from(b));
  }
  chunks.push(Buffer.from(enc.flush()));
  return Buffer.concat(chunks);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  let total = 0;
  for (const [id, rel, maxSeconds] of jobs) {
    const { samples, sampleRate } = decodeWav(await download(rel));
    const mp3 = encodeMp3(process_(samples, sampleRate, maxSeconds), sampleRate);
    fs.writeFileSync(path.join(OUT, `${id}.mp3`), mp3);
    total += mp3.length;
    console.log(`${id.padEnd(24)} ${(mp3.length / 1024).toFixed(0)} KB  (${sampleRate} Hz)`);
  }
  console.log(`\n${jobs.length} file, total ${(total / 1048576).toFixed(2)} MB`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
