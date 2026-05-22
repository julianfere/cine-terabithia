'use client';
import { useEffect, useState } from 'react';

export function Toast({ message, visible }: { message: string; visible: boolean }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const t = setTimeout(() => setShow(false), 2500);
      return () => clearTimeout(t);
    }
  }, [visible]);

  if (!show) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: 'var(--bg-elev)', border: '1px solid var(--accent)',
      borderRadius: 'var(--radius-sm)', padding: '10px 20px',
      fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink)',
      letterSpacing: '0.04em', zIndex: 1000,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      animation: 'fadeInUp 0.2s ease',
    }}>
      {message}
    </div>
  );
}
