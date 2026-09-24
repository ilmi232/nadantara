// Mesin putar balungan, dipakai bersama oleh pemutar biasa dan Mode Proyektor
// supaya lagu tidak terputus saat berpindah tampilan.
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BILAH, BONANG_PENCON, GONG, KEMPUL, KENDANG, KENONG, PRESETS,
  bonangSample, colotomic, gembyang, kempulSample, kendangSample, kenongSample, kethukSample, parseBalungan, saronSample,
  type BonangKind, type Laras, type Preset, type SaronKind, type Structure,
} from './gamelan';
import { strikeBonang, strikeGong, strikeKempul, strikeKendang, strikeKenong, strikeKethuk, strikeSaron } from './instruments';
import { audioContext, preload, unlock } from './audio/engine';

export type Layer = 'saron' | 'bonang' | 'kethuk' | 'kenong' | 'kempul' | 'gong' | 'kendang';
export const LAYERS: { id: Layer; label: string }[] = [
  { id: 'saron', label: 'Saron' },
  { id: 'bonang', label: 'Bonang' },
  { id: 'kethuk', label: 'Kethuk' },
  { id: 'kenong', label: 'Kenong' },
  { id: 'kempul', label: 'Kempul' },
  { id: 'gong', label: 'Gong' },
  { id: 'kendang', label: 'Kendang' },
];

/** Rentang gatra yang diputar (indeks gatra, inklusif); null = seluruh notasi. */
export interface GatraRange {
  from: number;
  to: number;
}

export const TEMPO_MIN = 30;
export const TEMPO_MAX = 160;
const LOOKAHEAD = 0.15;
const TICK_MS = 25;

