import { useEffect, useRef, useState, type ReactNode } from 'react';
import { KENONG, LARAS, SARON, gembyang, type Laras, type SaronKind } from '../gamelan';
import { LAYERS, type Layer, type Player } from '../player';
import { Kepatihan } from './Kepatihan';
import { Notation } from './Notation';

interface Props {
  player: Player;
  laras: Laras;
  kind: SaronKind;
  onClose: () => void;
}

type Theme = 'terang' | 'gelap';
const THEME_KEY = 'nadantara.projector-theme';

function readTheme(): Theme {
  try {
    return localStorage.getItem(THEME_KEY) === 'gelap' ? 'gelap' : 'terang';
  } catch {
    return 'terang';
  }
}

// Tampilan layar penuh untuk proyektor kelas: notasi besar, lampu instrumen,
// kendali dari keyboard atau clicker presentasi.
export function Projector({ player, laras, kind, onClose }: Props) {
  const { title, structure, tempo, setTempo, loop, setLoop, playing, toggle, range, setRange, stepRange, current, beats, cols, layers, toggleLayer } = player;
  const [theme, setTheme] = useState<Theme>(readTheme);
  const root = useRef<HTMLDivElement>(null);

  // layar penuh + layar tidak tertidur selama mode proyektor
  useEffect(() => {
    let wasFullscreen = false;
    let wakeLock: { release(): Promise<void> } | null = null;
    const el = document.documentElement;
    el.requestFullscreen?.().then(() => (wasFullscreen = true)).catch(() => {});
    const nav = navigator as Navigator & { wakeLock?: { request(type: 'screen'): Promise<{ release(): Promise<void> }> } };
    nav.wakeLock?.request('screen').then((l) => (wakeLock = l)).catch(() => {});
    // keluar layar penuh lewat Esc bawaan browser = keluar mode proyektor
    const onFs = () => {
      if (wasFullscreen && !document.fullscreenElement) onClose();
    };
    document.addEventListener('fullscreenchange', onFs);
    // halaman di belakang tidak ikut ter-scroll
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    root.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('fullscreenchange', onFs);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      wakeLock?.release().catch(() => {});
    };
  }, [onClose]);

  // Spasi = putar/berhenti; panah atau PageUp/PageDown (clicker) = geser gatra;
  // + / − = tempo; Home = putar semua; Esc = keluar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      switch (e.key) {
        // spasi selalu putar/berhenti, walau fokus sedang di salah satu tombol
        case ' ':
          toggle();
          break;
        case 'ArrowRight':
        case 'PageDown':
          stepRange(1);
          break;
        case 'ArrowLeft':
        case 'PageUp':
          stepRange(-1);
          break;
        case '+':
        case '=':
          setTempo(tempo + 4);
          break;
        case '-':
          setTempo(tempo - 4);
          break;
        case 'Home':
          setRange(null);
          break;
        case 'Escape':
          onClose();
          break;
        default:
          return;
      }
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle, stepRange, setTempo, tempo, setRange, onClose]);

  // gatra yang sedang berbunyi selalu terlihat walau notasinya panjang
  useEffect(() => {
    root.current?.querySelector('.gatra.playing')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [current]);

  const switchTheme = () => {
    const t: Theme = theme === 'terang' ? 'gelap' : 'terang';
    setTheme(t);
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch {
      // abaikan: tema hanya kenyamanan
    }
  };

  // isi lampu tiap instrumen pada ketukan yang sedang berbunyi
  const beat = current >= 0 ? beats[current] : undefined;
  const col = current >= 0 ? cols[current] : undefined;
  const lamp: Record<Layer, ReactNode> = {
    saron: beat?.bilah ? <Kepatihan num={beat.num} octave={beat.octave} /> : null,
    bonang: beat && gembyang(beat, laras).length ? <Kepatihan num={beat.num} /> : null,
    kethuk: col?.kethuk ? 'thuk' : null,
    kenong: col?.kenong ? kenongLabel(laras, col.kenong) : null,
    kempul: col?.kempul ? <Kepatihan num={col.kempul} /> : null,
    gong: col?.gong ? 'GONG' : null,
    kendang: col?.kendang ? col.kendang.stroke : null,
  };

  return (
    <div ref={root} className={`projector projector-${theme}`} role="dialog" aria-modal="true" aria-label="Mode Proyektor" tabIndex={-1}>
      <header className="pj-bar">
        <div className="pj-title">
          <span className="pj-name">{title}</span>
          <span className="pj-sub">
            Laras {LARAS[laras].label} · {structure === 'lancaran' ? 'Lancaran' : 'Bentuk bebas'} · {SARON[kind].label}
          </span>
        </div>
        <div className="pj-controls">
          <button type="button" className={`pj-play ${playing ? 'is-playing' : ''}`} onClick={toggle}>
            {playing ? '■ Berhenti' : '▶ Putar'}
          </button>
          <div className="pj-tempo" role="group" aria-label="Tempo">
            <button type="button" onClick={() => setTempo(tempo - 4)} aria-label="Pelankan">−</button>
            <span><b>{tempo}</b> ketuk/menit</span>
            <button type="button" onClick={() => setTempo(tempo + 4)} aria-label="Cepatkan">+</button>
          </div>
          <button type="button" className="pj-btn" aria-pressed={loop} onClick={() => setLoop(!loop)}>
            Ulangi: {loop ? 'ya' : 'tidak'}
          </button>
          <button type="button" className="pj-btn" onClick={switchTheme}>
            Tema {theme === 'terang' ? 'gelap' : 'terang'}
          </button>
          <button type="button" className="pj-btn pj-exit" onClick={onClose}>
            Keluar
          </button>
        </div>
      </header>

      <main className="pj-stage">
        <Notation player={player} className="notation-projector" />
      </main>

      <footer className="pj-foot">
        <div className="pj-lamps">
          {LAYERS.map((l) => {
            const on = layers[l.id];
            const content = on ? lamp[l.id] : null;
            return (
              <button
                key={l.id}
                type="button"
                className={['lamp', content !== null && 'lit', !on && 'muted'].filter(Boolean).join(' ')}
                aria-pressed={on}
                aria-label={`${l.label} ${on ? 'menyala' : 'dimatikan'}`}
                onClick={() => toggleLayer(l.id)}
              >
                <span className="lamp-name">{l.label}</span>
                <span key={content !== null ? current : 'idle'} className="lamp-value">{content}</span>
              </button>
            );
          })}
        </div>
        <p className="pj-hint">
          {range ? (
            <>
              Diputar: gatra {range.from + 1}{range.to > range.from ? `–${range.to + 1}` : ''} ·{' '}
              <button type="button" className="link" onClick={() => setRange(null)}>putar semua</button> ·{' '}
            </>
          ) : (
            'Ketuk gatra untuk memutar bagian itu saja · '
          )}
          Spasi putar/berhenti · ← → pindah gatra · + − tempo · Esc keluar · ketuk lampu untuk mematikan instrumen
        </p>
      </footer>
    </div>
  );
}

function kenongLabel(laras: Laras, id: string) {
  const p = KENONG[laras].find((k) => k.id === id);
  return p ? <Kepatihan num={p.num} octave={p.octave} /> : null;
}
