'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Option = { id?: number; text: string; isCorrect: boolean };
type Question = { id?: number; text: string; type: 'multiple_choice' | 'open'; points: number; options: Option[] };
type Team = { id?: number; name: string; color: string };

const TEAM_COLORS = ['#e46217', '#6FB3FF', '#50c878', '#FFD700', '#FF5A5F', '#C084FC', '#F97316', '#22D3EE'];

export default function TriviaEditor({ gameId }: { gameId: string }) {
  const router = useRouter();
  const [gameName, setGameName] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'preguntas' | 'equipos'>('preguntas');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/trivia/${gameId}`)
      .then((r) => r.json())
      .then((data) => {
        setGameName(data.name ?? '');
        setQuestions(
          (data.questions ?? []).map((q: Question & { options: Option[] }) => ({
            id: q.id,
            text: q.text,
            type: q.type ?? 'open',
            points: q.points ?? 1,
            options: (q.options ?? []).map((o: Option) => ({ id: (o as Option & { id?: number }).id, text: o.text, isCorrect: o.isCorrect })),
          }))
        );
        setTeams(
          (data.teams ?? []).map((t: Team) => ({ id: (t as Team & { id?: number }).id, name: t.name, color: t.color }))
        );
        setLoaded(true);
      });
  }, [gameId]);

  const saveAll = async () => {
    setSaving(true);
    setError(null);

    // Update game name
    await fetch(`/api/trivia/${gameId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: gameName }),
    });

    // Sync questions — delete existing ones not in our list, upsert rest
    // Simplest: delete all and re-insert (game not started yet)
    const existingRes = await fetch(`/api/trivia/${gameId}/questions`);
    const existingQs: (Question & { id: number })[] = existingRes.ok ? await existingRes.json() : [];

    // Delete questions that are no longer present
    const keepIds = new Set(questions.filter((q) => q.id).map((q) => q.id));
    for (const eq of existingQs) {
      if (!keepIds.has(eq.id)) {
        await fetch(`/api/trivia/${gameId}/questions/${eq.id}`, { method: 'DELETE' });
      }
    }

    // Upsert each question in order
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const payload = { text: q.text, type: q.type, points: q.points, order: i, options: q.options };
      if (q.id) {
        await fetch(`/api/trivia/${gameId}/questions/${q.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch(`/api/trivia/${gameId}/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
    }

    // Sync teams
    const existingTeamsRes = await fetch(`/api/trivia/${gameId}/teams`);
    const existingTeams: (Team & { id: number })[] = existingTeamsRes.ok ? await existingTeamsRes.json() : [];
    const keepTeamIds = new Set(teams.filter((t) => t.id).map((t) => t.id));
    for (const et of existingTeams) {
      if (!keepTeamIds.has(et.id)) {
        await fetch(`/api/trivia/${gameId}/teams/${et.id}`, { method: 'DELETE' });
      }
    }
    for (const t of teams) {
      if (t.id) {
        await fetch(`/api/trivia/${gameId}/teams/${t.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: t.name, color: t.color }),
        });
      } else {
        await fetch(`/api/trivia/${gameId}/teams`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: t.name, color: t.color }),
        });
      }
    }

    setSaving(false);
    router.push(`/admin/trivia/${gameId}`);
  };

  const addQuestion = () => {
    setQuestions((prev) => [...prev, { text: '', type: 'open', points: 1, options: [] }]);
  };

  const removeQuestion = (i: number) => setQuestions((prev) => prev.filter((_, idx) => idx !== i));

  const updateQuestion = (i: number, patch: Partial<Question>) => {
    setQuestions((prev) => prev.map((q, idx) => idx === i ? { ...q, ...patch } : q));
  };

  const addOption = (qi: number) => {
    setQuestions((prev) => prev.map((q, idx) => idx === qi
      ? { ...q, options: [...q.options, { text: '', isCorrect: false }] }
      : q
    ));
  };

  const removeOption = (qi: number, oi: number) => {
    setQuestions((prev) => prev.map((q, idx) => idx === qi
      ? { ...q, options: q.options.filter((_, oidx) => oidx !== oi) }
      : q
    ));
  };

  const updateOption = (qi: number, oi: number, patch: Partial<Option>) => {
    setQuestions((prev) => prev.map((q, idx) => idx === qi
      ? { ...q, options: q.options.map((o, oidx) => oidx === oi ? { ...o, ...patch } : o) }
      : q
    ));
  };

  const addTeam = () => {
    const color = TEAM_COLORS[teams.length % TEAM_COLORS.length];
    setTeams((prev) => [...prev, { name: `Equipo ${prev.length + 1}`, color }]);
  };

  const removeTeam = (i: number) => setTeams((prev) => prev.filter((_, idx) => idx !== i));
  const updateTeam = (i: number, patch: Partial<Team>) => setTeams((prev) => prev.map((t, idx) => idx === i ? { ...t, ...patch } : t));

  if (!loaded) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 20px', color: 'var(--ink-mute)' }}>Cargando…</div>;
  }

  const inputStyle = {
    width: '100%',
    background: 'var(--bg-elev)',
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius)',
    padding: '10px 12px',
    color: 'var(--ink)',
    fontSize: 15,
    fontFamily: 'inherit',
  } as const;

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px 120px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <Link href={`/admin/trivia/${gameId}`} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', textDecoration: 'none' }}>
            ← Moderador
          </Link>
          <div style={{ fontWeight: 800, fontSize: 20, marginTop: 4 }}>Editar trivia</div>
        </div>
      </div>

      {error && <div style={{ color: 'var(--hot)', marginBottom: 16, fontSize: 14 }}>{error}</div>}

      {/* Game name */}
      <div style={{ marginBottom: 28 }}>
        <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          Nombre del juego
        </label>
        <input
          style={inputStyle}
          value={gameName}
          onChange={(e) => setGameName(e.target.value)}
          placeholder="Ej: Trivia Diciembre 2025"
        />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg-elev)', borderRadius: 'var(--radius)', padding: 4 }}>
        {(['preguntas', 'equipos'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              background: activeTab === tab ? 'var(--bg-card)' : 'transparent',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: '8px',
              fontWeight: activeTab === tab ? 700 : 500,
              fontSize: 14,
              color: activeTab === tab ? 'var(--ink)' : 'var(--ink-mute)',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {tab} {tab === 'preguntas' ? `(${questions.length})` : `(${teams.length})`}
          </button>
        ))}
      </div>

      {/* Questions tab */}
      {activeTab === 'preguntas' && (
        <div>
          {questions.map((q, qi) => (
            <div
              key={qi}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                marginBottom: 12,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>
                  #{qi + 1}
                </div>
                <button
                  onClick={() => removeQuestion(qi)}
                  style={{ background: 'none', border: 'none', color: 'var(--hot)', fontSize: 12, cursor: 'pointer', padding: '2px 6px' }}
                >
                  Eliminar
                </button>
              </div>

              <textarea
                style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }}
                value={q.text}
                onChange={(e) => updateQuestion(qi, { text: e.target.value })}
                placeholder="Texto de la pregunta"
              />

              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--ink-mute)', marginBottom: 4 }}>Tipo</label>
                  <select
                    style={{ ...inputStyle, cursor: 'pointer' }}
                    value={q.type}
                    onChange={(e) => updateQuestion(qi, { type: e.target.value as 'multiple_choice' | 'open', options: [] })}
                  >
                    <option value="open">Abierta (verbal)</option>
                    <option value="multiple_choice">Múltiple opción</option>
                  </select>
                </div>
                <div style={{ width: 80 }}>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--ink-mute)', marginBottom: 4 }}>Puntos</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    style={{ ...inputStyle, textAlign: 'center' }}
                    value={q.points}
                    onChange={(e) => updateQuestion(qi, { points: Number(e.target.value) })}
                  />
                </div>
              </div>

              {q.type === 'multiple_choice' && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginBottom: 8 }}>Opciones</div>
                  {q.options.map((opt, oi) => (
                    <div key={oi} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                      <button
                        onClick={() => updateOption(qi, oi, { isCorrect: !opt.isCorrect })}
                        title="Marcar como correcta"
                        style={{
                          width: 24, height: 24, borderRadius: '50%', border: `2px solid ${opt.isCorrect ? '#50c878' : 'var(--line)'}`,
                          background: opt.isCorrect ? '#50c878' : 'transparent', cursor: 'pointer', flexShrink: 0,
                          color: opt.isCorrect ? '#fff' : 'transparent', fontSize: 12, fontWeight: 700,
                        }}
                      >
                        ✓
                      </button>
                      <input
                        style={{ ...inputStyle, flex: 1, fontSize: 14, padding: '7px 10px' }}
                        value={opt.text}
                        onChange={(e) => updateOption(qi, oi, { text: e.target.value })}
                        placeholder={`Opción ${oi + 1}`}
                      />
                      <button
                        onClick={() => removeOption(qi, oi)}
                        style={{ background: 'none', border: 'none', color: 'var(--ink-mute)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '4px' }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addOption(qi)}
                    style={{ background: 'none', border: '1px dashed var(--line)', borderRadius: 'var(--radius)', padding: '7px 14px', color: 'var(--ink-mute)', cursor: 'pointer', width: '100%', marginTop: 4, fontSize: 13 }}
                  >
                    + Agregar opción
                  </button>
                </div>
              )}
            </div>
          ))}

          <button
            onClick={addQuestion}
            style={{
              width: '100%', background: 'none', border: '2px dashed var(--line)', borderRadius: 'var(--radius-lg)',
              padding: '14px', color: 'var(--ink-mute)', cursor: 'pointer', fontSize: 15, fontWeight: 600,
            }}
          >
            + Nueva pregunta
          </button>
        </div>
      )}

      {/* Teams tab */}
      {activeTab === 'equipos' && (
        <div>
          {teams.map((t, ti) => (
            <div
              key={ti}
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'center',
                background: 'var(--bg-card)',
                border: `1px solid ${t.color}33`,
                borderRadius: 'var(--radius-lg)',
                padding: '12px 14px',
                marginBottom: 10,
              }}
            >
              <input
                type="color"
                value={t.color}
                onChange={(e) => updateTeam(ti, { color: e.target.value })}
                style={{ width: 32, height: 32, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 4, padding: 0 }}
              />
              <input
                style={{ ...inputStyle, flex: 1 }}
                value={t.name}
                onChange={(e) => updateTeam(ti, { name: e.target.value })}
                placeholder="Nombre del equipo"
              />
              <button
                onClick={() => removeTeam(ti)}
                style={{ background: 'none', border: 'none', color: 'var(--hot)', cursor: 'pointer', fontSize: 13, padding: '4px 6px', whiteSpace: 'nowrap' }}
              >
                Eliminar
              </button>
            </div>
          ))}

          <button
            onClick={addTeam}
            style={{
              width: '100%', background: 'none', border: '2px dashed var(--line)', borderRadius: 'var(--radius-lg)',
              padding: '14px', color: 'var(--ink-mute)', cursor: 'pointer', fontSize: 15, fontWeight: 600,
            }}
          >
            + Agregar equipo
          </button>
        </div>
      )}

      {/* Save button */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        padding: '16px 20px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
        background: 'rgba(20,24,28,0.96)', backdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--line)',
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <button
            onClick={saveAll}
            disabled={saving}
            style={{
              width: '100%', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-lg)',
              padding: '15px', fontSize: 16, fontWeight: 800, color: 'white',
              cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