export function usePlayer({ laras, kind, bonang, damp }: { laras: Laras; kind: SaronKind; bonang: BonangKind; damp: boolean }) {
  const [text, setTextRaw] = useState(PRESETS[1].text);
  const [title, setTitle] = useState(PRESETS[1].name);
  const [structure, setStructure] = useState<Structure>(PRESETS[1].structure);
  const [tempo, setTempoRaw] = useState(72);
  const [loop, setLoop] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(-1);
  // pilihan gatra hanya berlaku untuk notasi saat dipilih; ganti notasi = kembali ke semua
  const [picked, setPicked] = useState<{ key: string; range: GatraRange | null }>({ key: '', range: null });
  const [layers, setLayers] = useState<Record<Layer, boolean>>({
    saron: true, bonang: true, kethuk: true, kenong: true, kempul: true, gong: true, kendang: true,
  });

  const beats = useMemo(() => parseBalungan(text, laras), [text, laras]);
  const cols = useMemo(() => colotomic(beats, laras, structure), [beats, laras, structure]);
  const gatraCount = Math.ceil(beats.length / 4);
  const notationKey = `${laras}|${structure}|${text}`;
  const range = picked.key === notationKey ? picked.range : null;
  const setRange = (next: GatraRange | null | ((r: GatraRange | null) => GatraRange | null)) =>
    setPicked((p) => {
      const prev = p.key === notationKey ? p.range : null;
      return { key: notationKey, range: typeof next === 'function' ? next(prev) : next };
    });

  // nilai terbaru untuk penjadwal, supaya tempo dsb. bisa diubah saat sedang main
  const live = useRef({ beats, cols, tempo, loop, laras, kind, bonang, damp, layers, range });
  useEffect(() => {
    live.current = { beats, cols, tempo, loop, laras, kind, bonang, damp, layers, range };
  });
  const timer = useRef<number | null>(null);
  // true selama suara dimuat sebelum mulai; mencegah dua kali mulai
  const starting = useRef(false);
  const timeouts = useRef<number[]>([]);

  const stop = () => {
    if (timer.current !== null) clearInterval(timer.current);
    timer.current = null;
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
    setPlaying(false);
    setCurrent(-1);
  };

  useEffect(() => stop, []);
  // ganti laras atau notasi -> berhenti, supaya tidak memainkan urutan lama
  useEffect(() => {
    if (timer.current !== null) stop();
  }, [laras, text, structure]);

  const bounds = () => {
    const { beats, range } = live.current;
    if (!range) return [0, beats.length] as const;
    return [range.from * 4, Math.min((range.to + 1) * 4, beats.length)] as const;
  };

  const start = async () => {
    if (timer.current !== null || starting.current) return;
    starting.current = true;
    try {
      await unlock();
      await preload([
        ...BILAH[laras].map((b) => saronSample(kind, laras, b.id)),
        ...[...BONANG_PENCON[laras].low, ...BONANG_PENCON[laras].high].map((p) => bonangSample(bonang, laras, p.id)),
        ...KENONG[laras].map((p) => kenongSample(laras, p.id)),
        ...KEMPUL[laras].map((n) => kempulSample(laras, n)),
        kethukSample(laras),
        ...KENDANG.flatMap((d) => d.strokes.map((st) => kendangSample(d.id, st.id))),
        GONG.ageng.id,
      ]);
    } finally {
      starting.current = false;
    }
    const ctx = audioContext();
    let idx = bounds()[0];
    let next = ctx.currentTime + 0.1;
    setPlaying(true);

    const schedule = (i: number, t: number) => {
      const { beats, cols, laras, kind, bonang, damp, layers } = live.current;
      const beat = beats[i];
      const col = cols[i] ?? {};
      if (layers.saron && beat.bilah) strikeSaron(kind, laras, beat.bilah, damp, t);
      if (layers.bonang) for (const p of gembyang(beat, laras)) strikeBonang(bonang, laras, p, t);
      if (layers.kethuk && col.kethuk) strikeKethuk(laras, t);
      if (layers.kenong && col.kenong) strikeKenong(laras, col.kenong, t);
      if (layers.kendang && col.kendang) strikeKendang(col.kendang.drum, col.kendang.stroke, t);
      if (layers.kempul && col.kempul) strikeKempul(laras, col.kempul, t);
      if (layers.gong && col.gong) strikeGong('ageng', t);
      const id = window.setTimeout(() => setCurrent(i), Math.max(0, (t - ctx.currentTime) * 1000));
      timeouts.current.push(id);
      if (timeouts.current.length > 64) timeouts.current.splice(0, 32);
    };

    timer.current = window.setInterval(() => {
      const { beats, tempo, loop } = live.current;
      if (beats.length === 0) return stop();
      while (next < ctx.currentTime + LOOKAHEAD) {
        const [from, to] = bounds();
        // rentang bisa berubah saat sedang main: lompat ke awal rentang baru
        if (idx < from || idx > to) idx = from;
        if (idx >= to) {
          if (!loop) {
            const id = window.setTimeout(stop, Math.max(0, (next - ctx.currentTime) * 1000));
            timeouts.current.push(id);
            if (timer.current !== null) clearInterval(timer.current);
            timer.current = null;
            return;
          }
          idx = from;
        }
        schedule(idx, next);
        idx++;
        next += 60 / tempo;
      }
    }, TICK_MS);
  };

  // pilih gatra: ketuk sekali = satu gatra, ketuk gatra lain = perluas rentang,
  // ketuk satu-satunya gatra yang terpilih = batalkan pilihan
  const selectGatra = (g: number) =>
    setRange((r) => {
      if (!r) return { from: g, to: g };
      if (r.from === g && r.to === g) return null;
      return { from: Math.min(r.from, g), to: Math.max(r.to, g) };
    });

  // geser pilihan satu gatra (untuk tombol panah / clicker presentasi)
  const stepRange = (dir: -1 | 1) =>
    setRange((r) => {
      if (gatraCount === 0) return null;
      if (!r) return dir === 1 ? { from: 0, to: 0 } : { from: gatraCount - 1, to: gatraCount - 1 };
      const len = r.to - r.from;
      const from = Math.min(Math.max(r.from + dir, 0), gatraCount - 1 - len);
      return { from, to: from + len };
    });

  return {
    text,
    setText: (t: string) => {
      setTextRaw(t);
      setTitle('Notasi sendiri');
    },
    loadPreset: (p: Preset) => {
      setTextRaw(p.text);
      setTitle(p.name);
      setStructure(p.structure);
    },
    title,
    structure, setStructure,
    tempo,
    setTempo: (t: number) => setTempoRaw(Math.min(TEMPO_MAX, Math.max(TEMPO_MIN, Math.round(t)))),
    loop, setLoop,
    playing, start, stop,
    toggle: () => (timer.current !== null ? stop() : void start()),
    current,
    layers,
    toggleLayer: (l: Layer) => setLayers((v) => ({ ...v, [l]: !v[l] })),
    beats, cols, gatraCount,
    range, setRange, selectGatra, stepRange,
  };
}

export type Player = ReturnType<typeof usePlayer>;
