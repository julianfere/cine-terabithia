'use client';
import { useState, useMemo } from 'react';
import type { RecommendationRow, RecommendationComment } from '@/lib/data';
import { Poster } from '@/components/Poster';
import { Badge } from '@/components/Badge';
import { SectionHeader } from '@/components/SectionHeader';
import { Avatar, AvatarStack } from '@/components/Avatar';
import MovieSearch, { type MovieDetails } from '@/components/MovieSearch';
import { useProfiles, resolveUser } from '@/lib/useProfiles';

type NewRec = { title: string; year: string; director: string; genre: string; duration: string; why: string; posterPath: string | null; tmdbId: number | null };
const emptyRec = (): NewRec => ({ title: '', year: '', director: '', genre: '', duration: '', why: '', posterPath: null, tmdbId: null });

type EditState = { id: number; title: string; reason: string };
type CommentEditState = { id: number; content: string };

export default function WatchlistClient({ initialRecs, username, initialVotedIds }: { initialRecs: RecommendationRow[]; username: string | null; initialVotedIds: number[] }) {
  const [recs, setRecs] = useState(initialRecs);
  const profiles = useProfiles();
  const [votedIds, setVotedIds] = useState<Set<number>>(new Set(initialVotedIds));
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<'all' | 'mine'>('all');
  const [newRec, setNewRec] = useState<NewRec>(emptyRec());
  const [editState, setEditState] = useState<EditState | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<number, RecommendationComment[]>>({});
  const [commentInput, setCommentInput] = useState<Record<number, string>>({});
  const [commentLoading, setCommentLoading] = useState<Record<number, boolean>>({});
  const [commentEdit, setCommentEdit] = useState<CommentEditState | null>(null);

  const sorted = useMemo(() => {
    const list = filter === 'mine' && username
      ? recs.filter((r) => r.suggestedBy === username)
      : [...recs];
    return list.sort((a, b) => {
      if (a.programada !== b.programada) return a.programada ? -1 : 1;
      return b.votes - a.votes;
    });
  }, [recs, filter, username]);

  const filtered = useMemo(() => {
    if (!search.trim()) return sorted;
    const q = search.toLowerCase();
    return sorted.filter(r =>
      r.title.toLowerCase().includes(q) ||
      (r.director ?? '').toLowerCase().includes(q) ||
      (r.genre ?? '').toLowerCase().includes(q)
    );
  }, [sorted, search]);

  const handleVote = async (id: number) => {
    if (!username) return;
    const res = await fetch(`/api/recommendations/${id}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      const { voted } = await res.json();
      setRecs((prev) => prev.map((r) => r.id !== id ? r : {
        ...r,
        votes: r.votes + (voted ? 1 : -1),
        voters: voted ? [...r.voters, username!] : r.voters.filter((v) => v !== username),
      }));
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

  const handleExpand = async (id: number) => {
    const next = expandedId === id ? null : id;
    setExpandedId(next);
    if (next !== null && !(next in commentsMap)) {
      const res = await fetch(`/api/recommendations/${next}/comments`);
      if (res.ok) { const data = await res.json(); setCommentsMap((p) => ({ ...p, [next]: data })); }
    }
  };

  const handleComment = async (recId: number) => {
    const content = commentInput[recId]?.trim();
    if (!content || !username) return;
    setCommentLoading((p) => ({ ...p, [recId]: true }));
    const res = await fetch(`/api/recommendations/${recId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (res.ok) {
      const comment: RecommendationComment = await res.json();
      setCommentsMap((p) => ({ ...p, [recId]: [...(p[recId] ?? []), comment] }));
      setCommentInput((p) => ({ ...p, [recId]: '' }));
      setRecs((p) => p.map((r) => r.id === recId ? { ...r, commentCount: r.commentCount + 1 } : r));
    }
    setCommentLoading((p) => ({ ...p, [recId]: false }));
  };

  const handleCommentVote = async (recId: number, commentId: number, value: 1 | -1) => {
    if (!username) return;
    setCommentsMap((p) => ({
      ...p,
      [recId]: (p[recId] ?? []).map((c) => {
        if (c.id !== commentId) return c;
        const score = Number(c.score) || 0;
        const prev = Number(c.myVote) || 0;
        const removing = prev === value;
        return { ...c, myVote: (removing ? 0 : value) as 1 | -1 | 0, score: score - prev + (removing ? 0 : value) };
      }),
    }));
    const res = await fetch(`/api/recommendations/${recId}/comments/${commentId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
    if (res.ok) {
      const { myVote } = await res.json();
      setCommentsMap((p) => ({
        ...p,
        [recId]: (p[recId] ?? []).map((c) => {
          if (c.id !== commentId) return c;
          const score = Number(c.score) || 0;
          const prev = Number(c.myVote) || 0;
          return { ...c, myVote: myVote as 1 | -1 | 0, score: score - prev + Number(myVote) };
        }),
      }));
    }
  };

  const handleCommentEditSave = async (recId: number) => {
    if (!commentEdit) return;
    const res = await fetch(`/api/recommendations/${recId}/comments/${commentEdit.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: commentEdit.content }),
    });
    if (res.ok) {
      setCommentsMap((p) => ({
        ...p,
        [recId]: (p[recId] ?? []).map((c) => c.id === commentEdit.id ? { ...c, content: commentEdit.content } : c),
      }));
      setCommentEdit(null);
    }
  };

  const handleCommentDelete = async (recId: number, commentId: number) => {
    const res = await fetch(`/api/recommendations/${recId}/comments/${commentId}`, { method: 'DELETE' });
    if (res.ok) {
      setCommentsMap((p) => ({ ...p, [recId]: (p[recId] ?? []).filter((c) => c.id !== commentId) }));
      setRecs((p) => p.map((r) => r.id === recId ? { ...r, commentCount: Math.max(0, r.commentCount - 1) } : r));
    }
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
        eyebrow={`${recs.filter(r => !r.programada).length} películas en la cola`}
        title={<>Sugeridos <em>por el club</em></>}
        action={username ? <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Recomendar</button> : undefined}
      />

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button className={`chip${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>Todas</button>
        {username && <button className={`chip${filter === 'mine' ? ' active' : ''}`} onClick={() => setFilter('mine')}>Mis sugerencias</button>}
      </div>

      <div style={{ marginBottom: 24 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar película..."
          style={{
            background: 'var(--bg)', border: '1px solid var(--line)',
            borderRadius: 'var(--radius-sm)', padding: '8px 12px',
            fontSize: 13, color: 'var(--ink)', outline: 'none',
            width: '100%', maxWidth: 320, boxSizing: 'border-box',
          }}
        />
        {(search.trim() || filter === 'mine') && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)', marginTop: 8 }}>
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </div>
        )}
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
      <div className="wl-table">
      <div className="wl-head">
        {['#', '', 'Película', 'Sugirió', 'Votos'].map((h, i) => (
          <div key={i} className="eyebrow" style={{ textAlign: i >= 3 ? 'center' : 'left' }}>{h}</div>
        ))}
      </div>

      {filtered.length === 0 ? (
        search.trim() ? (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--ink-mute)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
            Sin resultados para &quot;{search}&quot;
          </div>
        ) : (
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
        )
      ) : null}

      <div>
        {filtered.map((r, idx) => {
          const isExpanded = expandedId === r.id;
          const suggester = resolveUser(profiles, r.suggestedBy);
          return (
            <div key={r.id}>
              <div
                className={`wl-row${isExpanded ? ' wl-row-expanded' : ''}`}
                style={{ opacity: r.programada ? 0.55 : 1, cursor: 'pointer' }}
                onClick={() => handleExpand(r.id)}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elev)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = isExpanded ? 'var(--bg-elev)' : '')}
              >
                <div className="h-display" style={{ fontSize: 22, color: idx < 3 ? 'var(--accent)' : 'var(--ink-mute)', fontStyle: 'normal' }}>
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <div style={{ width: 60 }}>
                  <Poster label={(r.title ?? '').toUpperCase().slice(0, 10)} hue={r.posterHue ?? 200} posterPath={r.posterPath} />
                </div>
                <div>
                  {editState?.id === r.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} onClick={(e) => e.stopPropagation()}>
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
                      {r.programada && <Badge kind="accent">Ya programada</Badge>}
                      {!r.programada && r.featured ? <Badge kind="accent">Destacada</Badge> : null}
                      {r.commentCount > 0 && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--ink-mute)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                          💬 {r.commentCount}
                        </span>
                      )}
                      <div className="wl-suggested-by-mobile">
                        <Avatar {...suggester} size="sm" />
                        <span>{suggester.name}</span>
                      </div>
                      {!r.programada && r.suggestedBy === username && (
                        <div style={{ display: 'flex', gap: 6, marginTop: 6 }} onClick={(e) => e.stopPropagation()}>
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
                <div className="wl-avatar">
                  <Avatar {...suggester} size="sm" />
                </div>
                <div className="wl-vote" onClick={(e) => e.stopPropagation()}>
                  {r.programada ? (
                    <span style={{
                      padding: '8px 14px', borderRadius: 'var(--radius-sm)',
                      fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 13,
                      display: 'flex', alignItems: 'center', gap: 6,
                      minWidth: 70, justifyContent: 'center',
                      color: 'var(--ink-mute)', border: '1px solid var(--line)',
                    }}>
                      ↑ {r.votes}
                    </span>
                  ) : (
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
                  )}
                  {r.voters.length > 0 && (
                    <AvatarStack names={r.voters} max={4} size="sm" profiles={profiles} />
                  )}
                </div>
              </div>

              {/* Detail panel */}
              {isExpanded && (
                <div className="wl-detail">
                  <div className="wl-detail-poster">
                    <Poster label={(r.title ?? '').toUpperCase().slice(0, 10)} hue={r.posterHue ?? 200} posterPath={r.posterPath} />
                  </div>
                  <div className="wl-detail-body">
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontWeight: 800, fontSize: 18, lineHeight: 1.2, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
                        {r.title}
                        {r.year && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 400, color: 'var(--ink-mute)', marginLeft: 8 }}>{r.year}</span>}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>
                        {[r.director && `dir. ${r.director}`, r.duration && `${r.duration} min`, r.genre].filter(Boolean).join(' · ')}
                      </div>
                      {r.reason?.trim() && (
                        <div style={{ fontStyle: 'italic', fontSize: 13, color: 'var(--ink-soft)', marginTop: 8, lineHeight: 1.5 }}>&ldquo;{r.reason}&rdquo;</div>
                      )}
                    </div>

                    <div className="wl-detail-meta">
                      <div className="wl-detail-section">
                        <div className="eyebrow" style={{ marginBottom: 6 }}>Sugirió</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Avatar {...suggester} size="sm" />
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{suggester.name}</span>
                        </div>
                      </div>

                      {r.voters.length > 0 && (
                        <div className="wl-detail-section">
                          <div className="eyebrow" style={{ marginBottom: 6 }}>Votaron ({r.voters.length})</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {r.voters.map((v) => {
                              const u = resolveUser(profiles, v);
                              return (
                                <div key={v} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <Avatar {...u} size="sm" />
                                  <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{u.name}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {r.voters.length === 0 && (
                        <div className="wl-detail-section">
                          <div className="eyebrow" style={{ marginBottom: 6 }}>Votos</div>
                          <span style={{ fontSize: 12, color: 'var(--ink-mute)', fontFamily: 'var(--font-mono)' }}>Nadie votó todavía</span>
                        </div>
                      )}
                    </div>

                    {/* Comentarios */}
                    <div style={{ marginTop: 20, borderTop: '1px solid var(--line)', paddingTop: 16 }}>
                      <div className="eyebrow" style={{ marginBottom: 12 }}>
                        Comentarios{commentsMap[r.id]?.length ? ` (${commentsMap[r.id].length})` : ''}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
                        {!commentsMap[r.id] && (
                          <span style={{ fontSize: 12, color: 'var(--ink-mute)', fontFamily: 'var(--font-mono)' }}>Cargando…</span>
                        )}
                        {commentsMap[r.id]?.length === 0 && (
                          <span style={{ fontSize: 12, color: 'var(--ink-mute)', fontFamily: 'var(--font-mono)' }}>Sin comentarios todavía</span>
                        )}
                        {commentsMap[r.id]?.map((c) => {
                          const u = resolveUser(profiles, c.username);
                          const isOwn = c.username === username;
                          const isEditing = commentEdit?.id === c.id;
                          return (
                            <div key={c.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                              <Avatar {...u} size="sm" />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 3 }}>
                                  <span style={{ fontWeight: 600, fontSize: 12 }}>{u.name}</span>
                                  <span style={{ fontSize: 10, color: 'var(--ink-mute)', fontFamily: 'var(--font-mono)' }}>
                                    {new Date(c.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                                  </span>
                                </div>
                                {isEditing ? (
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    <textarea
                                      value={commentEdit.content}
                                      onChange={(e) => setCommentEdit((s) => s ? { ...s, content: e.target.value } : s)}
                                      rows={2}
                                      style={{
                                        flex: 1, background: 'var(--bg)', border: '1px solid var(--accent)',
                                        borderRadius: 'var(--radius-sm)', padding: '6px 8px',
                                        fontSize: 13, color: 'var(--ink)', outline: 'none', resize: 'none',
                                      }}
                                    />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                      <button className="btn btn-primary btn-sm" style={{ fontSize: 11 }} onClick={() => handleCommentEditSave(r.id)} disabled={!commentEdit.content.trim()}>Guardar</button>
                                      <button className="btn btn-ghost btn-sm" style={{ fontSize: 11 }} onClick={() => setCommentEdit(null)}>Cancelar</button>
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.45, marginBottom: 4 }}>{c.content}</div>
                                )}
                                {!isEditing && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                      <button
                                        onClick={() => handleCommentVote(r.id, c.id, 1)}
                                        disabled={!username}
                                        title="Upvote"
                                        style={{
                                          background: 'none', border: 'none', padding: '0 2px', cursor: username ? 'pointer' : 'default',
                                          fontSize: 12, lineHeight: 1,
                                          color: c.myVote === 1 ? 'var(--accent)' : 'var(--ink-mute)',
                                        }}
                                      >▲</button>
                                      <span style={{
                                        fontFamily: 'var(--font-mono)', fontSize: 11, minWidth: 12, textAlign: 'center',
                                        color: c.score > 0 ? 'var(--accent)' : c.score < 0 ? '#e05252' : 'var(--ink-mute)',
                                        fontWeight: 600,
                                      }}>
                                        {Number(c.score) || 0}
                                      </span>
                                      <button
                                        onClick={() => handleCommentVote(r.id, c.id, -1)}
                                        disabled={!username}
                                        title="Downvote"
                                        style={{
                                          background: 'none', border: 'none', padding: '0 2px', cursor: username ? 'pointer' : 'default',
                                          fontSize: 12, lineHeight: 1,
                                          color: c.myVote === -1 ? '#e05252' : 'var(--ink-mute)',
                                        }}
                                      >▼</button>
                                    </div>
                                    {username && (
                                      <button
                                        onClick={() => setCommentInput((p) => ({ ...p, [r.id]: `@${c.username} ` }))}
                                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 11, color: 'var(--ink-mute)', fontFamily: 'var(--font-mono)' }}
                                      >
                                        Responder
                                      </button>
                                    )}
                                    {isOwn && (
                                      <>
                                        <button
                                          onClick={() => setCommentEdit({ id: c.id, content: c.content })}
                                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 11, color: 'var(--ink-mute)', fontFamily: 'var(--font-mono)' }}
                                        >
                                          Editar
                                        </button>
                                        <button
                                          onClick={() => handleCommentDelete(r.id, c.id)}
                                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 11, color: '#e05252', fontFamily: 'var(--font-mono)' }}
                                        >
                                          Eliminar
                                        </button>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {username && (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                          <textarea
                            value={commentInput[r.id] ?? ''}
                            onChange={(e) => setCommentInput((p) => ({ ...p, [r.id]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment(r.id); } }}
                            placeholder="Escribí un comentario… (Enter para enviar)"
                            rows={2}
                            style={{
                              flex: 1, background: 'var(--bg)', border: '1px solid var(--line)',
                              borderRadius: 'var(--radius-sm)', padding: '8px 10px',
                              fontSize: 13, color: 'var(--ink)', outline: 'none', resize: 'none',
                            }}
                          />
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleComment(r.id)}
                            disabled={!commentInput[r.id]?.trim() || commentLoading[r.id]}
                            style={{ flexShrink: 0 }}
                          >
                            {commentLoading[r.id] ? '…' : 'Enviar'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
