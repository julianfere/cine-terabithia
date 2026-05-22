'use client';
import { useState, useEffect } from 'react';

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function PushNotificationsToggle() {
  const [state, setState] = useState<'unsupported' | 'loading' | 'subscribed' | 'unsubscribed'>('loading');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported');
      return;
    }
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setState(sub ? 'subscribed' : 'unsubscribed');
    });
  }, []);

  if (state === 'unsupported') return null;

  async function toggle() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      if (state === 'subscribed') {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          await fetch('/api/push/subscribe', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
        }
        setState('unsubscribed');
      } else {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') return;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
        });
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub.toJSON()),
        });
        setState('subscribed');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ marginBottom: 36 }}>
      <div className="eyebrow" style={{ marginBottom: 10 }}>Notificaciones</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {state === 'subscribed' ? (
          <button
            className="btn btn-ghost btn-sm"
            onClick={toggle}
            disabled={busy}
            style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.03em' }}
          >
            {busy ? 'Desactivando…' : '🔔 Notificaciones activas — desactivar'}
          </button>
        ) : (
          <button
            className="btn btn-primary btn-sm"
            onClick={toggle}
            disabled={busy || state === 'loading'}
          >
            {busy ? 'Activando…' : 'Activar notificaciones'}
          </button>
        )}
      </div>
      {state !== 'subscribed' && (
        <p style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--ink-mute)', marginTop: 8 }}>
          Recibís avisos cuando se programa o reprograma una función.
        </p>
      )}
    </div>
  );
}
