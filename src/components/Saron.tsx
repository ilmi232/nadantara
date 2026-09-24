import { BILAH, KEYS, SARON, type Bilah, type Laras, type SaronKind } from '../gamelan';
import { strikeSaron } from '../instruments';
import { unlock } from '../audio/engine';
import { useStrike } from '../strikes';
import { Kepatihan } from './Kepatihan';

interface Props {
  kind: SaronKind;
  laras: Laras;
  damp: boolean;
  showKeys: boolean;
}

export function Saron({ kind, laras, damp, showKeys }: Props) {
  const bilah = BILAH[laras];
  return (
    <div className={`rancakan rancakan-${kind}`}>
      <div className="bilah-row">
        {bilah.map((b, i) => (
          <BilahKey
            key={b.id}
            bilah={b}
            index={i}
            total={bilah.length}
            keyLabel={showKeys ? KEYS[i] : undefined}
            onStrike={() => {
              void unlock();
              strikeSaron(kind, laras, b.id, damp);
            }}
            label={`${SARON[kind].label} nada ${b.num}${b.octave === 1 ? ' tinggi' : b.octave === -1 ? ' rendah' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}

function BilahKey({ bilah, index, total, keyLabel, onStrike, label }: {
  bilah: Bilah;
  index: number;
  total: number;
  keyLabel?: string;
  onStrike: () => void;
  label: string;
}) {
  const hit = useStrike(`saron:${bilah.id}`);
  // bilah nada rendah lebih panjang
  const length = 100 - (index / (total - 1)) * 22;
  return (
    <button
      type="button"
      className="bilah"
      style={{ height: `${length}%` }}
      aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault();
        onStrike();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          onStrike();
        }
      }}
    >
      <span className="pin pin-top" />
      <Kepatihan num={bilah.num} octave={bilah.octave} className="bilah-label" />
      {keyLabel && <kbd className="bilah-key">{keyLabel.toUpperCase()}</kbd>}
      <span className="pin pin-bottom" />
      {hit > 0 && <span key={hit} className="bilah-flash" />}
    </button>
  );
}
