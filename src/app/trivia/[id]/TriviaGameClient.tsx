'use client';
import { useEffect, useState, useCallback } from 'react';
import { Avatar } from '@/components/Avatar';

type Option = { id: number; text: string; isCorrect?: boolean; order: number };
type Question = { id: number; text: string; type: string; points: number; options: Option[]; imageUrl?: string };
type Member = { userId: number; displayName: string | null; username: string; avatar: string | null };
type Team = { id: number; name: string; color: string; score: number; members: Member[] };
type GameState = {
  status: 'draft' | 'lobby' | 'active' | 'finished';
  currentQuestionIndex: number;
  questionCount: number;
  currentQuestion: Question | null;
  teams: Team[];
  myTeamId: number | null;
  myAnswer: { optionId: number | null; isCorrect: boolean } | null;
};

const POLL_INTERVAL = 2500;

export default function TriviaGameClient({ gameId, userId }: { gameId: string; userId: number }) {
  const [state, setState] = useState<GameState | null>(null);
  const [joiningTeam, setJoiningTeam] = useState<number | null>(null);
  const [answering, setAnswering] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchState = useCallback(async () => {
    const res = await fetch(`/api/trivia/${gameId}/state`);
    if (res.ok) {
      const data = await res.json();
      setState(data);
    }
  }, [gameId]);

  useEffect(() => {
    fetchState();
    const iv = setInterval(fetchState, POLL_INTERVAL);
    return () => clearInterval(iv);
  }, [fetchState]);

  const joinTeam = async (teamId: number) => {
    setJoiningTeam(teamId);
    setError(null);
    const res = await fetch(`/api/trivia/${gameId}/teams/${teamId}/join`, { method: 'POST' });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? 'Error al unirse al equipo');
    }
    await fetchState();
    setJoiningTeam(null);
  };

  const submitAnswer = async (optionId: number) => {
    if (answering) return;
    setAnswering(optionId);
    setError(null);
    const res = await fetch(`/api/trivia/${gameId}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionId }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? 'Error al enviar respuesta');
    }
    await fetchState();
    setAnswering(null);
  };

  if (!state) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: 'var(--ink-mute)' }}>
        Cargando…
      </div>
    );
  }

  if (state.status === 'draft') {
    return (
      <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
        <div style={{ fontWeight: 700, fontSize: 20 }}>El juego todavía no está listo</div>
        <div style={{ color: 'var(--ink-mute)', marginTop: 8 }}>El admin está preparando las preguntas.</div>
      </div>
    );
  }

  if (state.status === 'lobby') return <LobbyView state={state} userId={userId} onJoin={joinTeam} joiningTeam={joiningTeam} error={error} />;
  if (state.status === 'active') return <ActiveView state={state} userId={userId} onAnswer={submitAnswer} answering={answering} error={error} />;
  if (state.status === 'finished') return <FinishedView state={state} userId={userId} />;

  return null;
}

function LobbyView({ state, userId, onJoin, joiningTeam, error }: {
  state: GameState;
  userId: number;
  onJoin: (id: number) => void;
  joiningTeam: number | null;
  error: string | null;
}) {
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '32px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
          Lobby
        </div>
        <div style={{ fontWeight: 800, fontSize: 26, marginBottom: 8 }}>Elegí tu equipo</div>
        <div style={{ color: 'var(--ink-mute)', fontSize: 14 }}>El admin va a arrancar el juego pronto.</div>
      </div>

      {error && <div style={{ color: 'var(--hot)', fontSize: 14, marginBottom: 16, textAlign: 'center' }}>{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {state.teams.map((team) => {
          const isMine = state.myTeamId === team.id;
          const isJoining = joiningTeam === team.id;
          return (
            <div
              key={team.id}
              style={{
                background: 'var(--bg-card)',
                border: `2px solid ${isMine ? team.color : 'var(--line)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: '16px 18px',
                transition: 'border-color 0.15s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: team.members.length ? 12 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: team.color, flexShrink: 0 }} />
                  <span style={{ fontWeight: 700, fontSize: 17 }}>{team.name}</span>
                  {isMine && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: team.color, border: `1px solid ${team.color}`, borderRadius: 999, padding: '2px 8px' }}>
                      Tu equipo
                    </span>
                  )}
                </div>
                {!isMine && (
                  <button
                    onClick={() => onJoin(team.id)}
                    disabled={isJoining}
                    style={{
                      background: team.color,
                      color: '#fff',
                      border: 'none',
                      borderRadius: 'var(--radius)',
                      padding: '7px 16px',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer',
                      opacity: isJoining ? 0.6 : 1,
                    }}
                  >
                    {isJoining ? '…' : 'Unirme'}
                  </button>
                )}
              </div>
              {team.members.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {team.members.map((m) => (
                    <div key={m.userId} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-elev)', borderRadius: 999, padding: '3px 10px 3px 4px' }}>
                      <Avatar name={m.displayName ?? m.username} avatarId={m.avatar} size="sm" />
                      <span style={{ fontSize: 12, color: m.userId === userId ? 'var(--accent)' : 'var(--ink-soft)' }}>
                        {m.displayName ?? m.username}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {state.teams.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--ink-mute)', padding: '40px 0' }}>
          El admin está configurando los equipos…
        </div>
      )}
    </div>
  );
}

