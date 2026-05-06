'use client';
import { useState, useMemo } from 'react';
import type { RecommendationRow } from '@/lib/data';
import { Poster } from '@/components/Poster';
import { Badge } from '@/components/Badge';
import { SectionHeader } from '@/components/SectionHeader';
import { Avatar } from '@/components/Avatar';
import MovieSearch, { type MovieDetails } from '@/components/MovieSearch';
import { useProfiles, resolveUser } from '@/lib/useProfiles';

type NewRec = { title: string; year: string; director: string; genre: string; duration: string; why: string; posterPath: string | null; tmdbId: number | null };
const emptyRec = (): NewRec => ({ title: '', year: '', director: '', genre: '', duration: '', why: '', posterPath: null, tmdbId: null });

type EditState = { id: number; title: string; reason: string };

export default function WatchlistClient({ initialRecs, username, initialVotedIds }: { initialRecs: RecommendationRow[]; username: string | null; initialVotedIds: number[] }) {
  const [recs, setRecs] = useState(initialRecs);
  const profiles = useProfiles();
  const [votedIds, setVotedIds] = useState<Set<number>>(new Set(initialVotedIds));
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<'all' | 'mine'>('all');
  const [newRec, setNewRec] = useState<NewRec>(emptyRec());
  const [editState, setEditState] = useState<EditState | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const sorted = useMemo(() => {
    const list = filter === 'mine' && username
      ? recs.filter((r) => r.suggestedBy === username)
      : [...recs];
    return list.sort((a, b) => b.votes - a.votes);
  }, [recs, filter, username]);

  const handleVote = async (id: number) => {
    if (!username) return;
    const res = await fetch(`/api/recommendations/${id}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      const { voted } = await res.json();
      setRecs((prev) => prev.map((r) => r.id !== id ? r : { ...r, votes: r.votes + (voted ? 1 : -1) }));
      setVotedIds((prev) => { const n = new Set(prev); voted ? n.add(id) : n.delete(id); return n; });
    }
  };

  const handleMovieSelect = (m: MovieDetails) => {
    setNewRec((p) => ({
      ...p,
      title: m.title,
      year: m.year ? String(m.year) : '',
      director: m.director ?? '',
      genre: m.genre ?? '',
      duration: m.duration ? String(m.duration) : '',
      posterPath: m.posterPath ?? null,
      tmdbId: m.tmdbId ?? null,
    }));
  };

  const handleAdd = async () => {
    if (!username || !newRec.title.trim()) return;
    const res = await fetch('/api/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newRec.title.trim(),
        year: Number(newRec.year) || null,
        director: newRec.director || null,
        genre: newRec.genre || null,
        duration: Number(newRec.duration) || null,
        reason: newRec.why.trim() || null,
        posterPath: newRec.posterPath || null,
        tmdbId: newRec.tmdbId || null,
        posterHue: Math.floor(Math.random() * 360),
      }),
    });
    if (res.ok) {
      const rec = await res.json();
      setRecs((prev) => [rec, ...prev]);
      setNewRec(emptyRec());
      setShowAdd(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!username) return;
    setDeleting(id);
    const res = await fetch(`/api/recommendations/${id}`, { method: 'DELETE' });
    if (res.ok) setRecs((prev) => prev.filter((r) => r.id !== id));
    setDeleting(null);
  };

  const handleEditSave = async () => {
    if (!editState) return;
    const res = await fetch(`/api/recommendations/${editState.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editState.title.trim(), reason: editState.reason.trim() || null }),
    });
    if (res.ok) {
      const updated = await res.json();
      setRecs((prev) => prev.map((r) => r.id === updated.id ? { ...r, title: updated.title, reason: updated.reason } : r));
      setEditState(null);
    }
  };

  return (
    <div className="page-enter shell" style={{ paddingTop: 32 }}>
      <SectionHeader
        eyebrow={`${recs.length} películas en la cola`}
        title={<>Sugeridos <em>por el club</em></>}
        action={username ? <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Recomendar</button> : undefined}
      />

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button className={`chip${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>Todas</button>
        {username && <button className={`chip${filter === 'mine' ? ' active' : ''}`} onClick={() => setFilter('mine')}>Mis sugerencias</button>}
      </div>

      {showAdd && (
        <div className="card" style={{ padding: 24, marginBottom: 28, borderLeft: '3px solid var(--accent)' }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>Nueva recomendación</div>
          <MovieSearch onSelect={handleMovieSelect} placeholder="Buscar en TMDB…" />
          <input
            value={newRec.title}
            onChange={(e) => setNewRec((p) => ({ ...p, title: e.target.value }))}
            placeholder="Título de la película"
            style={{ width: '100%', boxSizing: 'border-box', background: 'transparent', border: 'none', borderBottom: '1.5px solid var(--line)', fontWeight: 800, fontSize: 24, color: 'var(--ink)', padding: '8px 0', marginBottom: 12, outline: 'none', textTransform: 'uppercase', letterSpacing: '-0.02em' }}
          />
          {(newRec.director || newRec.year) && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              {[newRec.director, newRec.year, newRec.duration ? `${newRec.duration} min` : null, newRec.genre].filter(Boolean).join(' · ')}
            </div>
          )}
          <textarea
            value={newRec.why}
            onChange={(e) => setNewRec((p) => ({ ...p, why: e.target.value }))}
            placeholder="¿Por qué la recomendás? (opcional)"
            rows={2}
            style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', padding: 12, marginBottom: 16, outline: 'none', resize: 'none', color: 'var(--ink)', fontSize: 14 }}
          />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => { setShowAdd(false); setNewRec(emptyRec()); }}>Cancelar</button>
            <button className="btn btn-primary btn-sm" onClick={handleAdd} disabled={!newRec.title.trim()}>Publicar</button>
          </div>
        </div>
      )}

      {/* Header row */}
      <div style={{ display: 'grid', gridTemplateColumns: '40px 60px 1fr 80px 100px', gap: 16, padding: '0 16px 10px', borderBottom: '1px solid var(--line)' }}>
        {['#', '', 'Película', 'Sugirió', 'Votos'].map((h, i) => (
          <div key={i} className="eyebrow" style={{ textAlign: i >= 3 ? 'center' : 'left' }}>{h}</div>
        ))}
      </div>

      {sorted.length === 0 && (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            {filter === 'mine' ? 'Todavía no sugeriste ninguna película' : 'No hay sugerencias todavía'}
          </div>
          <p style={{ color: 'var(--ink-mute)', margin: '0 0 20px' }}>
            {filter === 'mine' ? 'Usá el botón "Recomendar" para agregar tu primera sugerencia.' : 'Sé el primero en recomendar una película al club.'}
          </p>
          {username && filter !== 'mine' && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Recomendar</button>
          )}
        </div>
      )}

      <div>
        {sorted.map((r, idx) => (
          <div
            key={r.id}
            style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '40px 60px 1fr 80px 100px', gap: 16, alignItems: 'center', borderBottom: '1px solid var(--line)', transition: 'background 0.15s ease' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elev)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '')}
          >
            <div className="h-display" style={{ fontSize: 22, color: idx < 3 ? 'var(--accent)' : 'var(--ink-mute)', fontStyle: 'normal' }}>
              {String(idx + 1).padStart(2, '0')}
            </div>
            <div style={{ width: 60 }}>
              <Poster label={(r.title ?? '').toUpperCase().slice(0, 10)} hue={r.posterHue ?? 200} posterPath={r.posterPath} />
            </div>
            <div>
              {editState?.id === r.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input
                    value={editState.title}
                    onChange={(e) => setEditState((s) => s ? { ...s, title: e.target.value } : s)}
                    style={{ background: 'transparent', border: 'none', borderBottom: '1.5px solid var(--accent)', fontWeight: 700, fontSize: 17, color: 'var(--ink)', padding: '2px 0', outline: 'none' }}
                  />
                  <input
                    value={editState.reason}
                    onChange={(e) => setEditState((s) => s ? { ...s, reason: e.target.value } : s)}
                    placeholder="¿Por qué la recomendás?"
                    style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--line)', fontSize: 13, color: 'var(--ink-soft)', padding: '2px 0', outline: 'none', fontStyle: 'italic' }}
                  />
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <button className="btn btn-primary btn-sm" onClick={handleEditSave} disabled={!editState.title.trim()}>Guardar</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditState(null)}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ fontWeight: 700, fontSize: 17, lineHeight: 1.2 }}>
                    {r.title}
                    {r.year && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 400, color: 'var(--ink-mute)', marginLeft: 6 }}>&apos;{String(r.year).slice(2)}</span>}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3, marginBottom: 4 }}>
                    {r.director && `dir. ${r.director}`}{r.duration ? ` · ${r.duration} min` : ''}{r.genre ? ` · ${r.genre}` : ''}
                  </div>
                  {r.reason?.trim() && (
                    <div style={{ fontStyle: 'italic', fontSize: 13, color: 'var(--ink-soft)' }}>&quot;{r.reason}&quot;</div>
                  )}
                  {r.featured ? <Badge kind="accent">Destacada</Badge> : null}
                  {r.suggestedBy === username && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setEditState({ id: r.id, title: r.title, reason: r.reason ?? '' })}
                        style={{ fontSize: 11, padding: '2px 8px' }}
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleDelete(r.id)}
                        disabled={deleting === r.id}
                        style={{ fontSize: 11, padding: '2px 8px', color: '#e05252' }}
                      >
                        {deleting === r.id ? '…' : 'Eliminar'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Avatar {...resolveUser(profiles, r.suggestedBy)} size="sm" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => handleVote(r.id)}
                disabled={!username}
                style={{
                  background: votedIds.has(r.id) ? 'var(--accent)' : 'transparent',
                  color: votedIds.has(r.id) ? 'var(--bg)' : 'var(--ink)',
                  border: `1px solid ${votedIds.has(r.id) ? 'var(--accent)' : 'var(--line)'}`,
                  padding: '8px 14px', borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 13,
                  cursor: username ? 'pointer' : 'default',
                  opacity: username ? 1 : 0.4,
                  display: 'flex', alignItems: 'center', gap: 6,
                  minWidth: 70, justifyContent: 'center',
                }}
              >
                ↑ {r.votes}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
