import { KENDANG, type KendangDrum, type Stroke } from '../gamelan';
import { strikeKendang } from '../instruments';
import { unlock } from '../audio/engine';
import { useStrike } from '../strikes';

export function Kendang({ showKeys }: { showKeys: boolean }) {
  return (
    <div className="kendang-set">
      {KENDANG.map((d) => (
        <div key={d.id} className={`kendang kendang-${d.id}`}>
          <div className="kendang-body" aria-hidden>
            <span className="kendang-head" />
            <span className="kendang-barrel" />
            <span className="kendang-head" />
          </div>
          <div className="kendang-info">
            <h3>{d.label}</h3>
            <p className="muted">{d.desc}</p>
          </div>
          <div className="strokes">
            {d.strokes.map((s) => (
              <StrokePad key={s.id} drum={d.id} stroke={s} drumLabel={d.label} showKeys={showKeys} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function StrokePad({ drum, stroke, drumLabel, showKeys }: { drum: KendangDrum; stroke: Stroke; drumLabel: string; showKeys: boolean }) {
  const hit = useStrike(`kendang:${drum}-${stroke.id}`);
  const strike = () => {
    void unlock();
    strikeKendang(drum, stroke.id);
  };
  return (
    <button
      type="button"
      className="stroke"
      aria-label={`${drumLabel}, bunyi ${stroke.label}`}
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
      <span key={hit} className={hit > 0 ? 'stroke-skin thump' : 'stroke-skin'}>{stroke.label}</span>
      {showKeys && stroke.key && <kbd className="stroke-key desktop-only">{stroke.key.toUpperCase()}</kbd>}
    </button>
  );
}
