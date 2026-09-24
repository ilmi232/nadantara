// Pemberitahuan "instrumen dipukul" supaya tampilan bisa beranimasi,
// baik dari sentuhan pengguna maupun dari pemutar balungan.
import { useEffect, useState } from 'react';

type Listener = (key: string) => void;
const listeners = new Set<Listener>();

export function emitStrike(key: string, delaySeconds = 0): void {
  const fire = () => listeners.forEach((l) => l(key));
  if (delaySeconds > 0.005) setTimeout(fire, delaySeconds * 1000);
  else fire();
}

/** Angka yang naik setiap kali `key` dipukul; dipakai sebagai React key animasi. */
export function useStrike(key: string): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const l: Listener = (k) => {
      if (k === key) setCount((c) => c + 1);
    };
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, [key]);
  return count;
}
