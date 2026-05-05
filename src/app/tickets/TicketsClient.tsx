'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { AttendedScreeningRow } from '@/lib/data';
import { Stars } from '@/components/Stars';

type Filter = 'all' | 'upcoming' | 'past';
type Sort = 'date' | 'score';

function relativeLabel(dateStr: string, status: string): string {
  const now = new Date();
  const d = new Date(dateStr + 'T00:00:00');
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / 86400000);

  if (status === 'upcoming') {
    if (diffDays === 0) return 'PRÓXIMA · hoy';
    if (diffDays === 1) return 'PRÓXIMA · mañana';
    if (diffDays > 0) return `PRÓXIMA · en ${diffDays} días`;
    return 'PRÓXIMA';
  }

  const absDays = Math.abs(diffDays);
  if (absDays < 7) return `VISTA · hace ${absDays} días`;
  if (absDays < 30) return `VISTA · hace ${Math.round(absDays / 7)} sem`;
  if (absDays < 365) return `VISTA · hace ${Math.round(absDays / 30)} m`;
  return `VISTA · hace ${Math.round(absDays / 365)} año${Math.round(absDays / 365) !== 1 ? 's' : ''}`;
}

function MiniBarcode() {
  return (
    <div style={{ display: 'flex', gap: 1, height: 14, alignItems: 'flex-end', marginTop: 10, opacity: 0.85 }}>
      {Array.from({ length: 15 }).map((_, i) => (
        <span key={i} style={{ display: 'block', width: 1.2, background: 'currentColor', height: i % 3 === 0 ? '55%' : i % 5 === 0 ? '75%' : '100%' }} />
      ))}
    </div>
  );
}

export default function TicketsClient({ tickets, username }: { tickets: AttendedScreeningRow[]; username: string }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('date');

  const now = new Date();

  const filtered = useMemo(() => {
    let list = [...tickets];
    if (filter === 'upcoming') list = list.filter((t) => t.status === 'upcoming');
    if (filter === 'past') list = list.filter((t) => t.status === 'past');
    if (sort === 'score') list.sort((a, b) => (b.userScore ?? -1) - (a.userScore ?? -1));
    return list;
  }, [tickets, filter, sort]);

  const upcomingCount = tickets.filter((t) => t.status === 'upcoming').length;
  const pastCount = tickets.filter((t) => t.status === 'past').length;
  const scoredTickets = tickets.filter((t) => t.userScore !== null);
  const avgScore = scoredTickets.length
    ? Math.round((scoredTickets.reduce((s, t) => s + (t.userScore ?? 0), 0) / scoredTickets.length) * 10) / 10
    : 0;

  return (
    <div className="page-enter shell" style={{ paddingTop: 32 }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
        <Link href="/perfil" style={{ color: 'var(--ink-mute)', textDecoration: 'none' }}>Perfil</Link>
        <span style={{ opacity: 0.5 }}>/</span>
        <b style={{ color: 'var(--ink)', fontWeight: 500 }}>Mis tickets</b>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em', margin: 0, lineHeight: 1 }}>Mis tickets</h1>
          <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--ink-soft)', fontSize: 16, margin: '6px 0 0' }}>
            Cada función a la que confirmaste asistencia.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 24, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 32, fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 4 }}>{tickets.length}</div>
            Total
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 32, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 4 }}>{upcomingCount}</div>
            Próxima{upcomingCount !== 1 ? 's' : ''}
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 32, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 4 }}>{pastCount}</div>
            Pasadas
          </div>
          {avgScore > 0 && (
            <div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 32, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 4 }}>{avgScore}</div>
              ★ promedio
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '24px 0 14px' }}>
        <SegControl
          options={[{ val: 'all', label: 'Todos' }, { val: 'upcoming', label: 'Próximos' }, { val: 'past', label: 'Pasados' }]}
          value={filter}
          onChange={(v) => setFilter(v as Filter)}
        />
        <SegControl
          style={{ marginLeft: 'auto' }}
          options={[{ val: 'date', label: 'Por fecha' }, { val: 'score', label: 'Por puntaje' }]}
          value={sort}
          onChange={(v) => setSort(v as Sort)}
        />
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--ink-mute)', fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 18 }}>
          No hay tickets en esta categoría.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))', gap: 14 }}>
          {filtered.map((ticket) => {
            const date = new Date(ticket.scheduledDate + 'T00:00:00');
            const day = date.getDate();
            const month = date.toLocaleDateString('es-AR', { month: 'short' });
            const year = date.getFullYear();
            const label = relativeLabel(ticket.scheduledDate, ticket.status);
            const isFuture = ticket.status === 'upcoming';

            return (
              <Link key={ticket.id} href={`/funciones/${ticket.id}`} className={`tk-mini${isFuture ? ' future' : ''}`}>
                <div className="tk-mini-date">
                  <div>
                    <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 0.9, letterSpacing: '-0.02em' }}>{day}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.16em', color: 'var(--ink-mute)', textTransform: 'uppercase', marginTop: 4 }}>{month}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-dim)', letterSpacing: '0.12em', marginTop: 8 }}>{year}</div>
                  </div>
                </div>

                <div className="tk-mini-body">
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: isFuture ? 'var(--accent)' : 'var(--ink-mute)', marginBottom: 4 }}>
                    {isFuture && <span style={{ marginRight: 4 }}>⬤</span>}{label}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.2, marginBottom: 4, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {ticket.title ?? 'Por votar'}
                    {ticket.year && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, fontSize: 11, color: 'var(--ink-mute)', marginLeft: 4 }}>
                        &apos;{String(ticket.year).slice(2)}
                      </span>
                    )}
                  </div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-soft)', marginBottom: 8 }}>
                    {ticket.director ?? '—'}
                  </div>
                  {isFuture ? (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>
                      {[ticket.hour, ticket.location].filter(Boolean).join(' · ')}
                    </div>
                  ) : ticket.userScore !== null ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Stars value={ticket.userScore} />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>tu puntaje: {ticket.userScore}</span>
                    </div>
                  ) : (
                    <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--accent)' }}>
                      + puntuá esta función
                    </div>
                  )}
                </div>

                <div className={`tk-mini-side${isFuture ? '' : ' past'}`}>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.02em' }}>{ticket.id}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.18em', fontWeight: 500, opacity: 0.7, textTransform: 'uppercase', marginTop: 2 }}>N°</div>
                  </div>
                  <MiniBarcode />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SegControl({
  options,
  value,
  onChange,
  style,
}: {
  options: { val: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ display: 'flex', background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 8, padding: 3, height: 36, ...style }}>
      {options.map((o) => (
        <button
          key={o.val}
          onClick={() => onChange(o.val)}
          style={{
            background: value === o.val ? 'var(--bg)' : 'transparent',
            border: 'none',
            color: value === o.val ? 'var(--ink)' : 'var(--ink-mute)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '0 12px',
            borderRadius: 5,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
