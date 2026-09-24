import { unlock } from '../audio/engine';
import { useStrike } from '../strikes';
import { Kepatihan } from './Kepatihan';

// Pot bonang/kenong dilihat dari atas, duduk di atas tali rancakan.
export function Pencon({ strikeKey, num, octave = 0, size, label, keyLabel, onStrike }: {
  strikeKey: string;
  num: string;
  octave?: 0 | 1;
  size: 'sm' | 'md' | 'lg';
  label: string;
  keyLabel?: string;
  onStrike: () => void;
}) {
  const hit = useStrike(strikeKey);
  const strike = () => {
    void unlock();
    onStrike();
  };
  return (
    <button
      type="button"
      className={`pencon pencon-${size}`}
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
      <span key={hit} className={hit > 0 ? 'pencon-body bob' : 'pencon-body'}>
        <span className="pencon-knob">
          <Kepatihan num={num} octave={octave} />
        </span>
      </span>
      {keyLabel && <kbd className="pencon-key">{keyLabel.toUpperCase()}</kbd>}
      {hit > 0 && <span key={`r${hit}`} className="pencon-ripple" />}
    </button>
  );
}