function ActiveView({ state, userId, onAnswer, answering, error }: {
  state: GameState;
  userId: number;
  onAnswer: (optionId: number) => void;
  answering: number | null;
  error: string | null;
}) {
  const q = state.currentQuestion;
  const answered = !!state.myAnswer;
  const myTeam = state.teams.find((t) => t.id === state.myTeamId);

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '24px 20px 100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Pregunta {state.currentQuestionIndex + 1} / {state.questionCount}
        </div>
        {myTeam && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: myTeam.color }} />
            {myTeam.name}
          </div>
        )}
      </div>

      {/* Question */}
      {q ? (
        <>
          {q.imageUrl && (
            <img
              src={q.imageUrl}
              alt=""
              style={{ width: '100%', borderRadius: 'var(--radius-lg)', marginBottom: 20, maxHeight: 240, objectFit: 'cover' }}
            />
          )}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px 20px',
            marginBottom: 20,
          }}>
            <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.3 }}>{q.text}</div>
            {q.points > 1 && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', marginTop: 10 }}>
                {q.points} puntos
              </div>
            )}
          </div>

          {q.type === 'multiple_choice' && !answered && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {error && <div style={{ color: 'var(--hot)', fontSize: 13, marginBottom: 4 }}>{error}</div>}
              {q.options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => onAnswer(opt.id)}
                  disabled={!!answering}
                  style={{
                    background: answering === opt.id ? 'var(--accent)' : 'var(--bg-card)',
                    border: '2px solid var(--line)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontSize: 16,
                    fontWeight: 600,
                    color: answering === opt.id ? 'var(--bg)' : 'var(--ink)',
                    cursor: answering ? 'wait' : 'pointer',
                    transition: 'all 0.12s',
                    width: '100%',
                  }}
                >
                  {opt.text}
                </button>
              ))}
            </div>
          )}

          {q.type === 'multiple_choice' && answered && (
            <AnswerFeedback answer={state.myAnswer} options={q.options} />
          )}

          {q.type === 'open' && (
            <div style={{
              background: 'var(--bg-elev)',
              border: '1px dashed var(--line)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              textAlign: 'center',
              color: 'var(--ink-mute)',
              fontSize: 15,
            }}>
              Respondé en voz alta — el moderador marca los puntos
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center', color: 'var(--ink-mute)', padding: '60px 0' }}>
          Esperando la siguiente pregunta…
        </div>
      )}

      {/* Scoreboard sticky */}
      <Scoreboard teams={state.teams} myTeamId={state.myTeamId} />
    </div>
  );
}

