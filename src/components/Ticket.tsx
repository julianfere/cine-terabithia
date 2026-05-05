import type { ScreeningRow } from '@/lib/data';

function Barcode({ count = 30 }: { count?: number }) {
  return (
    <div style={{ display: 'flex', gap: '1.5px', alignItems: 'flex-end', height: 18 }}>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          style={{
            display: 'block',
            width: i % 7 === 0 ? 3 : 1.5,
            background: '#0F1216',
            height: i % 3 === 0 ? '60%' : i % 5 === 0 ? '80%' : '100%',
          }}
        />
      ))}
    </div>
  );
}

function ticketInitials(username: string): string {
  return username
    .split(/[\s_&@]+/)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 3) || username.slice(0, 2).toUpperCase();
}

export function Ticket({ screening, username, animate }: { screening: ScreeningRow; username: string; animate?: boolean }) {
  const ticketNum = screening.id;
  const initials = ticketInitials(username);

  const dateStr = screening.scheduledDate
    ? new Date(screening.scheduledDate + 'T00:00:00').toLocaleDateString('es-AR', {
        weekday: 'short', day: 'numeric', month: 'short',
      })
    : '—';

  return (
    <div className={`ticket-card${animate ? ' ticket-reveal' : ''}`}>
      <div className="ticket-stub">
        <div className="ticket-main">
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600, opacity: 0.7 }}>
            CINE TERABITHIA · ADMIT ONE
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1.1, margin: '6px 0 4px', textTransform: 'uppercase' }}>
            {screening.title ?? 'Próxima función'}
            {screening.year && (
              <span style={{ fontFamily: 'var(--font-mono)', fontStyle: 'normal', fontWeight: 500, fontSize: 13, opacity: 0.7, marginLeft: 6, letterSpacing: '0.04em', textTransform: 'none' }}>
                &apos;{String(screening.year).slice(2)}
              </span>
            )}
          </h3>
          {screening.synopsis && (
            <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 12, lineHeight: 1.3, opacity: 0.85, margin: '6px 0 12px', maxWidth: 320 }}>
              &ldquo;{screening.synopsis.slice(0, 80)}{screening.synopsis.length > 80 ? '…' : ''}&rdquo;
            </div>
          )}
          <div style={{ display: 'flex', gap: 20, fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>
            <div>
              <div style={{ opacity: 0.65, fontSize: 8, marginBottom: 2 }}>FECHA</div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.02em', fontFamily: 'var(--font-sans)' }}>{dateStr}</div>
            </div>
            {screening.hour && (
              <div>
                <div style={{ opacity: 0.65, fontSize: 8, marginBottom: 2 }}>HORA</div>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.02em', fontFamily: 'var(--font-sans)' }}>{screening.hour}</div>
              </div>
            )}
            {screening.location && (
              <div>
                <div style={{ opacity: 0.65, fontSize: 8, marginBottom: 2 }}>SALA</div>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.02em', fontFamily: 'var(--font-sans)' }}>{screening.location}</div>
              </div>
            )}
          </div>
        </div>

        <div className="ticket-side">
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.16em', fontWeight: 600, opacity: 0.7 }}>
            N° {ticketNum}
          </div>
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.02em' }}>{initials}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.12em', fontWeight: 500, opacity: 0.65, textTransform: 'uppercase', marginTop: 2 }}>
              {username.slice(0, 10)}
            </div>
          </div>
        </div>
      </div>

      <div className="ticket-bar">
        <Barcode />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 14, height: 14, background: '#0F1216', color: 'var(--accent)', borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 9, flexShrink: 0 }}>
            ✓
          </span>
          CT-2026-{String(ticketNum).padStart(3, '0')}
        </div>
      </div>
    </div>
  );
}
