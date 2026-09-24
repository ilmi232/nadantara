import type { Player } from '../player';
import { Kepatihan } from './Kepatihan';

// Notasi balungan per gatra. Ketuk gatra untuk memilih bagian yang diputar.
export function Notation({ player, className = '' }: { player: Player; className?: string }) {
  const { beats, cols, current, range, selectGatra } = player;
  const gatra: number[][] = [];
  beats.forEach((_, i) => {
    if (i % 4 === 0) gatra.push([]);
    gatra[gatra.length - 1].push(i);
  });
  const nowGatra = current >= 0 ? Math.floor(current / 4) : -1;

  return (
    <div className={`notation ${range ? 'has-range' : ''} ${className}`}>
      {gatra.length === 0 && <p className="muted">Belum ada notasi.</p>}
      {gatra.map((g, gi) => {
        const selected = range !== null && gi >= range.from && gi <= range.to;
        return (
          <button
            type="button"
            className={['gatra', selected && 'selected', gi === nowGatra && 'playing'].filter(Boolean).join(' ')}
            key={gi}
            aria-pressed={selected}
            aria-label={`Gatra ${gi + 1}${selected ? ', dipilih' : ''}`}
            onClick={() => selectGatra(gi)}
          >
            {g.map((i) => {
              const b = beats[i];
              const c = cols[i];
              return (
                <span
                  key={i}
                  className={['beat', i === current && 'now', c?.gong && 'has-gong', b.invalid && 'invalid'].filter(Boolean).join(' ')}
                >
                  <span className="beat-mark">{c?.kempul ? 'P' : c?.kenong ? 'N' : c?.kethuk ? '+' : ''}</span>
                  <Kepatihan num={b.num} octave={b.octave} />
                </span>
              );
            })}
          </button>
        );
      })}
    </div>
  );
}
