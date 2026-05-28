'use client';
import { useState } from 'react';
import { queueRequest } from '@/lib/offline-queue';

export function AttendanceButton({
  screeningId,
  initialAttending,
}: {
  screeningId: number;
  initialAttending: boolean;
}) {
  const [attending, setAttending] = useState(initialAttending);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    const prev = attending;
    setAttending((a) => !a); // optimistic
    try {
      const res = await fetch(`/api/screenings/${screeningId}/attendance`, {
        method: 'POST',
      });
      if (!res.ok) setAttending(prev); // revert on server error
    } catch {
      // Network error — queue for sync, keep optimistic state
      await queueRequest(`/api/screenings/${screeningId}/attendance`, 'POST').catch(() => {});
    }
    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={attending ? 'btn btn-sm' : 'btn btn-primary btn-sm'}
      style={attending ? { background: 'var(--bg-elev)', borderColor: 'var(--accent)', color: 'var(--accent)' } : {}}
    >
      {loading ? '...' : attending ? '✓ Confirmado — cancelar' : '🎟 Confirmar asistencia'}
    </button>
  );
}