function AnswerFeedback({ answer, options }: { answer: GameState['myAnswer']; options: Option[] }) {
  const selectedOption = options.find((o) => o.id === answer?.optionId);
  const correct = answer?.isCorrect;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {options.map((opt) => {
        const isSelected = opt.id === answer?.optionId;
        const isCorrectOpt = opt.isCorrect;
        let bg = 'var(--bg-card)';
        let border = 'var(--line)';
        let color = 'var(--ink-soft)';
        if (isCorrectOpt) { bg = 'rgba(80,200,120,0.15)'; border = '#50c878'; color = '#50c878'; }
        if (isSelected && !correct) { bg = 'rgba(255,90,95,0.15)'; border = 'var(--hot)'; color = 'var(--hot)'; }

        return (
          <div
            key={opt.id}
            style={{
              background: bg,
              border: `2px solid ${border}`,
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              fontSize: 16,
              fontWeight: isSelected || isCorrectOpt ? 700 : 500,
              color,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {opt.text}
            {isSelected && <span>{correct ? '✓' : '✗'}</span>}
          </div>
        );
      })}
      <div style={{ textAlign: 'center', fontWeight: 800, fontSize: 20, marginTop: 8, color: correct ? '#50c878' : 'var(--hot)' }}>
        {correct ? '¡Correcto!' : 'Incorrecto'}
      </div>
    </div>
  );
}

function Scoreboard({ teams, myTeamId }: { teams: Team[]; myTeamId: number | null }) {
  const sorted = [...teams].sort((a, b) => b.score - a.score);
  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'rgba(20,24,28,0.96)',
      backdropFilter: 'blur(12px)',
      borderTop: '1px solid var(--line)',
      padding: '12px 20px',
      paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
    }}>
      <div style={{ maxWidth: 520, margin: '0 auto', display: 'flex', gap: 8, overflowX: 'auto' }}>
        {sorted.map((team) => (
          <div key={team.id} style={{
            flex: '0 0 auto',
            background: myTeamId === team.id ? team.color : 'var(--bg-card)',
            borderRadius: 'var(--radius)',
            padding: '8px 14px',
            textAlign: 'center',
            minWidth: 80,
          }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: myTeamId === team.id ? '#fff' : 'var(--ink)', lineHeight: 1 }}>
              {team.score}
            </div>
            <div style={{ fontSize: 11, color: myTeamId === team.id ? 'rgba(255,255,255,0.8)' : 'var(--ink-mute)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 80 }}>
              {team.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FinishedView({ state, userId }: { state: GameState; userId: number }) {
  const sorted = [...state.teams].sort((a, b) => b.score - a.score);
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
        <div style={{ fontWeight: 800, fontSize: 28, marginBottom: 8 }}>Resultados</div>
        <div style={{ color: 'var(--ink-mute)', fontSize: 15 }}>¡El juego terminó!</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sorted.map((team, i) => {
          const isMine = state.myTeamId === team.id;
          return (
            <div
              key={team.id}
              style={{
                background: i === 0 ? 'rgba(228,98,23,0.1)' : 'var(--bg-card)',
                border: `2px solid ${i === 0 ? 'var(--accent)' : isMine ? team.color : 'var(--line)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <div style={{ fontSize: 28, width: 36, textAlign: 'center', flexShrink: 0 }}>{medals[i] ?? i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: team.color }} />
                  <span style={{ fontWeight: 700, fontSize: 17 }}>{team.name}</span>
                  {isMine && <span style={{ fontSize: 11, color: 'var(--ink-mute)' }}>(tu equipo)</span>}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {team.members.map((m) => (
                    <span key={m.userId} style={{ fontSize: 12, color: 'var(--ink-mute)' }}>
                      {m.displayName ?? m.username}
                      {m.userId !== team.members[team.members.length - 1].userId ? ', ' : ''}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ fontWeight: 900, fontSize: 28, color: i === 0 ? 'var(--accent)' : 'var(--ink)', flexShrink: 0 }}>
                {team.score}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
