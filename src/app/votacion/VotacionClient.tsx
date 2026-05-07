'use client';
import { useState } from 'react';
import type { ScreeningRow } from '@/lib/data';
import { Poster } from '@/components/Poster';
import { Avatar, AvatarStack } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { useProfiles, resolveUser } from '@/lib/useProfiles';

type Candidate = {
  id: number; title: string; year: number | null; director: string | null;
  duration: number | null; genre: string | null; posterHue: number | null;
  posterPath: string | null; suggestedBy: string; reason: string | null;
  voters: string[]; totalVotos: number;
};

function formatDate(d: string) {
  const date = new Date(d + 'T00:00:00');
  return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function VotacionClient({ screening, candidates: initialCandidates, username, movieAssigned }: { screening: ScreeningRow; candidates: Candidate[]; username: string | null; movieAssigned?: boolean }) {
  const [candidates, setCandidates] = useState(initialCandidates);
  const [myVote, setMyVote] = useState<number | null>(
    username ? (initialCandidates.find((c) => c.voters.includes(username))?.id ?? null) : null
  );
  const profiles = useProfiles();

  const total = candidates.reduce((s, c) => s + c.totalVotos, 0);
  const winner = [...candidates].sort((a, b) => b.totalVotos - a.totalVotos)[0];

  const handleVote = async (recId: number) => {
    if (!username) return;
    const res = await fetch('/api/votacion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ screeningId: screening.id, recommendationId: recId }),
    });
    if (res.ok) {
      const { voted, changed } = await res.json();
      const prevVote = myVote;
      setCandidates((prev) => prev.map((c) => {
        if (c.id === recId) {
          const voters = voted
            ? [...c.voters, username]
            : c.voters.filter((v) => v !== username);
          return { ...c, voters, totalVotos: voters.length };
        }
        if (changed && c.id === prevVote) {
          const voters = c.voters.filter((v) => v !== username);
          return { ...c, voters, totalVotos: voters.length };
        }
        return c;
      }).sort((a, b) => b.totalVotos - a.totalVotos));
      setMyVote(voted ? recId : null);
    }
  };

  if (movieAssigned) {
    return (
      <div className="page-enter shell" style={{ paddingTop: 32 }}>
        <div style={{ position: 'relative', background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '32px 36px', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 4, background: 'var(--accent)' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 28, alignItems: 'center' }} className="vote-hero">
            <Poster label={(screening.title ?? '').toUpperCase()} hue={screening.posterHue ?? 200} posterPath={screening.posterPath ?? null} />
            <div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <Badge kind="accent">Ya elegida</Badge>
              </div>
              <h1 className="h-display" style={{ fontSize: 'clamp(32px, 4vw, 56px)', margin: '0 0 8px', textTransform: 'uppercase' }}>
                {screening.title}
                {screening.year && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 400, color: 'var(--ink-mute)', marginLeft: 12, textTransform: 'none' }}>&apos;{String(screening.year).slice(2)}</span>}
              </h1>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
                {screening.director && `dir. ${screening.director}`}{screening.duration ? ` · ${screening.duration} min` : ''}{screening.genre ? ` · ${screening.genre}` : ''}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {formatDate(screening.scheduledDate)}{screening.hour ? ` · ${screening.hour}` : ''}
                {screening.location ? ` · ${screening.location}` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter shell" style={{ paddingTop: 32 }}>
      {/* Banner */}
      <div style={{ position: 'relative', background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '32px 36px', marginBottom: 32, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 4, background: 'var(--accent)' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'end' }} className="vote-hero">
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <Badge kind="live accent">Votación abierta</Badge>
            </div>
            <h1 className="h-display" style={{ fontSize: 'clamp(40px, 5vw, 64px)', margin: '0 0 10px', textTransform: 'uppercase' }}>
              ¿Qué vemos<br />el <span style={{ color: 'var(--accent)' }}>{formatDate(screening.scheduledDate).split(',')[0]}</span>?
            </h1>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {formatDate(screening.scheduledDate)} · {total} votos · {candidates.length} candidatas
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }} className="vote-grid">
        {candidates.map((c) => {
          const isMyVote = myVote === c.id;
          const isWinning = c.id === winner?.id && c.totalVotos > 0;
          const pct = total > 0 ? (c.totalVotos / total) * 100 : 0;
          return (
            <div
              key={c.id}
              onClick={() => handleVote(c.id)}
              className="card"
              style={{ padding: 18, cursor: username ? 'pointer' : 'default', borderLeft: `${isWinning || isMyVote ? 3 : 1}px solid ${isWinning ? 'var(--accent)' : isMyVote ? 'var(--accent)' : 'var(--line)'}`, position: 'relative', transition: 'border-color 0.15s ease' }}
            >
              {isWinning && (
                <div style={{ position: 'absolute', top: 12, right: 12, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
                  ★ liderando
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 14, marginBottom: 14 }}>
                <Poster label={(c.title ?? '').toUpperCase().slice(0, 10)} hue={c.posterHue ?? 200} posterPath={c.posterPath} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: 22, lineHeight: 1.05, textTransform: 'uppercase', letterSpacing: '-0.01em', marginBottom: 4 }}>
                    {c.title}
                    {c.year && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 400, color: 'var(--ink-mute)', marginLeft: 8, textTransform: 'none' }}>&apos;{String(c.year).slice(2)}</span>}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                    {c.director && `dir. ${c.director}`}{c.duration ? ` · ${c.duration} min` : ''}{c.genre ? ` · ${c.genre}` : ''}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-soft)' }}>
                    <Avatar {...resolveUser(profiles, c.suggestedBy)} size="sm" />
                    <span>sugerida por {resolveUser(profiles, c.suggestedBy).name}</span>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <span className="h-display" style={{ fontSize: 28, color: isWinning ? 'var(--accent)' : 'var(--ink)' }}>{c.totalVotos}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>{pct.toFixed(0)}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--line)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.4s ease' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <AvatarStack names={c.voters.slice(0, 8)} max={8} size="sm" profiles={profiles} />
                {username && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleVote(c.id); }}
                    className="btn btn-sm"
                    style={isMyVote ? { background: 'var(--accent)', color: 'var(--bg)', borderColor: 'var(--accent)', fontWeight: 700 } : {}}
                  >
                    {isMyVote ? '✓ Tu voto' : '↑ Votar'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {candidates.length === 0 && (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Sin candidatas aún</div>
          <p style={{ color: 'var(--ink-mute)', margin: '0 0 20px' }}>
            Sugerí películas para poder votar la próxima función.
          </p>
          <a href="/watchlist" className="btn btn-primary btn-sm">Ir a sugeridos →</a>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .vote-grid { grid-template-columns: 1fr !important; }
          .vote-hero { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
