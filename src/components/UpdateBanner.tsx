'use client';
import { useEffect, useState } from 'react';

export default function UpdateBanner() {
  const [show, setShow] = useState(false);
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      setWaiting((e as CustomEvent<ServiceWorker>).detail);
      setShow(true);
    };
    window.addEventListener('swUpdateAvailable', handler);
    return () => window.removeEventListener('swUpdateAvailable', handler);
  }, []);

  const handleUpdate = () => {
    waiting?.postMessage('skipWaiting');
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    }, { once: true });
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: 'var(--bg-elev)', border: '1px solid var(--accent)',
      borderRadius: 'var(--radius-sm)', padding: '10px 16px',
      fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink)',
      letterSpacing: '0.04em', zIndex: 1002,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', gap: 14,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ color: 'var(--ink-soft)' }}>Nueva versión disponible</span>
      <button onClick={handleUpdate} className="btn btn-primary btn-sm">
        Actualizar
      </button>
      <button
        onClick={() => setShow(false)}
        style={{ background: 'none', border: 'none', color: 'var(--ink-mute)', cursor: 'pointer', padding: '0 2px', fontSize: 14, lineHeight: 1 }}
        aria-label="Cerrar"
      >
        ✕
      </button>
    </div>
  );
}
