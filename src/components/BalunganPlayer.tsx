import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BILAH, BONANG_PENCON, GONG, KEMPUL, KENDANG, KENONG, LARAS, PRESETS,
  bonangSample, colotomic, gembyang, kempulSample, kendangSample, kenongSample, kethukSample, parseBalungan, saronSample,
  type BonangKind, type Laras, type SaronKind, type Structure,
} from '../gamelan';
import { strikeBonang, strikeGong, strikeKempul, strikeKendang, strikeKenong, strikeKethuk, strikeSaron } from '../instruments';
import { audioContext, preload, unlock } from '../audio/engine';
import { Kepatihan } from './Kepatihan';

interface Props {
  laras: Laras;
  kind: SaronKind;
  bonang: BonangKind;
  damp: boolean;
  onLaras: (l: Laras) => void;
}

type Layer = 'saron' | 'bonang' | 'kethuk' | 'kenong' | 'kempul' | 'gong' | 'kendang';
const LAYERS: { id: Layer; label: string }[] = [
  { id: 'saron', label: 'Saron' },
  { id: 'bonang', label: 'Bonang' },
  { id: 'kethuk', label: 'Kethuk' },
  { id: 'kenong', label: 'Kenong' },
  { id: 'kempul', label: 'Kempul' },
  { id: 'gong', label: 'Gong' },
  { id: 'kendang', label: 'Kendang' },
];

const LOOKAHEAD = 0.15;
const TICK_MS = 25;

export function BalunganPlayer({ laras, kind, bonang, damp, onLaras }: Props) {
  const [text, setText] = useState(PRESETS[1].text);
  const [structure, setStructure] = useState<Structure>(PRESETS[1].structure);
  const [tempo, setTempo] = useState(72);
  const [loop, setLoop] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(-1);
  const [layers, setLayers] = useState<Record<Layer, boolean>>({
    saron: true, bonang: true, kethuk: true, kenong: true, kempul: true, gong: true, kendang: true,
  });

  const beats = useMemo(() => parseBalungan(text, laras), [text, laras]);
  const cols = useMemo(() => colotomic(beats, laras, structure), [beats, laras, structure]);
  const invalid = beats.filter((b) => b.invalid).map((b) => b.num);

  // nilai terbaru untuk penjadwal, supaya tempo dsb. bisa diubah saat sedang main
  const live = useRef({ beats, cols, tempo, loop, laras, kind, bonang, damp, layers });
  useEffect(() => {
    live.current = { beats, cols, tempo, loop, laras, kind, bonang, damp, layers };
  });
  const timer = useRef<number | null>(null);
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

  const start = async () => {
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
    const ctx = audioContext();
    let idx = 0;
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
        if (idx >= beats.length) {
          if (!loop) {
            const id = window.setTimeout(stop, Math.max(0, (next - ctx.currentTime) * 1000));
            timeouts.current.push(id);
            if (timer.current !== null) clearInterval(timer.current);
            timer.current = null;
            return;
          }
          idx = 0;
        }
        schedule(idx, next);
        idx++;
        next += 60 / tempo;
      }
    }, TICK_MS);
  };

  // kelompokkan per gatra (4 ketukan)
  const gatra: number[][] = [];
  beats.forEach((_, i) => {
    if (i % 4 === 0) gatra.push([]);
    gatra[gatra.length - 1].push(i);
  });

  return (
    <section className="card player">
      <header className="card-head">
        <div>
          <h2>Mainkan Balungan</h2>
          <p className="muted">Tulis notasi, lalu putar. Bilah saron dan gong akan menyala mengikuti ketukan.</p>
        </div>
        <label className="field">
          <span>Contoh latihan</span>
          <select
            value=""
            onChange={(e) => {
              const p = PRESETS[Number(e.target.value)];
              if (!p) return;
              setText(p.text);
              setStructure(p.structure);
              onLaras(p.laras);
            }}
          >
            <option value="" disabled>Pilih…</option>
            {PRESETS.map((p, i) => (
              <option key={p.name} value={i}>{p.name}</option>
            ))}
          </select>
        </label>
      </header>

      <div className="notation" aria-live="off">
        {gatra.length === 0 && <p className="muted">Belum ada notasi.</p>}
        {gatra.map((g, gi) => (
          <div className="gatra" key={gi}>
            {g.map((i) => {
              const b = beats[i];
              return (
                <span
                  key={i}
                  className={[
                    'beat',
                    i === current && 'now',
                    cols[i]?.gong && 'has-gong',
                    b.invalid && 'invalid',
                  ].filter(Boolean).join(' ')}
                >
                  <span className="beat-mark">{cols[i]?.kempul ? 'P' : cols[i]?.kenong ? 'N' : cols[i]?.kethuk ? '+' : ''}</span>
                  <Kepatihan num={b.num} octave={b.octave} />
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <p className="legend muted">
        <span className="legend-gong">○</span> gong &nbsp;·&nbsp; <b>N</b> kenong &nbsp;·&nbsp; <b>+</b> kethuk &nbsp;·&nbsp; <b>P</b> kempul &nbsp;·&nbsp; satu kotak = satu <i>gatra</i> (4 ketukan)
      </p>

      <label className="field">
        <span>Notasi balungan ({LARAS[laras].label})</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          spellCheck={false}
          placeholder=".5.3 .5.3 .6.5 .3.2"
        />
        <small className="muted">
          Angka 1–7 = nada, titik <code>.</code> = tidak dipukul, <code>6,</code> = nada rendah, <code>1'</code> = nada tinggi.
        </small>
        {invalid.length > 0 && (
          <small className="warn">
            Nada {[...new Set(invalid)].join(', ')} tidak ada di laras {LARAS[laras].label} — dilewati.
          </small>
        )}
      </label>

      <div className="controls">
        <button type="button" className={`btn btn-primary ${playing ? 'is-playing' : ''}`} onClick={playing ? stop : start}>
          {playing ? '■ Berhenti' : '▶ Putar'}
        </button>
        <label className="field field-inline tempo">
          <span>Tempo <b>{tempo}</b> ketuk/menit</span>
          <input type="range" min={30} max={160} value={tempo} onChange={(e) => setTempo(Number(e.target.value))} />
        </label>
        <label className="field field-inline">
          <span>Bentuk</span>
          <select value={structure} onChange={(e) => setStructure(e.target.value as Structure)}>
            <option value="lancaran">Lancaran (16 ketukan)</option>
            <option value="bebas">Bebas (gong di akhir)</option>
          </select>
        </label>
        <label className="check">
          <input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} />
          Ulangi
        </label>
      </div>

      <div className="layers">
        <span className="layers-label">Instrumen yang ikut main</span>
        <div className="chips">
          {LAYERS.map((l) => (
            <button
              key={l.id}
              type="button"
              className={`chip ${layers[l.id] ? 'on' : ''}`}
              aria-pressed={layers[l.id]}
              onClick={() => setLayers((v) => ({ ...v, [l.id]: !v[l.id] }))}
            >
              {l.label}
            </button>
          ))}
        </div>
        <small className="muted">
          Matikan instrumen satu per satu untuk menjelaskan perannya. Bonang dan kendang di sini memakai pola sederhana: bonang memukul nada balungan di dua oktaf sekaligus (<i>gembyang</i>), kendang menjaga ketukan dengan <i>tak – dhung – tak – dha</i> di setiap gatra. Keduanya belum pola garap yang sebenarnya.
        </small>
      </div>
    </section>
  );
}
