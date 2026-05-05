import type { ScreeningRow } from '@/lib/data';

function formatTicketDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function Ticket({ screening, username }: { screening: ScreeningRow; username: string }) {
  const ticketNum = String(screening.id).padStart(4, '0');

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 72px',
      background: 'var(--bg-card)',
      border: '1px solid var(--line)',
      borderLeft: '4px solid var(--accent)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
      maxWidth: 540,
      userSelect: 'none',
    }}>
      {/* Cuerpo principal */}
      <div style={{ padding: '20px 24px', borderRight: '2px dashed var(--line)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>
          Entrada · Cine Club
        </div>
        <div style={{ fontWeight: 800, fontSize: 20, textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 14 }}>
          {screening.title}
          {screening.year && (
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 400, fontSize: 13, color: 'var(--ink-mute)', marginLeft: 8, textTransform: 'none' }}>
              &apos;{String(screening.year).slice(2)}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-soft)' }}>
            <span style={{ color: 'var(--ink-dim)', marginRight: 6 }}>FECHA</span>
            {formatTicketDate(screening.scheduledDate)}
          </div>
          {screening.hour && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-soft)' }}>
              <span style={{ color: 'var(--ink-dim)', marginRight: 6 }}>HORA</span>
              {screening.hour}
            </div>
          )}
          {screening.location && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-soft)' }}>
              <span style={{ color: 'var(--ink-dim)', marginRight: 6 }}>LUGAR</span>
              {screening.location}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-soft)' }}>
            <span style={{ color: 'var(--ink-dim)', marginRight: 6 }}>PARA</span>
            {username}
          </div>
          <span style={{
            background: 'var(--accent)',
            color: 'var(--bg)',
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '3px 8px',
            borderRadius: 'var(--radius-sm)',
          }}>
            Confirmada
          </span>
        </div>
      </div>

      {/* Talón */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: '16px 0',
        background: 'var(--bg-elev)',
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          fontWeight: 700,
          color: 'var(--accent)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          transform: 'rotate(180deg)',
        }}>
          Válida
        </span>
        <div style={{
          width: 36,
          height: 36,
          border: '2px solid var(--line)',
          borderRadius: 4,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 2,
          padding: 4,
        }}>
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} style={{ background: i % 3 === 0 || i % 5 === 0 ? 'var(--ink-dim)' : 'transparent', borderRadius: 1 }} />
          ))}
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-dim)', letterSpacing: '0.04em' }}>
          #{ticketNum}
        </span>
      </div>
    </div>
  );
}
