// Angka notasi kepatihan dengan titik oktaf (atas = tinggi, bawah = rendah).
export function Kepatihan({ num, octave = 0, className = '' }: { num: string | null; octave?: -1 | 0 | 1; className?: string }) {
  return (
    <span className={`kepatihan ${className}`}>
      <span className="kp-dot" aria-hidden>{octave === 1 ? '•' : ''}</span>
      <span className="kp-num">{num ?? '.'}</span>
      <span className="kp-dot" aria-hidden>{octave === -1 ? '•' : ''}</span>
    </span>
  );
}
