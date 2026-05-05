'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import type { ScreeningRow, RecommendationRow } from '@/lib/data';
import { SectionHeader } from '@/components/SectionHeader';
import { Badge } from '@/components/Badge';
import { Avatar } from '@/components/Avatar';
import MovieSearch, { type MovieDetails } from '@/components/MovieSearch';

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
}

type UserRow = { id: number; username: string; role: string; createdAt: number | null };

export default function AdminClient({ screenings, recs, initialUsers }: { screenings: ScreeningRow[]; recs: RecommendationRow[]; initialUsers: UserRow[] }) {
  const [tab, setTab] = useState<'funciones' | 'watchlist' | 'nueva' | 'usuarios'>('funciones');
  const [list, setList] = useState(screenings);
  const [recList, setRecList] = useState(recs);
  const [userList, setUserList] = useState(initialUsers);
  const router = useRouter();

  const [form, setForm] = useState({
    title: '', year: '', director: '', genre: '', duration: '', synopsis: '',
    scheduledDate: '', hour: '21:00', status: 'upcoming', snack: '', location: '', curatedBy: '',
    posterPath: '' as string | null, tmdbId: '' as string | number | null,
  });

  const [openVoting, setOpenVoting] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' });
  const [userError, setUserError] = useState('');
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [voteResults, setVoteResults] = useState<{ id: number; title: string; year: number | null; director: string | null; posterPath: string | null; votes: number }[]>([]);

  const handleOpenAssign = async (screeningId: number) => {
    if (assigningId === screeningId) { setAssigningId(null); return; }
    setAssigningId(screeningId);
    // Fetch current vote standings for this screening
    const [svRes, recRes] = await Promise.all([
      fetch(`/api/votacion?screeningId=${screeningId}`),
      fetch('/api/recommendations'),
    ]);
    const votes: { recommendationId: number; username: string }[] = svRes.ok ? await svRes.json() : [];
    const recs: RecommendationRow[] = recRes.ok ? await recRes.json() : [];
    const tallied = recs.map((r) => ({
      id: r.id, title: r.title, year: r.year, director: r.director, posterPath: r.posterPath,
      votes: votes.filter((v) => v.recommendationId === r.id).length,
    })).sort((a, b) => b.votes - a.votes);
    setVoteResults(tallied);
  };

  const handleAssignWinner = async (screeningId: number, recId: number) => {
    const res = await fetch(`/api/screenings/${screeningId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recommendationId: recId }),
    });
    if (res.ok) {
      const updated = await res.json();
      setList((prev) => prev.map((s) => s.id === screeningId ? { ...s, ...updated } : s));
      setAssigningId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta función?')) return;
    await fetch(`/api/screenings/${id}`, { method: 'DELETE' });
    setList((prev) => prev.filter((s) => s.id !== id));
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'past' ? 'upcoming' : 'past';
    const res = await fetch(`/api/screenings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) setList((prev) => prev.map((s) => s.id === id ? { ...s, status: newStatus } : s));
  };

  const handleDeleteRec = async (id: number) => {
    if (!confirm('¿Eliminar esta recomendación?')) return;
    await fetch(`/api/recommendations/${id}`, { method: 'DELETE' });
    setRecList((prev) => prev.filter((r) => r.id !== id));
  };

  const handleFeatureRec = async (id: number, featured: number | null) => {
    const res = await fetch(`/api/recommendations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featured: featured ? 0 : 1 }),
    });
    if (res.ok) setRecList((prev) => prev.map((r) => r.id === id ? { ...r, featured: featured ? 0 : 1 } : r));
  };

  const handleMovieSelect = (m: MovieDetails) => {
    setForm((p) => ({
      ...p,
      title: m.title,
      year: m.year ? String(m.year) : '',
      director: m.director ?? '',
      genre: m.genre ?? '',
      duration: m.duration ? String(m.duration) : '',
      synopsis: m.synopsis ?? '',
      posterPath: m.posterPath ?? null,
      tmdbId: m.tmdbId ?? null,
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/screenings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title, year: Number(form.year) || null,
        director: form.director, genre: form.genre,
        duration: Number(form.duration) || null, synopsis: form.synopsis,
        scheduledDate: form.scheduledDate, hour: form.hour,
        status: form.status, snack: form.snack,
        location: form.location, curatedBy: form.curatedBy,
        posterHue: Math.floor(Math.random() * 360),
        posterPath: form.posterPath || null,
        tmdbId: form.tmdbId ? Number(form.tmdbId) : null,
      }),
    });
    if (res.ok) {
      router.refresh();
      setTab('funciones');
      setOpenVoting(false);
      setForm({ title: '', year: '', director: '', genre: '', duration: '', synopsis: '', scheduledDate: '', hour: '21:00', status: 'upcoming', snack: '', location: '', curatedBy: '', posterPath: null, tmdbId: null });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    });
    if (res.ok) {
      const created = await res.json();
      setUserList((prev) => [...prev, created]);
      setNewUser({ username: '', password: '', role: 'user' });
    } else {
      const data = await res.json();
      setUserError(data.error ?? 'Error al crear usuario');
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
    setUserList((prev) => prev.filter((u) => u.id !== id));
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--bg)', border: '1px solid var(--line)',
    borderRadius: 'var(--radius-sm)', padding: '8px 12px',
    fontSize: 13, color: 'var(--ink)', outline: 'none',
  };

  const tabs = [
    { key: 'funciones', label: `Funciones (${list.length})` },
    { key: 'watchlist', label: `Watchlist (${recList.length})` },
    { key: 'usuarios', label: `Usuarios (${userList.length})` },
    { key: 'nueva', label: '+ Nueva función' },
  ] as const;

  return (
    <div className="page-enter shell" style={{ paddingTop: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 4 }}>Panel de administración</div>
          <h1 style={{ margin: 0, fontWeight: 800, fontSize: 28, textTransform: 'uppercase' }}>
            Cine <span style={{ color: 'var(--accent)' }}>Terabithia</span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/" className="btn btn-ghost btn-sm">← Ir al sitio</Link>
          <button className="btn btn-sm" onClick={() => signOut({ callbackUrl: '/login' })}>Salir</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid var(--line)', paddingBottom: 0 }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '10px 16px', background: 'none', border: 'none',
              fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 13,
              textTransform: 'uppercase', letterSpacing: '0.04em',
              color: tab === t.key ? 'var(--accent)' : 'var(--ink-mute)',
              borderBottom: `2px solid ${tab === t.key ? 'var(--accent)' : 'transparent'}`,
              marginBottom: -1, cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* FUNCIONES */}
      {tab === 'funciones' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {list.map((s, i) => {
            const isOpen = s.status === 'upcoming' && !s.title;
            const isAssigning = assigningId === s.id;
            return (
              <div key={s.id} style={{ borderBottom: i === list.length - 1 ? 'none' : '1px solid var(--line)' }}>
                <div style={{ padding: '14px 20px', display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 16, alignItems: 'center' }}>
                  <div>
                    {isOpen
                      ? <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--ink-mute)', fontStyle: 'italic' }}>Función sin película · Votación abierta</div>
                      : <div style={{ fontWeight: 700, fontSize: 16 }}>{s.title} <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-mute)' }}>{s.year}</span></div>
                    }
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)', marginTop: 2 }}>
                      {formatDate(s.scheduledDate)}{s.hour ? ` · ${s.hour}` : ''}{s.location ? ` · ${s.location}` : ''}
                      {s.avgScore ? ` · ★ ${s.avgScore.toFixed(1)} (${s.scoreCount} votos)` : ''}
                    </div>
                  </div>
                  <span className={`badge${s.status === 'upcoming' ? ' accent' : ''}`}>{s.status === 'upcoming' ? 'próxima' : 'pasada'}</span>
                  {isOpen
                    ? <button className="btn btn-primary btn-sm" onClick={() => handleOpenAssign(s.id)}>{isAssigning ? 'Cerrar ▲' : '🗳 Definir película ▼'}</button>
                    : <button className="btn btn-ghost btn-sm" onClick={() => handleToggleStatus(s.id, s.status)}>{s.status === 'upcoming' ? '→ Marcar pasada' : '→ Marcar próxima'}</button>
                  }
                  <button className="btn btn-sm" style={{ background: 'var(--hot)', color: 'white', borderColor: 'var(--hot)' }} onClick={() => handleDelete(s.id)}>Eliminar</button>
                </div>

                {isAssigning && (
                  <div style={{ padding: '16px 20px', background: 'var(--bg-elev)', borderTop: '1px solid var(--line)' }}>
                    <div className="eyebrow" style={{ marginBottom: 12 }}>Resultados de la votación — elegí la ganadora</div>
                    {voteResults.length === 0
                      ? <p style={{ color: 'var(--ink-mute)', fontSize: 13, margin: 0 }}>Todavía no hay votos. Igualmente podés asignar cualquier recomendación de la watchlist.</p>
                      : voteResults.map((r, idx) => (
                        <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: idx < voteResults.length - 1 ? '1px solid var(--line)' : 'none' }}>
                          <span className="h-display" style={{ fontSize: 20, color: idx === 0 ? 'var(--accent)' : 'var(--ink-mute)', minWidth: 32 }}>{idx + 1}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700 }}>{r.title}{r.year ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 400, color: 'var(--ink-mute)', marginLeft: 6 }}>{r.year}</span> : null}</div>
                            {r.director && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)' }}>dir. {r.director}</div>}
                          </div>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: idx === 0 ? 'var(--accent)' : 'var(--ink-mute)', fontWeight: 700 }}>{r.votes} votos</span>
                          <button className="btn btn-primary btn-sm" onClick={() => handleAssignWinner(s.id, r.id)}>Asignar ✓</button>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            );
          })}
          {list.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-mute)' }}>Sin funciones.</div>}
        </div>
      )}

      {/* WATCHLIST */}
      {tab === 'watchlist' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {recList.map((r, i) => (
            <div key={r.id} style={{ padding: '14px 20px', display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 16, alignItems: 'center', borderBottom: i === recList.length - 1 ? 'none' : '1px solid var(--line)' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{r.title} <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-mute)' }}>{r.year}</span></div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)', marginTop: 2 }}>
                  Sugirió: {r.suggestedBy} · {r.votes} votos
                  {r.reason ? ` · "${r.reason}"` : ''}
                </div>
              </div>
              {r.featured ? <Badge kind="accent">Destacada</Badge> : <span style={{ width: 70 }} />}
              <button className="btn btn-ghost btn-sm" onClick={() => handleFeatureRec(r.id, r.featured)}>
                {r.featured ? 'Quitar destaque' : 'Destacar'}
              </button>
              <button className="btn btn-sm" style={{ background: 'var(--hot)', color: 'white', borderColor: 'var(--hot)' }} onClick={() => handleDeleteRec(r.id)}>
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* USUARIOS */}
      {tab === 'usuarios' && (
        <div>
          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
            {userList.map((u, i) => (
              <div key={u.id} style={{ padding: '12px 20px', display: 'grid', gridTemplateColumns: '40px 1fr auto auto', gap: 16, alignItems: 'center', borderBottom: i === userList.length - 1 ? 'none' : '1px solid var(--line)' }}>
                <Avatar name={u.username} size="md" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{u.username}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{u.role}</div>
                </div>
                <span className={`badge${u.role === 'admin' ? ' accent' : ''}`}>{u.role}</span>
                <button
                  className="btn btn-sm"
                  style={{ background: 'var(--hot)', color: 'white', borderColor: 'var(--hot)' }}
                  onClick={() => handleDeleteUser(u.id)}
                >
                  Eliminar
                </button>
              </div>
            ))}
            {userList.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-mute)' }}>Sin usuarios.</div>}
          </div>

          <div className="card" style={{ padding: 24 }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Nuevo usuario</div>
            <form onSubmit={handleCreateUser} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 140px auto', gap: 12, alignItems: 'end' }}>
              <div>
                <label className="eyebrow" style={{ display: 'block', marginBottom: 6 }}>Usuario</label>
                <input value={newUser.username} onChange={(e) => setNewUser((p) => ({ ...p, username: e.target.value }))} placeholder="nombre" required style={inputStyle} />
              </div>
              <div>
                <label className="eyebrow" style={{ display: 'block', marginBottom: 6 }}>Contraseña</label>
                <input type="password" value={newUser.password} onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))} placeholder="••••••••" required style={inputStyle} />
              </div>
              <div>
                <label className="eyebrow" style={{ display: 'block', marginBottom: 6 }}>Rol</label>
                <select value={newUser.role} onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value }))} style={inputStyle}>
                  <option value="user">Usuario</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary btn-sm">Crear</button>
            </form>
            {userError && <div style={{ marginTop: 10, fontSize: 13, color: 'var(--hot)' }}>{userError}</div>}
          </div>
        </div>
      )}

      {/* NUEVA FUNCIÓN */}
      {tab === 'nueva' && (
        <form onSubmit={handleCreate}>
          <div className="card" style={{ padding: 28 }}>
            <SectionHeader eyebrow="Admin" title={<>Nueva <em>función</em></>} />

            {/* Toggle: película definida vs votación abierta */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={openVoting}
                onChange={(e) => { setOpenVoting(e.target.checked); if (e.target.checked) setForm((p) => ({ ...p, title: '', year: '', director: '', genre: '', duration: '', synopsis: '', posterPath: null, tmdbId: null })); }}
                style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
              />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Someter a votación — el club elige la película
              </span>
            </label>

            {!openVoting && <MovieSearch onSelect={handleMovieSelect} placeholder="Buscar película en TMDB…" />}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                ...(!openVoting ? [
                  ['title', 'Título', 'text'],
                  ['year', 'Año', 'number'],
                  ['director', 'Director', 'text'],
                  ['genre', 'Género', 'text'],
                  ['duration', 'Duración (min)', 'number'],
                ] : []),
                ['scheduledDate', 'Fecha *', 'date'],
                ['hour', 'Hora', 'time'],
                ['snack', 'Snack', 'text'],
                ['location', 'Lugar', 'text'],
                ['curatedBy', 'Curado por', 'text'],
              ].map(([field, label, type]) => (
                <div key={field}>
                  <label className="eyebrow" style={{ display: 'block', marginBottom: 6 }}>{label}</label>
                  <input
                    type={type}
                    value={form[field as keyof typeof form] ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
                    style={inputStyle}
                    required={field === 'scheduledDate'}
                  />
                </div>
              ))}
              <div>
                <label className="eyebrow" style={{ display: 'block', marginBottom: 6 }}>Estado</label>
                <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} style={inputStyle}>
                  <option value="upcoming">Próxima</option>
                  <option value="past">Pasada</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <label className="eyebrow" style={{ display: 'block', marginBottom: 6 }}>Sinopsis</label>
              <textarea value={form.synopsis} onChange={(e) => setForm((p) => ({ ...p, synopsis: e.target.value }))} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setTab('funciones')}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Crear función</button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
