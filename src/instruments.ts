import { audioContext, play } from './audio/engine';
import { emitStrike } from './strikes';
import {
  BONANG, GONG, KENDANG, KEMPUL_GAIN, KENONG_GAIN, KETHUK_GAIN, SARON,
  bonangSample, kempulSample, kendangSample, kenongSample, kethukSample, saronSample,
  type BonangKind, type KendangDrum, type Laras, type SaronKind,
} from './gamelan';

/** `when` dalam waktu AudioContext; 0 = sekarang. */
export function strikeSaron(kind: SaronKind, laras: Laras, bilah: string, damp: boolean, when = 0) {
  play(saronSample(kind, laras, bilah), { gain: SARON[kind].gain, when, channel: `saron-${kind}`, damp });
  emitStrike(`saron:${bilah}`, delay(when));
}

// Setiap pencon punya channel sendiri: dua pencon (gembyang) boleh berbunyi bersamaan,
// tapi memukul pencon yang sama akan meredam bunyinya yang lama.
export function strikeBonang(kind: BonangKind, laras: Laras, pencon: string, when = 0) {
  play(bonangSample(kind, laras, pencon), { gain: BONANG[kind].gain, when, channel: `${kind}-${pencon}`, damp: true });
  emitStrike(`bonang:${pencon}`, delay(when));
}

export function strikeKenong(laras: Laras, pencon: string, when = 0) {
  play(kenongSample(laras, pencon), { gain: KENONG_GAIN, when, channel: `kenong-${pencon}`, damp: true });
  emitStrike(`kenong:${pencon}`, delay(when));
}

export function strikeKethuk(laras: Laras, when = 0) {
  play(kethukSample(laras), { gain: KETHUK_GAIN, when, channel: 'kethuk', damp: true });
  emitStrike('kethuk', delay(when));
}

export function strikeKendang(drum: KendangDrum, stroke: string, when = 0) {
  const gain = KENDANG.find((d) => d.id === drum)?.strokes.find((s) => s.id === stroke)?.gain ?? 0.8;
  play(kendangSample(drum, stroke), { gain, when });
  emitStrike(`kendang:${drum}-${stroke}`, delay(when));
}

export function strikeKempul(laras: Laras, note: string, when = 0) {
  play(kempulSample(laras, note), { gain: KEMPUL_GAIN, when, channel: 'kempul', damp: true });
  emitStrike(`kempul:${note}`, delay(when));
}

export function strikeGong(kind: keyof typeof GONG, when = 0) {
  play(GONG[kind].id, { gain: GONG[kind].gain, when });
  emitStrike(`gong:${kind}`, delay(when));
}

function delay(when: number) {
  return when ? when - audioContext().currentTime : 0;
}
