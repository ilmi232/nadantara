import { GONG, KEMPUL, KENONG, KETHUK, type Laras } from '../gamelan';
import { strikeGong, strikeKempul, strikeKenong, strikeKethuk } from '../instruments';
import { unlock } from '../audio/engine';
import { useStrike } from '../strikes';
import { Kepatihan } from './Kepatihan';
import { Pencon } from './Pencon';

export function Gongs({ laras }: { laras: Laras }) {
  return (
    <div className="gongan">
      <div className="gong-pair">
        {(Object.keys(GONG) as (keyof typeof GONG)[]).map((k) => (
          <GongDisc
            key={k}
            strikeKey={`gong:${k}`}
            size={k === 'ageng' ? 'xl' : 'lg'}
            label={GONG[k].label}
            caption={k === 'ageng' ? 'Spasi' : undefined}
            onStrike={() => strikeGong(k)}
          />
        ))}
      </div>
      <div className="gong-side">
        <div className="gong-group">
          <h3>Kenong <span className="muted">— menandai akhir setiap bagian</span></h3>
          <div className="rancakan rancakan-kenong">
            {KENONG[laras].map((p) => (
              <Pencon
                key={p.id}
                strikeKey={`kenong:${p.id}`}
                num={p.num}
                octave={p.octave}
                size="lg"
                label={`Kenong nada ${p.num}${p.octave ? ' tinggi' : ''}`}
                onStrike={() => strikeKenong(laras, p.id)}
              />
            ))}
          </div>
        </div>
        <div className="gong-group">
          <h3>Kethuk <span className="muted">— bunyi pendek "thuk" di antara ketukan kenong</span></h3>
          <div className="rancakan rancakan-kenong rancakan-kethuk">
            <Pencon
              strikeKey="kethuk"
              num={KETHUK[laras]}
              size="sm"
              label={`Kethuk nada ${KETHUK[laras]}`}
              onStrike={() => strikeKethuk(laras)}
            />
          </div>
        </div>
        <div className="gong-group">
          <h3>Kempul <span className="muted">— membagi bagian di antara kenong</span></h3>
          <div className="kempul-row">
            {KEMPUL[laras].map((n) => (
              <GongDisc
                key={n}
                strikeKey={`kempul:${n}`}
                size="sm"
                label={`Kempul ${n}`}
                num={n}
                onStrike={() => strikeKempul(laras, n)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function GongDisc({ strikeKey, size, label, num, caption, onStrike }: {
  strikeKey: string;
  size: 'sm' | 'lg' | 'xl';
  label: string;
  num?: string;
  caption?: string;
  onStrike: () => void;
}) {
  const hit = useStrike(strikeKey);
  const strike = () => {
    void unlock();
    onStrike();
  };
  return (
    <div className={`gong-hang gong-${size}`}>
      <span className="gong-rope" aria-hidden />
      <button
        type="button"
        className="gong"
        aria-label={label}
        onPointerDown={(e) => {
          e.preventDefault();
          strike();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            strike();
          }
        }}
      >
        <span key={hit} className={hit > 0 ? 'gong-body swing' : 'gong-body'}>
          <span className="gong-pencu">{num && <Kepatihan num={num} />}</span>
        </span>
        {hit > 0 && <span key={`r${hit}`} className="gong-ripple" />}
      </button>
      {!num && (
        <span className="gong-label">
          {label}
          {caption && <kbd className="desktop-only">{caption}</kbd>}
        </span>
      )}
    </div>
  );
}
