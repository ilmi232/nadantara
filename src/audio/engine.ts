// Mesin audio berbasis Web Audio API: memuat sampel MP3, memainkannya
// dengan latensi rendah, dan meredam bilah sebelumnya (mathet).

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

const loading = new Map<string, Promise<AudioBuffer>>();
const ready = new Map<string, AudioBuffer>();
const channels = new Map<string, Voice>();

export interface Voice {
  stop(at?: number, fade?: number): void;
}

export function audioContext(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext({ latencyHint: 'interactive' });
    master = ctx.createGain();
    master.gain.value = 0.8;
    // kompresor mencegah suara pecah saat gong dan saron berbunyi bersamaan
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -12;
    comp.ratio.value = 4;
    master.connect(comp).connect(ctx.destination);
  }
  return ctx;
}

// Browser hanya mengizinkan audio setelah ada interaksi pengguna.
export async function unlock(): Promise<void> {
  const c = audioContext();
  if (c.state !== 'running') await c.resume();
}

export function load(id: string): Promise<AudioBuffer> {
  let p = loading.get(id);
  if (!p) {
    p = fetch(`${import.meta.env.BASE_URL}samples/${id}.mp3`)
      .then((r) => {
        if (!r.ok) throw new Error(`Sampel ${id} tidak ditemukan`);
        return r.arrayBuffer();
      })
      .then((b) => audioContext().decodeAudioData(b))
      .then((buf) => {
        ready.set(id, buf);
        return buf;
      });
    p.catch(() => loading.delete(id));
    loading.set(id, p);
  }
  return p;
}

export function preload(ids: string[]): Promise<AudioBuffer[]> {
  return Promise.all(ids.map(load));
}

export interface PlayOptions {
  gain?: number;
  /** waktu AudioContext; 0 = sekarang */
  when?: number;
  /** bunyi di channel yang sama akan diredam saat bilah baru dipukul */
  channel?: string;
  damp?: boolean;
}

export function play(id: string, opts: PlayOptions = {}): Voice | null {
  const buf = ready.get(id);
  if (!buf) {
    load(id);
    return null;
  }
  const c = audioContext();
  const when = Math.max(opts.when ?? 0, c.currentTime);

  if (opts.channel && opts.damp) channels.get(opts.channel)?.stop(when, 0.08);

  const src = c.createBufferSource();
  src.buffer = buf;
  const g = c.createGain();
  g.gain.value = opts.gain ?? 1;
  src.connect(g).connect(master!);
  src.start(when);

  let stopped = false;
  const voice: Voice = {
    stop(at = c.currentTime, fade = 0.08) {
      if (stopped) return;
      stopped = true;
      const t = Math.max(at, c.currentTime);
      g.gain.setValueAtTime(opts.gain ?? 1, t);
      g.gain.linearRampToValueAtTime(0, t + fade);
      src.stop(t + fade + 0.01);
    },
  };
  if (opts.channel) {
    channels.set(opts.channel, voice);
    src.onended = () => {
      if (channels.get(opts.channel!) === voice) channels.delete(opts.channel!);
    };
  }
  return voice;
}
