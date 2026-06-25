'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

type Option = { id: number; text: string; isCorrect: boolean; order: number };
type Question = { id: number; text: string; type: string; points: number; options: Option[]; imageUrl?: string };
type Member = { userId: number; displayName: string | null; username: string };
type Team = { id: number; name: string; color: string; score: number; members: Member[] };
type AdminGameState = {
  status: 'draft' | 'lobby' | 'active' | 'finished';
  currentQuestionIndex: number;
  questionCount: number;
  currentQuestion: Question | null;
  teams: Team[];
  myTeamId: number | null;
  myAnswer: null;
};

const POLL_INTERVAL = 2500;

export default function TriviaModerator({ gameId }: { gameId: string }) {
  const [state, setState] = useState<AdminGameState | null>(null);
  const [gameName, setGameName] = useState('Trivia');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [awardingTeam, setAwardingTeam] = useState<number | null>(null);

  const fetchState = useCallback(async () => {
    const res = await fetch(`/api/trivia/${gameId}/state`);
    if (res.ok) {
      const data = await res.json();
      setState(data);
    }
  }, [gameId]);

  useEffect(() => {
    fetch(`/api/trivia/${gameId}`).then((r) => r.json()).then((d) => setGameName(d.name ?? 'Trivia'));
    fetchState();
    const iv = setInterval(fetchState, POLL_INTERVAL);
    return () => clearInterval(iv);
  }, [gameId, fetchState]);

  const advance = async () => {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/trivia/${gameId}/advance`, { method: 'POST' });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? 'Error');
    }
    await fetchState();
    setLoading(false);
  };

  const award = async (teamId: number, questionId: number) => {
    setAwardingTeam(teamId);
    setError(null);
    const res = await fetch(`/api/trivia/${gameId}/award`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId, questionId }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? 'Error al adjudicar');
    }
    await fetchState();
    setAwardingTeam(null);
  };

  if (!state) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 20px', color: 'var(--ink-mute)' }}>Cargando…</div>;
  }

  const q = state.currentQuestion;
  const isLast = state.currentQuestionIndex >= state.questionCount - 1;

  const advanceLabel = () => {
    if (state.status === 'draft') return 'Abrir lobby';
    if (state.status === 'lobby') return 'Iniciar juego';
    if (state.status === 'active' && isLast) return 'Finalizar juego';
    if (state.status === 'active') return 'Siguiente pregunta →';
    return null;
  };

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '20px 16px 120px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Link href="/admin" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', textDecoration: 'none' }}>
            ← Admin
          </Link>
          <div style={{ fontWeight: 800, fontSize: 20, marginTop: 4 }}>{gameName}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link
            href={`/admin/trivia/${gameId}/edit`}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase',
              letterSpacing: '0.08em', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)',
              padding: '5px 10px', textDecoration: 'none',
            }}
          >
            Editar
          </Link>
          <StatusBadge status={state.status} />
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(255,90,95,0.1)', border: '1px solid var(--hot)', borderRadius: 'var(--radius)', padding: '10px 14px', color: 'var(--hot)', marginBottom: 16, fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* Question area */}
      {state.status === 'draft' && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--ink-mute)' }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>🎬</div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>Juego en borrador</div>
          <div style={{ fontSize: 14, marginTop: 8 }}>Abrí el lobby cuando estés listo para que los jugadores entren.</div>
        </div>
      )}

      {state.status === 'lobby' && (
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            Jugadores en el lobby
          </div>
          <TeamsDisplay teams={state.teams} />
        </div>
      )}

      {state.status === 'active' && q && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-mute)' }}>
              Pregunta {state.currentQuestionIndex + 1} / {state.questionCount}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {q.type === 'multiple_choice' ? 'Multiple choice' : 'Abierta'} · {q.points}pt
            </div>
          </div>

          {/* Question text */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px 20px',
            marginBottom: 20,
          }}>
            <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.3 }}>{q.text}</div>
          </div>

          {/* Options (MC) */}
          {q.type === 'multiple_choice' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {q.options.map((opt) => (
                <div
                  key={opt.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    background: opt.isCorrect ? 'rgba(80,200,120,0.1)' : 'var(--bg-elev)',
                    border: `1px solid ${opt.isCorrect ? '#50c878' : 'var(--line)'}`,
                    borderRadius: 'var(--radius)',
                    padding: '12px 16px',
                  }}
                >
                  {opt.isCorrect && <span style={{ color: '#50c878', fontWeight: 700, flexShrink: 0 }}>✓</span>}
                  <span style={{ flex: 1, fontWeight: opt.isCorrect ? 700 : 400, color: opt.isCorrect ? '#50c878' : 'var(--ink-soft)' }}>
                    {opt.text}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Award buttons (open questions) */}
          {q.type === 'open' && (
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                ¿Quién acertó?
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {state.teams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => award(team.id, q.id)}
                    disabled={awardingTeam === team.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      background: 'var(--bg-card)',
                      border: `2px solid ${team.color}`,
                      borderRadius: 'var(--radius-lg)',
                      padding: '12px 18px',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: 15,
                      color: team.color,
                      flex: '1 1 auto',
                      minWidth: 130,
                      justifyContent: 'center',
                      opacity: awardingTeam === team.id ? 0.6 : 1,
                      transition: 'opacity 0.1s',
                    }}
                  >
                    <span>✓</span>
                    <span>{team.name}</span>
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 20 }}>
                <TeamsDisplay teams={state.teams} compact />
              </div>
            </div>
          )}

          {q.type === 'multiple_choice' && (
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                Puntajes
              </div>
              <TeamsDisplay teams={state.teams} compact />
            </div>
          )}
        </div>
      )}

      {state.status === 'finished' && (
        <div>
          <div style={{ textAlign: 'center', padding: '40px 0 24px', fontSize: 36 }}>🏆</div>
          <TeamsDisplay teams={state.teams} showPodium />
        </div>
      )}

      {/* Sticky footer with advance button */}
      {advanceLabel() && (
        <div style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          padding: '16px 20px',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
          background: 'rgba(20,24,28,0.96)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid var(--line)',
        }}>
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <button
              onClick={advance}
              disabled={loading}
              style={{
                width: '100%',
                background: state.status === 'active' && isLast ? 'var(--bg-card)' : 'var(--accent)',
                border: state.status === 'active' && isLast ? '2px solid var(--hot)' : 'none',
                color: state.status === 'active' && isLast ? 'var(--hot)' : 'white',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                fontSize: 17,
                fontWeight: 800,
                cursor: loading ? 'wait' : 'pointer',
                opacity: loading ? 0.7 : 1,
                letterSpacing: '-0.01em',
              }}
            >
              {loading ? '…' : advanceLabel()}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: 'var(--ink-mute)',
    lobby: 'var(--warm)',
    active: 'var(--accent)',
    finished: '#50c878',
  };
  const labels: Record<string, string> = {
    draft: 'Borrador',
    lobby: 'Lobby',
    active: 'En juego',
    finished: 'Finalizado',
  };
  return (
    <div style={{
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      color: colors[status] ?? 'var(--ink-mute)',
      border: `1px solid ${colors[status] ?? 'var(--line)'}`,
      borderRadius: 999,
      padding: '3px 10px',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
    }}>
      {labels[status] ?? status}
    </div>
  );
}

function TeamsDisplay({ teams, compact, showPodium }: { teams: Team[]; compact?: boolean; showPodium?: boolean }) {
  const sorted = showPodium ? [...teams].sort((a, b) => b.score - a.score) : teams;
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {sorted.map((team, i) => (
        <div
          key={team.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'var(--bg-card)',
            border: `1px solid ${team.color}22`,
            borderRadius: 'var(--radius)',
            padding: compact ? '10px 14px' : '14px 16px',
          }}
        >
          {showPodium && <span style={{ fontSize: 20, flexShrink: 0 }}>{medals[i] ?? `#${i + 1}`}</span>}
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: team.color, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{team.name}</div>
            {!compact && team.members.length > 0 && (
              <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 3 }}>
                {team.members.map((m) => m.displayName ?? m.username).join(', ')}
              </div>
            )}
          </div>
          <div style={{ fontWeight: 900, fontSize: showPodium ? 26 : 20, color: team.color }}>
            {team.score}
          </div>
        </div>
      ))}
    </div>
  );
}
