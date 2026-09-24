import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Status PWA: tersimpan untuk offline, koneksi, pasang aplikasi, versi baru. */
export function usePwa() {
  const [cached, setCached] = useState(false);
  const {
    offlineReady: [offlineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      // kunjungan berikutnya: service worker sudah aktif = semua file sudah tersimpan
      if (reg?.active) setCached(true);
    },
  });

  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstallEvent(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = installEvent
    ? async () => {
        await installEvent.prompt();
        await installEvent.userChoice;
        setInstallEvent(null);
      }
    : null;

  return {
    offlineSupported: 'serviceWorker' in navigator,
    savedOffline: cached || offlineReady,
    online,
    install,
    needRefresh,
    refresh: () => updateServiceWorker(true),
    dismissRefresh: () => setNeedRefresh(false),
  };
}
