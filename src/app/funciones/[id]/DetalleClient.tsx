'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { ScreeningRow } from '@/lib/data';
import { Poster } from '@/components/Poster';
import { Stars } from '@/components/Stars';
import { SectionHeader } from '@/components/SectionHeader';
import { Avatar } from '@/components/Avatar';
import { Ticket } from '@/components/Ticket';
import { useProfiles, resolveUser } from '@/lib/useProfiles';

type Score = { id: number; username: string; score: number; comment: string | null; createdAt: number | null };

function formatDate(d: string) {
  const date = new Date(d + 'T00:00:00');
  return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function daysUntil(d: string): number {
  const diff = new Date(d + 'T00:00:00').getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.ceil(diff / 86400000);
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} style={{ width: 28, height: 28 }}>
      <path d="M5 12l5 5L22 5" />
    </svg>
  );
}

function TicketIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{ width: 18, height: 18 }}>
      <path d="M3 8a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 100-4V8z" />
      <path d="M13 6v12" strokeDasharray="2 2" />
    </svg>
  );
}

export default function DetalleClient({
  screening,
  scores: initialScores,
  username,
  initialAttendance,
}: {
  screening: ScreeningRow;
  scores: Score[];
  username: string | null;
  initialAttendance: { username: string }[];
}) {
  const [scores, setScores] = useState(initialScores);
  const [filterStar, setFilterStar] = useState<number | null>(null);
  const profiles = useProfiles();
  const initialMyScore = username ? initialScores.find((s) => s.username === username) : null;
  const [myRating, setMyRating] = useState(initialMyScore?.score ?? 0);
  const [myComment, setMyComment] = useState(initialMyScore?.comment ?? '');
  const [publishing, setPublishing] = useState(false);
  const [attendance, setAttendance] = useState(initialAttendance);
  const [justConfirmed, setJustConfirmed] = useState(false);
  const isGoing = username ? attendance.some((a) => a.username === username) : false;

  const avg = scores.length ? scores.reduce((s, r) => s + r.score, 0) / scores.length : 0;
  const distribution = [5, 4, 3, 2, 1].map((s) => ({ s, count: scores.filter((r) => r.score === s).length }));
  const maxCount = Math.max(...distribution.map((d) => d.count), 1);
  const filtered = filterStar ? scores.filter((r) => r.score === filterStar) : scores;
  const myScore = username ? scores.find((s) => s.username === username) : null;

  const handleConfirm = async () => {
    if (!username || isGoing) return;
    const res = await fetch(`/api/screenings/${screening.id}/attendance`, { method: 'POST' });
    if (res.ok) {
      const { attending } = await res.json();
      if (attending) {
        setJustConfirmed(true);
        setAttendance((prev) => [...prev, { username }]);
      }
    }
  };

  const handleCancel = async () => {
    if (!username || !isGoing) return;
    const res = await fetch(`/api/screenings/${screening.id}/attendance`, { method: 'POST' });
    if (res.ok) {
      setJustConfirmed(false);
      setAttendance((prev) => prev.filter((a) => a.username !== username));
    }
  };

  const handlePublish = async () => {
    if (!username || !myRating) return;
    setPublishing(true);
    const res = await fetch(`/api/screenings/${screening.id}/scores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score: myRating, comment: myComment }),
    });
    if (res.ok) {
      const updated = await res.json();
      setScores((prev) => {
        const idx = prev.findIndex((s) => s.username === username);
        if (idx >= 0) { const next = [...prev]; next[idx] = updated; return next; }
        return [...prev, updated];
      });
      setMyRating(updated.score);
      setMyComment(updated.comment ?? '');
    }
    setPublishing(false);
  };

  const days = daysUntil(screening.scheduledDate);

  const isUpcomingWithMovie = screening.status === 'upcoming' && !!screening.title;

  return (
    <div className="page-enter shell" style={{ paddingTop: 24 }}>
      <Link href="/calendario" className="btn btn-ghost btn-sm" style={{ marginBottom: 24, display: 'inline-flex' }}>
        ← Calendario
      </Link>

      {/* ── UPCOMING with movie: 3-column layout ── */}
      {isUpcomingWithMovie ? (
        <div className="detalle-rsvp-grid">
          {/* Left: poster + date */}
          <div>
            <Poster label={screening.title!.toUpperCase()} hue={screening.posterHue ?? 120} posterPath={screening.posterPath} />
            <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)', display: 'flex', justifyContent: 'space-between' }}>
              <span>FUNCIÓN</span>
              <span style={{ color: 'var(--ink)' }}>{formatDate(screening.scheduledDate)}</span>
            </div>
          </div>

          {/* Center: info + attendees */}
          <div>
            {screening.genre && <span className="eyebrow">{screening.genre} · Próxima función</span>}
            <h1 className="h-display" style={{ fontSize: 'clamp(40px, 4.5vw, 64px)', margin: '8px 0 14px', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
              {screening.title}
              {screening.year && (
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 400, fontSize: 'clamp(18px, 2vw, 28px)', color: 'var(--ink-mute)', marginLeft: 12, textTransform: 'none', letterSpacing: '0.04em' }}>
                  &apos;{String(screening.year).slice(2)}
                </span>
              )}
            </h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)', letterSpacing: '0.06em', marginBottom: 24 }}>
              {screening.director && <span>Dir. {screening.director}</span>}
              {screening.duration && <><span style={{ opacity: 0.4 }}>·</span><span>{screening.duration} min</span></>}
            </div>

            {screening.synopsis && (
              <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 18, color: 'var(--ink-soft)', lineHeight: 1.45, margin: '0 0 28px', borderLeft: '2px solid var(--line-soft)', paddingLeft: 14 }}>
                {screening.synopsis}
              </p>
            )}

            {/* Facts grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--line)', border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden', marginBottom: 32 }}>
              {screening.scheduledDate && (
                <div style={{ background: 'var(--bg-elev)', padding: '14px 16px' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Cuándo</div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginTop: 4 }}>
                    {new Date(screening.scheduledDate + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                    {screening.hour && <small style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', fontWeight: 400, marginTop: 2 }}>{screening.hour}</small>}
                  </div>
                </div>
              )}
              {screening.location && (
                <div style={{ background: 'var(--bg-elev)', padding: '14px 16px' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Dónde</div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginTop: 4 }}>{screening.location}</div>
                </div>
              )}
              {screening.snack && (
                <div style={{ background: 'var(--bg-elev)', padding: '14px 16px' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Snack</div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginTop: 4 }}>{screening.snack}</div>
                </div>
              )}
            </div>

            {/* Attendees */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: 18, margin: 0, fontWeight: 700 }}>
                {attendance.length} confirmados
                <em style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, color: 'var(--ink-mute)', marginLeft: 6, fontSize: 14 }}>· esta función</em>
              </h3>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {attendance.map((a) => {
                const resolved = resolveUser(profiles, a.username);
                const isYou = a.username === username;
                return (
                  <div key={a.username} className={`attend-chip${isYou ? ' you' : ''}`}>
                    <Avatar name={resolved.name} avatarId={resolved.avatarId} size="sm" />
                    <span>{isYou ? 'Vos' : resolved.name}</span>
                  </div>
                );
              })}
              {attendance.length === 0 && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-dim)' }}>
                  Nadie confirmó todavía — ¡sé el primero!
                </span>
              )}
            </div>
          </div>

          {/* Right: RSVP sticky card */}
          <div className="rsvp-col" style={{ position: 'sticky', top: 90 }}>
            {isGoing ? (
              /* ── CONFIRMED STATE ── */
              <div className="rsvp-card">
                <div className="rsvp-card-head">
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-mute)' }}>Tu ticket</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#5BB17C' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#5BB17C', display: 'inline-block', animation: 'pulse 1.6s infinite' }} />
                    Confirmado
                  </span>
                </div>
                <div style={{ padding: 18, textAlign: 'center' }}>
                  <div style={{ width: 56, height: 56, margin: '0 auto 12px', borderRadius: '50%', background: 'var(--accent)', display: 'grid', placeItems: 'center', color: 'var(--bg)', animation: justConfirmed ? 'pop 0.4s cubic-bezier(.2,1.4,.2,1) both' : 'none' }}>
                    <CheckIcon />
                  </div>
                  <h4 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px' }}>¡Estás adentro!</h4>
                  <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--ink-soft)', fontSize: 14, marginBottom: 14 }}>
                    guardamos tu ticket — lo encontrás en tu perfil
                  </div>
                  <Ticket screening={screening} username={username!} animate={justConfirmed} />
                  <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                    <button
                      onClick={handleCancel}
                      style={{ flex: 1, background: 'var(--bg-elev)', border: '1px solid var(--line)', color: 'var(--ink-soft)', height: 36, borderRadius: 8, fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Ya no puedo ir
                    </button>
                    <Link
                      href="/tickets"
                      style={{ flex: 1, background: 'rgba(228,98,23,0.12)', border: '1px solid var(--accent)', color: 'var(--accent)', height: 36, borderRadius: 8, fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                    >
                      Ver mis tickets →
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              /* ── DEFAULT STATE ── */
              <div className="rsvp-card">
                <div className="rsvp-card-head">
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-mute)' }}>RSVP</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#5BB17C' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#5BB17C', display: 'inline-block', animation: 'pulse 1.6s infinite' }} />
                    {days > 0 ? `Cuenta atrás · ${days} días` : 'Hoy'}
                  </span>
                </div>
                <div style={{ padding: 18 }}>
                  <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-mute)', marginBottom: 4 }}>
                    tu lugar te está esperando
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1.1, marginBottom: 4 }}>
                    {new Date(screening.scheduledDate + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </div>
                  {(screening.hour || screening.location) && (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-soft)', letterSpacing: '0.06em', marginBottom: 18 }}>
                      {[screening.hour, screening.location].filter(Boolean).join(' · ')}
                    </div>
                  )}

                  {username ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                      <button
                        onClick={handleConfirm}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 46, borderRadius: 8, background: 'var(--accent)', color: 'var(--bg)', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
                      >
                        <TicketIcon />
                        Confirmar asistencia
                      </button>
                    </div>
                  ) : (
                    <Link href="/login" className="btn btn-primary" style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                      Iniciar sesión para confirmar
                    </Link>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid var(--line)', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)', letterSpacing: '0.06em' }}>
                    <div>
                      <b style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 14, display: 'block', letterSpacing: 0, fontFamily: 'var(--font-sans)' }}>{attendance.length}</b>
                      confirmados
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── PAST or upcoming-without-movie: 2-column layout ── */
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 36, marginBottom: 40 }} className="detalle-grid">
          <div>
            <Poster label={screening.title ? screening.title.toUpperCase() : 'POR VOTAR'} hue={screening.posterHue ?? 120} posterPath={screening.posterPath} />
            <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)', display: 'flex', justifyContent: 'space-between' }}>
              <span>FUNCIÓN</span>
              <span style={{ color: 'var(--ink)' }}>{formatDate(screening.scheduledDate)}</span>
            </div>
          </div>

          <div>
            {screening.genre && <span className="eyebrow">{screening.genre}</span>}
            <h1 className="h-display" style={{ fontSize: 'clamp(40px, 5vw, 72px)', margin: '6px 0 12px', textTransform: 'uppercase' }}>
              {screening.title ? (
                <>
                  {screening.title}
                  {screening.year && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 400, fontSize: 'clamp(18px, 2vw, 28px)', color: 'var(--ink-mute)', marginLeft: 12, textTransform: 'none' }}>
                      &apos;{String(screening.year).slice(2)}
                    </span>
                  )}
                </>
              ) : (
                <em style={{ textTransform: 'none', fontSize: 'clamp(32px, 4vw, 56px)' }}>Votación abierta</em>
              )}
            </h1>
            {screening.director && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 28 }}>
                dir. {screening.director}{screening.duration ? ` · ${screening.duration} min` : ''}
              </div>
            )}

            {screening.status === 'past' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 200px', gap: 28, padding: '24px 28px', background: 'var(--bg-elev)', border: '1px solid var(--line)', borderLeft: '3px solid var(--accent)', borderRadius: 'var(--radius)', marginBottom: 28, alignItems: 'center' }} className="rating-block">
                <div>
                  <div className="h-display" style={{ fontSize: 88, color: 'var(--accent)', lineHeight: 0.9 }}>
                    {avg > 0 ? avg.toFixed(1) : '—'}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 4 }}>
                    promedio · {scores.length} votos
                  </div>
                </div>
                <div><Stars value={Math.round(avg)} size="xl" /></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {distribution.map((d) => (
                    <div key={d.s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', width: 16 }}>{d.s}★</span>
                      <div onClick={() => setFilterStar(filterStar === d.s ? null : d.s)} style={{ flex: 1, height: 5, background: 'var(--line)', borderRadius: 3, cursor: 'pointer', overflow: 'hidden', opacity: filterStar && filterStar !== d.s ? 0.3 : 1 }}>
                        <div style={{ width: `${(d.count / maxCount) * 100}%`, height: '100%', background: 'var(--accent)' }} />
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', width: 14, textAlign: 'right' }}>{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {screening.curatedBy && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar {...resolveUser(profiles, screening.curatedBy)} size="md" />
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Curada por</div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{resolveUser(profiles, screening.curatedBy).name}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MY RATING (past) ── */}
      {screening.status === 'past' && username && (
        <div style={{ background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '20px 24px', marginBottom: 40, display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 24, alignItems: 'center' }} className="myrating">
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              {myScore ? `Tu puntaje: ${myScore.score}★` : 'Tu puntaje'}
            </div>
            <Stars value={myRating || myScore?.score || 0} size="xl" interactive onChange={setMyRating} />
          </div>
          <input
            value={myComment}
            onChange={(e) => setMyComment(e.target.value)}
            placeholder="¿Qué te pareció?"
            style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1.5px solid var(--line)', fontSize: 18, color: 'var(--ink)', padding: '8px 0', outline: 'none' }}
          />
          <button className="btn btn-primary" disabled={!myRating || publishing} onClick={handlePublish}>
            {publishing ? '…' : myScore ? 'Actualizar' : 'Publicar'}
          </button>
        </div>
      )}

      {/* ── REVIEWS (past) ── */}
      {screening.status === 'past' && (
        <>
          <SectionHeader
            eyebrow={`${scores.length} reseñas`}
            title={<>Lo que <em>dijeron</em></>}
            action={filterStar ? (
              <button className="btn btn-ghost btn-sm" onClick={() => setFilterStar(null)}>
                Filtro: {filterStar}★ ✕
              </button>
            ) : undefined}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
            {filtered.map((r) => (
              <div key={r.id} className="card" style={{ padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: r.comment ? 12 : 0 }}>
                  <Avatar {...resolveUser(profiles, r.username)} size="md" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{resolveUser(profiles, r.username).name}</div>
                  </div>
                  <Stars value={r.score} />
                </div>
                {r.comment && (
                  <div style={{ fontSize: 14, lineHeight: 1.45, color: 'var(--ink-soft)', fontStyle: 'italic' }}>
                    &quot;{r.comment}&quot;
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── UPCOMING without movie ── */}
      {screening.status === 'upcoming' && !screening.title && (
        <div className="card" style={{ padding: 32, textAlign: 'center', borderLeft: '3px solid var(--accent)' }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Votación abierta</div>
          <p style={{ color: 'var(--ink-soft)', fontSize: 16, margin: '0 0 20px' }}>
            La película para esta función todavía se está votando. ¡Sumate a elegir!
          </p>
          <Link href="/votacion" className="btn btn-primary">Ver candidatas y votar →</Link>
        </div>
      )}

      <style>{`
        @keyframes pop { 0% { transform: scale(0); } 100% { transform: scale(1); } }
        @media (max-width: 900px) {
          .detalle-grid { grid-template-columns: 1fr !important; }
          .rating-block { grid-template-columns: 1fr !important; }
          .myrating { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
