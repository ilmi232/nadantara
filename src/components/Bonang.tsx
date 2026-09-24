import { BONANG, BONANG_KEYS, BONANG_PENCON, type BonangKind, type Laras } from '../gamelan';
import { strikeBonang } from '../instruments';
import { Pencon } from './Pencon';

export function Bonang({ kind, laras, showKeys }: { kind: BonangKind; laras: Laras; showKeys: boolean }) {
  const rows = BONANG_PENCON[laras];
  return (
    <div className={`rancakan rancakan-bonang ${laras}`}>
      {(['high', 'low'] as const).map((r) => (
        <div className="pencon-row" key={r}>
          <span className="pencon-row-label">{r === 'high' ? 'Oktaf tinggi' : 'Oktaf rendah'}</span>
          <div className="pencon-ropes">
            {rows[r].map((p, i) => (
              <Pencon
                key={p.id}
                strikeKey={`bonang:${p.id}`}
                num={p.num}
                octave={p.octave}
                size="md"
                keyLabel={showKeys ? BONANG_KEYS[r][i] : undefined}
                label={`${BONANG[kind].label} nada ${p.num}${p.octave ? ' tinggi' : ''}`}
                onStrike={() => strikeBonang(kind, laras, p.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
