'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { ScreeningRow } from '@/lib/data';
import { Poster } from '@/components/Poster';
import { Stars } from '@/components/Stars';
import { SectionHeader } from '@/components/SectionHeader';
import { Avatar } from '@/components/Avatar';
import { useProfiles, resolveUser } from '@/lib/useProfiles';

type Score = { id: number; username: string; score: number; comment: string | null; createdAt: number | null };

function formatDate(d: string) {
  const date = new Date(d + 'T00:00:00');
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function DetalleClient({ screening, scores: initialScores, username }: { screening: ScreeningRow; scores: Score[]; username: string | null }) {
  const [scores, setScores] = useState(initialScores);
  const [filterStar, setFilterStar] = useState<number | null>(null);
  const profiles = useProfiles();
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [publishing, setPublishing] = useState(false);

  const avg = scores.length ? scores.reduce((s, r) => s + r.score, 0) / scores.length : 0;
  const distribution = [5, 4, 3, 2, 1].map((s) => ({
    s,
    count: scores.filter((r) => r.score === s).length,
  }));
  const maxCount = Math.max(...distribution.map((d) => d.count), 1);
  const filtered = filterStar ? scores.filter((r) => r.score === filterStar) : scores;
  const myScore = username ? scores.find((s) => s.username === username) : null;

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
      setMyRating(0);
      setMyComment('');
    }
    setPublishing(false);
  };

  return (
    <div className="page-enter shell" style={{ paddingTop: 24 }}>
      <Link href="/calendario" className="btn btn-ghost btn-sm" style={{ marginBottom: 24, display: 'inline-flex' }}>
        ← Calendario
      </Link>

      {/* Header */}
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
              <div>
                <Stars value={Math.round(avg)} size="xl" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {distribution.map((d) => (
                  <div key={d.s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', width: 16 }}>{d.s}★</span>
                    <div
                      onClick={() => setFilterStar(filterStar === d.s ? null : d.s)}
                      style={{ flex: 1, height: 5, background: 'var(--line)', borderRadius: 3, cursor: 'pointer', overflow: 'hidden', opacity: filterStar && filterStar !== d.s ? 0.3 : 1 }}
                    >
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

      {/* MY RATING */}
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
            placeholder={myScore?.comment ? myScore.comment : '¿Qué te pareció?'}
            style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1.5px solid var(--line)', fontSize: 18, color: 'var(--ink)', padding: '8px 0', outline: 'none' }}
          />
          <button className="btn btn-primary" disabled={!myRating || publishing} onClick={handlePublish}>
            {publishing ? '…' : myScore ? 'Actualizar' : 'Publicar'}
          </button>
        </div>
      )}

      {/* REVIEWS */}
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

      {screening.status === 'upcoming' && screening.title && (
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Función próxima</div>
          <p style={{ color: 'var(--ink-soft)', fontSize: 16, margin: 0 }}>Los puntajes y comentarios estarán disponibles después de la función.</p>
        </div>
      )}
      {screening.status === 'upcoming' && !screening.title && (
        <div className="card" style={{ padding: 32, textAlign: 'center', borderLeft: '3px solid var(--accent)' }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Votación abierta</div>
          <p style={{ color: 'var(--ink-soft)', fontSize: 16, margin: '0 0 20px' }}>La película para esta función todavía se está votando. ¡Sumate a elegir!</p>
          <Link href="/votacion" className="btn btn-primary">Ver candidatas y votar →</Link>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .detalle-grid { grid-template-columns: 1fr !important; }
          .rating-block { grid-template-columns: 1fr !important; }
          .myrating { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
