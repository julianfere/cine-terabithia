'use client';
import { useState } from 'react';

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
    const res = await fetch(`/api/screenings/${screeningId}/attendance`, {
      method: 'POST',
    });
    if (res.ok) setAttending(a => !a);
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
