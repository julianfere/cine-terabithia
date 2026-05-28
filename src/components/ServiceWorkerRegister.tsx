'use client';
import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js').then((reg) => {
      const notifyWaiting = (sw: ServiceWorker) => {
        window.dispatchEvent(new CustomEvent('swUpdateAvailable', { detail: sw }));
      };

      // SW already waiting when page loads (e.g. hard refresh)
      if (reg.waiting && navigator.serviceWorker.controller) {
        notifyWaiting(reg.waiting);
      }

      reg.addEventListener('updatefound', () => {
        const newSW = reg.installing;
        if (!newSW) return;
        newSW.addEventListener('statechange', () => {
          if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
            notifyWaiting(newSW);
          }
        });
      });
    }).catch(() => {});
  }, []);

  return null;
}
