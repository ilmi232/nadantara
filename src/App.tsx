import { useEffect, useState } from 'react';
import {
  BILAH, BONANG, BONANG_KEYS, BONANG_PENCON, GONG, KEMPUL, KENDANG, KENONG, KEYS, LARAS, SARON,
  bonangSample, kempulSample, kendangSample, kenongSample, kethukSample, saronSample,
  type BonangKind, type Laras, type SaronKind,
} from './gamelan';
import { preload, unlock } from './audio/engine';
import { strikeBonang, strikeGong, strikeKendang, strikeSaron } from './instruments';
import { Saron } from './components/Saron';
import { Gongs } from './components/Gongs';
import { Bonang } from './components/Bonang';
import { Kendang } from './components/Kendang';
import { UpdateToast } from './components/UpdateToast';
import { usePwa } from './pwa';
import { BalunganPlayer } from './components/BalunganPlayer';

export default function App() {
  const [laras, setLaras] = useState<Laras>('slendro');
  const [kind, setKind] = useState<SaronKind>('barung');
  const [bonang, setBonang] = useState<BonangKind>('bonang-barung');
  const [damp, setDamp] = useState(true);
  const [showKeys, setShowKeys] = useState(true);
  // hasil muat terakhir, per kombinasi laras + saron
  const [loaded, setLoaded] = useState<{ key: string; ok: boolean } | null>(null);
  const soundKey = `${laras}-${kind}-${bonang}`;
  const status = loaded?.key !== soundKey ? 'loading' : loaded.ok ? 'ready' : 'error';
  const pwa = usePwa();

  useEffect(() => {
    let cancelled = false;
    preload([
      ...BILAH[laras].map((b) => saronSample(kind, laras, b.id)),
      ...[...BONANG_PENCON[laras].low, ...BONANG_PENCON[laras].high].map((p) => bonangSample(bonang, laras, p.id)),
      ...KENONG[laras].map((p) => kenongSample(laras, p.id)),
      ...KEMPUL[laras].map((n) => kempulSample(laras, n)),
      kethukSample(laras),
      ...KENDANG.flatMap((d) => d.strokes.map((st) => kendangSample(d.id, st.id))),
      GONG.ageng.id,
      GONG.suwukan.id,
    ])
      .then(() => !cancelled && setLoaded({ key: soundKey, ok: true }))
      .catch(() => !cancelled && setLoaded({ key: soundKey, ok: false }));
    return () => {
      cancelled = true;
    };
  }, [laras, kind, bonang, soundKey]);

  // keyboard: A–J = bilah saron, Q–U / Z–M = pencon bonang atas / bawah,
  // K / L / O = kendang dha / dhung / tak, angka = nada saron, spasi = gong
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (t.closest('textarea, select, input:not([type=checkbox]):not([type=range])')) return;
      const k = e.key.toLowerCase();
      // spasi pada tombol yang sedang fokus tetap untuk menekan tombol itu
      if (k === ' ' && t.closest('button, input')) return;
      let bilah: string | undefined;
      const i = KEYS.indexOf(k);
      if (i >= 0) bilah = BILAH[laras][i]?.id;
      else if (/^[1-7]$/.test(k)) bilah = BILAH[laras].find((b) => b.num === k && b.octave === 0)?.id;
      const high = BONANG_KEYS.high.indexOf(k);
      const low = BONANG_KEYS.low.indexOf(k);
      const kendang = KENDANG.flatMap((d) => d.strokes.map((st) => ({ drum: d.id, stroke: st.id, key: st.key })))
        .find((st) => st.key === k);
      const pencon = high >= 0 ? BONANG_PENCON[laras].high[high] : low >= 0 ? BONANG_PENCON[laras].low[low] : undefined;
      if (bilah) {
        void unlock();
        strikeSaron(kind, laras, bilah, damp);
      } else if (pencon) {
        void unlock();
        strikeBonang(bonang, laras, pencon.id);
      } else if (kendang) {
        void unlock();
        strikeKendang(kendang.drum, kendang.stroke);
      } else if (k === ' ') {
        e.preventDefault();
        void unlock();
        strikeGong('ageng');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [laras, kind, bonang, damp]);

  return (
    <div className="app">
      {!pwa.online && (
        <p className="strip">
          <b>Tanpa internet.</b>{' '}
          {pwa.savedOffline ? 'Semua suara sudah tersimpan, Nadantara tetap bisa dimainkan.' : 'Suara yang belum tersimpan mungkin tidak berbunyi.'}
        </p>
      )}
      {status === 'error' && (
        <p className="strip strip-error">
          <b>Sebagian suara gagal dimuat.</b> Periksa koneksi, lalu muat ulang halaman.
        </p>
      )}

      <header className="topbar">
        <div className="brand">
          {/* logo gong ikut bergetar selama suara dimuat */}
          <span className={`brand-mark ${status === 'loading' ? 'is-ringing' : ''}`} aria-hidden>
            <span className="brand-pencu" />
          </span>
          <div>
            <h1>Nadantara</h1>
            <p>Gamelan digital untuk belajar di kelas</p>
          </div>
        </div>
        <span className="sr-only" role="status">
          {status === 'loading' ? 'Memuat suara' : status === 'ready' ? 'Suara siap dimainkan' : ''}
        </span>
        {pwa.install && (
          <button type="button" className="btn-install" onClick={pwa.install}>
            Pasang di perangkat ini
          </button>
        )}
      </header>

      <main>
        <section className="card">
          <header className="card-head">
            <div>
              <h2>{SARON[kind].label}</h2>
              <p className="muted">{SARON[kind].desc}. Ketuk bilah untuk membunyikan.</p>
            </div>
            <div className="toolbar">
              <Segmented
                label="Laras"
                value={laras}
                options={(Object.keys(LARAS) as Laras[]).map((l) => ({ value: l, label: LARAS[l].label }))}
                onChange={setLaras}
              />
              <Segmented
                label="Saron"
                value={kind}
                options={(Object.keys(SARON) as SaronKind[]).map((k) => ({ value: k, label: SARON[k].label.replace('Saron ', '') }))}
                onChange={setKind}
              />
            </div>
          </header>

          <Saron kind={kind} laras={laras} damp={damp} showKeys={showKeys} />

          <div className="saron-foot">
            <p className="muted laras-desc"><b>{LARAS[laras].label}:</b> {LARAS[laras].desc}.</p>
            <div className="checks">
              <label className="check" title="Seperti teknik mathet: bunyi bilah sebelumnya dihentikan saat bilah baru dipukul">
                <input type="checkbox" checked={damp} onChange={(e) => setDamp(e.target.checked)} />
                <span>Redam otomatis (<i>mathet</i>)</span>
              </label>
              <label className="check desktop-only">
                <input type="checkbox" checked={showKeys} onChange={(e) => setShowKeys(e.target.checked)} />
                Tampilkan tombol keyboard
              </label>
            </div>
          </div>
        </section>

        <section className="card">
          <header className="card-head">
            <div>
              <h2>{BONANG[bonang].label}</h2>
              <p className="muted">{BONANG[bonang].desc}. Deretan pot (<i>pencon</i>) dalam dua oktaf.</p>
            </div>
            <div className="toolbar">
              <Segmented
                label="Bonang"
                value={bonang}
                options={(Object.keys(BONANG) as BonangKind[]).map((k) => ({ value: k, label: BONANG[k].label.replace('Bonang ', '') }))}
                onChange={setBonang}
              />
            </div>
          </header>
          <Bonang kind={bonang} laras={laras} showKeys={showKeys} />
          <p className="muted note">
            Susunan pencon disederhanakan: nada naik dari kiri ke kanan. Pada bonang asli, urutan pencon di rancakan tidak selalu seperti ini.
          </p>
        </section>

        <section className="card">
          <header className="card-head">
            <div>
              <h2>Gong, Kenong &amp; Kempul</h2>
              <p className="muted">Instrumen penanda struktur (<i>kolotomik</i>): gong menutup satu putaran lagu, kenong dan kempul membaginya menjadi bagian-bagian.</p>
            </div>
          </header>
          <Gongs laras={laras} />
        </section>

        <section className="card">
          <header className="card-head">
            <div>
              <h2>Kendang</h2>
              <p className="muted">Kendang memimpin tempo dan memberi aba-aba kepada pemain lain. Setiap bunyi pukulan punya nama sesuai suaranya.</p>
            </div>
          </header>
          <Kendang showKeys={showKeys} />
        </section>

        <BalunganPlayer laras={laras} kind={kind} bonang={bonang} damp={damp} onLaras={setLaras} />
      </main>

      <footer className="colophon">
        <div className="colophon-brand">
          <span className="colophon-name">Nadantara</span>
          <span className="muted">Prototipe · alat bantu pembelajaran karawitan</span>
        </div>
        <dl className="colophon-meta">
          <div>
            <dt>Sampel suara</dt>
            <dd>
              <a href="https://digitopia.casadamusica.com/CDM-GAMELAN-SAMPLE-LIBRARY/" target="_blank" rel="noreferrer">
                Digitopia, Casa da Música
              </a>
              <span className="muted"> · Artistic License 2.0</span>
            </dd>
          </div>
          {pwa.offlineSupported && (
            <div>
              <dt>Offline</dt>
              <dd>{pwa.savedOffline ? 'Tersimpan di perangkat ini' : 'Sedang disimpan…'}</dd>
            </div>
          )}
        </dl>
      </footer>

      {pwa.needRefresh && <UpdateToast onRefresh={pwa.refresh} onDismiss={pwa.dismissRefresh} />}
    </div>
  );
}

function Segmented<T extends string>({ label, value, options, onChange }: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      <span className="segmented-label">{label}</span>
      <div className="segmented-track">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            className={o.value === value ? 'active' : ''}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
