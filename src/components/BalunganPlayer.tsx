import { LARAS, PRESETS, type Laras, type Structure } from '../gamelan';
import { LAYERS, TEMPO_MAX, TEMPO_MIN, type Player } from '../player';
import { Notation } from './Notation';

interface Props {
  player: Player;
  laras: Laras;
  onLaras: (l: Laras) => void;
  onProjector: () => void;
}

export function BalunganPlayer({ player, laras, onLaras, onProjector }: Props) {
  const { text, setText, beats, structure, setStructure, tempo, setTempo, loop, setLoop, playing, toggle, layers, toggleLayer, range, setRange } = player;
  const invalid = beats.filter((b) => b.invalid).map((b) => b.num);

  return (
    <section className="card player">
      <header className="card-head">
        <div>
          <h2>Mainkan Balungan</h2>
          <p className="muted">Tulis notasi, lalu putar. Bilah saron dan gong akan menyala mengikuti ketukan.</p>
        </div>
        <div className="player-actions">
          <label className="field">
            <span>Contoh latihan</span>
            <select
              value=""
              onChange={(e) => {
                const p = PRESETS[Number(e.target.value)];
                if (!p) return;
                player.loadPreset(p);
                onLaras(p.laras);
              }}
            >
              <option value="" disabled>Pilih…</option>
              {PRESETS.map((p, i) => (
                <option key={p.name} value={i}>{p.name}</option>
              ))}
            </select>
          </label>
          <button type="button" className="btn-install btn-projector" onClick={onProjector}>
            Mode Proyektor
          </button>
        </div>
      </header>

      <Notation player={player} />
      <p className="legend muted">
        <span className="legend-gong">○</span> gong &nbsp;·&nbsp; <b>N</b> kenong &nbsp;·&nbsp; <b>+</b> kethuk &nbsp;·&nbsp; <b>P</b> kempul &nbsp;·&nbsp; satu kotak = satu <i>gatra</i> (4 ketukan).{' '}
        {range ? (
          <>
            Diputar: gatra {range.from + 1}{range.to > range.from ? `–${range.to + 1}` : ''}.{' '}
            <button type="button" className="link" onClick={() => setRange(null)}>Putar semua</button>
          </>
        ) : (
          'Ketuk gatra untuk memutar bagian itu saja.'
        )}
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
        <button type="button" className={`btn btn-primary ${playing ? 'is-playing' : ''}`} onClick={toggle}>
          {playing ? '■ Berhenti' : '▶ Putar'}
        </button>
        <label className="field field-inline tempo">
          <span>Tempo <b>{tempo}</b> ketuk/menit</span>
          <input type="range" min={TEMPO_MIN} max={TEMPO_MAX} value={tempo} onChange={(e) => setTempo(Number(e.target.value))} />
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
              onClick={() => toggleLayer(l.id)}
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
