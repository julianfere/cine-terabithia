'use client';
import { useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import type { ScreeningRow, RecommendationRow, AttendanceRow } from '@/lib/data';
import { Avatar } from '@/components/Avatar';
import MovieSearch, { type MovieDetails } from '@/components/MovieSearch';
import { DatePicker } from '@/components/DatePicker';
import { Ticket } from '@/components/Ticket';

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
}

function fmtDateLong(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long' });
}

type UserRow = { id: number; username: string; displayName: string | null; role: string; createdAt: number | null };
type LogRow = { id: number; title: string; body: string; url: string; recipientType: string; recipientUserIds: string | null; sent: number; failed: number; sentAt: number | null };
type AnalyticsRow = { id: number; path: string; userId: number | null; sessionId: string | null; createdAt: number | null };

export default function AdminClient({
  screenings, recs, assignedRecs, initialUsers, subscribedUserIds, initialLogs, analyticsRows,
}: {
  screenings: ScreeningRow[];
  recs: RecommendationRow[];
  assignedRecs: RecommendationRow[];
  initialUsers: UserRow[];
  subscribedUserIds: number[];
  initialLogs: LogRow[];
  analyticsRows: AnalyticsRow[];
}) {
  const [tab, setTab] = useState<'funciones' | 'watchlist' | 'nueva' | 'usuarios' | 'notificaciones' | 'entradas' | 'actividad'>('funciones');
  const [entrScreeningId, setEntrScreeningId] = useState<number | null>(null);
  const [entrAttendees, setEntrAttendees] = useState<AttendanceRow[]>([]);
  const [entrSearch, setEntrSearch] = useState('');
  const [entrLoading, setEntrLoading] = useState(false);
  const subscribedSet = new Set(subscribedUserIds);
  const [logs, setLogs] = useState<LogRow[]>(initialLogs);
  const [compose, setCompose] = useState({ title: '', body: '', url: '/', recipients: 'all' as 'all' | number[] });
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number } | null>(null);
  const [list, setList] = useState(screenings);
  const [recList, setRecList] = useState(recs);
  const [assignedRecList, setAssignedRecList] = useState(assignedRecs);
  const [userList, setUserList] = useState(initialUsers);
  const [copiedId, setCopiedId] = useState<number | null>(null);

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
  const [quickRec, setQuickRec] = useState<RecommendationRow | null>(null);
  const [quickForm, setQuickForm] = useState({ scheduledDate: '', hour: '21:00', location: '', snack: '', curatedBy: '' });
  const [editingScreening, setEditingScreening] = useState<ScreeningRow | null>(null);
  const [editForm, setEditForm] = useState({
    scheduledDate: '', hour: '', status: 'upcoming', snack: '', location: '', curatedBy: '', notes: '',
    title: '', year: '', director: '', genre: '', duration: '', synopsis: '',
    posterPath: null as string | null, tmdbId: null as string | number | null,
  });

  // ── helpers ───────────────────────────────────────────────────────────────

  const fmtTs = (ts: number | null) => {
    if (!ts) return '—';
    return new Date(ts).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  // ── handlers ──────────────────────────────────────────────────────────────

  const handleCopyLink = (id: number) => {
    navigator.clipboard.writeText(`${window.location.origin}/funciones/${id}`).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenAssign = async (screeningId: number) => {
    if (assigningId === screeningId) { setAssigningId(null); return; }
    setAssigningId(screeningId);
    const [svRes, recRes] = await Promise.all([
      fetch(`/api/votacion?screeningId=${screeningId}`),
      fetch('/api/recommendations'),
    ]);
    const votes: { recommendationId: number; username: string }[] = svRes.ok ? await svRes.json() : [];
    const allRecs: RecommendationRow[] = recRes.ok ? await recRes.json() : [];
    const tallied = allRecs.map((r) => ({
      id: r.id, title: r.title, year: r.year, director: r.director, posterPath: r.posterPath,
      votes: votes.filter((v) => v.recommendationId === r.id).length,
    })).sort((a, b) => b.votes - a.votes);
    setVoteResults(tallied);
  };

  const handleAssignWinner = async (screeningId: number, recId: number) => {
    const res = await fetch(`/api/screenings/${screeningId}/assign`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recommendationId: recId }),
    });
    if (res.ok) {
      const updated = await res.json();
      setList((prev) => prev.map((s) => s.id === screeningId ? { ...s, ...updated } : s));
      const moved = recList.find((r) => r.id === recId);
      if (moved) {
        setRecList((prev) => prev.filter((r) => r.id !== recId));
        setAssignedRecList((prev) => [{ ...moved, status: 'assigned' }, ...prev]);
      }
      setAssigningId(null);
    }
  };

  const handleReactivateRec = async (id: number) => {
    const res = await fetch(`/api/recommendations/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'active' }),
    });
    if (res.ok) {
      const rec = assignedRecList.find((r) => r.id === id);
      if (rec) {
        setAssignedRecList((prev) => prev.filter((r) => r.id !== id));
        setRecList((prev) => [...prev, { ...rec, status: 'active' }]);
      }
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
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) setList((prev) => prev.map((s) => s.id === id ? { ...s, status: newStatus } : s));
  };

  const handleDeleteRec = async (id: number) => {
    if (!confirm('¿Eliminar esta recomendación?')) return;
    await fetch(`/api/recommendations/${id}`, { method: 'DELETE' });
    setRecList((prev) => prev.filter((r) => r.id !== id));
  };

  const handleFeatureRec = async (id: number, featured: boolean | null) => {
    const res = await fetch(`/api/recommendations/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featured: !featured }),
    });
    if (res.ok) setRecList((prev) => prev.map((r) => r.id === id ? { ...r, featured: !featured } : r));
  };

  const handleMovieSelect = (m: MovieDetails) => {
    setForm((p) => ({
      ...p, title: m.title, year: m.year ? String(m.year) : '',
      director: m.director ?? '', genre: m.genre ?? '',
      duration: m.duration ? String(m.duration) : '', synopsis: m.synopsis ?? '',
      posterPath: m.posterPath ?? null, tmdbId: m.tmdbId ?? null,
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/screenings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
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
      const created = await res.json();
      setList((prev) => [created, ...prev]);
      setTab('funciones');
      setOpenVoting(false);
      setForm({ title: '', year: '', director: '', genre: '', duration: '', synopsis: '', scheduledDate: '', hour: '21:00', status: 'upcoming', snack: '', location: '', curatedBy: '', posterPath: null, tmdbId: null });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');
    const res = await fetch('/api/users', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
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

  const handleQuickCreate = async () => {
    if (!quickRec || !quickForm.scheduledDate) return;
    const res = await fetch('/api/screenings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: quickRec.title, year: quickRec.year, director: quickRec.director,
        genre: quickRec.genre, duration: quickRec.duration,
        posterPath: quickRec.posterPath, tmdbId: quickRec.tmdbId,
        posterHue: quickRec.posterHue,
        scheduledDate: quickForm.scheduledDate, hour: quickForm.hour,
        location: quickForm.location, snack: quickForm.snack,
        curatedBy: quickForm.curatedBy, status: 'upcoming',
      }),
    });
    if (res.ok) {
      const created = await res.json();
      setList((prev) => [created, ...prev]);
      await fetch(`/api/recommendations/${quickRec.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'assigned' }),
      });
      setRecList((prev) => prev.filter((r) => r.id !== quickRec.id));
      setAssignedRecList((prev) => [{ ...quickRec, status: 'assigned' }, ...prev]);
      setQuickRec(null);
    }
  };

  const handleOpenEdit = (s: ScreeningRow) => {
    setEditingScreening(s);
    setEditForm({
      scheduledDate: s.scheduledDate,
      hour: s.hour ?? '',
      status: s.status,
      snack: s.snack ?? '',
      location: s.location ?? '',
      curatedBy: s.curatedBy ?? '',
      notes: s.notes ?? '',
      title: s.title ?? '',
      year: s.year ? String(s.year) : '',
      director: s.director ?? '',
      genre: s.genre ?? '',
      duration: s.duration ? String(s.duration) : '',
      synopsis: s.synopsis ?? '',
      posterPath: s.posterPath ?? null,
      tmdbId: null,
    });
  };

  const handleEditMovieSelect = (m: MovieDetails) => {
    setEditForm((p) => ({
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

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingScreening) return;

    const screeningPatch = {
      scheduledDate: editForm.scheduledDate,
      hour: editForm.hour || null,
      location: editForm.location || null,
      snack: editForm.snack || null,
      curatedBy: editForm.curatedBy || null,
      status: editForm.status,
      notes: editForm.notes || null,
    };

    const moviePatch = editingScreening.title !== null ? {
      title: editForm.title,
      year: Number(editForm.year) || null,
      director: editForm.director || null,
      genre: editForm.genre || null,
      duration: Number(editForm.duration) || null,
      synopsis: editForm.synopsis || null,
      posterPath: editForm.posterPath || null,
      tmdbId: editForm.tmdbId ? Number(editForm.tmdbId) : null,
    } : {};

    const res = await fetch(`/api/screenings/${editingScreening.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...screeningPatch, ...moviePatch }),
    });

    if (res.ok) {
      setList((prev) => prev.map((s) =>
        s.id === editingScreening!.id ? { ...s, ...screeningPatch, ...moviePatch } : s,
      ));
      setEditingScreening(null);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
    setUserList((prev) => prev.filter((u) => u.id !== id));
  };

  const handleToggleRole = async (id: number, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const res = await fetch(`/api/users/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) setUserList((prev) => prev.map((u) => u.id === id ? { ...u, role: newRole } : u));
  };

  const handleSendNotification = async (payload: { title: string; body: string; url: string; recipients: 'all' | number[] }) => {
    setSending(true);
    setSendResult(null);
    const res = await fetch('/api/push/send', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok) {
      setSendResult({ sent: data.sent, failed: data.failed });
      setLogs((prev) => [{ id: data.id, title: payload.title, body: payload.body, url: payload.url, recipientType: payload.recipients === 'all' ? 'all' : 'custom', recipientUserIds: payload.recipients === 'all' ? null : JSON.stringify(payload.recipients), sent: data.sent, failed: data.failed, sentAt: Date.now() }, ...prev]);
      setCompose({ title: '', body: '', url: '/', recipients: 'all' });
    }
    setSending(false);
  };

  const handleOpenEntradas = async (screeningId: number) => {
    if (entrScreeningId === screeningId) { setEntrScreeningId(null); return; }
    setEntrScreeningId(screeningId);
    setEntrSearch('');
    setEntrLoading(true);
    const res = await fetch(`/api/admin/screenings/${screeningId}/attendances`);
    if (res.ok) setEntrAttendees(await res.json());
    setEntrLoading(false);
  };

  const handleAssignTicket = async (screeningId: number, userId: number) => {
    const res = await fetch(`/api/admin/screenings/${screeningId}/attendances`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      const user = userList.find((u) => u.id === userId);
      if (user) setEntrAttendees((prev) => [...prev, { userId: user.id, username: user.username, displayName: null, avatar: null }]);
    }
    setEntrSearch('');
  };

  const handleRemoveTicket = async (screeningId: number, userId: number) => {
    await fetch(`/api/admin/screenings/${screeningId}/attendances/${userId}`, { method: 'DELETE' });
    setEntrAttendees((prev) => prev.filter((a) => a.userId !== userId));
  };

  const handlePrint = () => window.print();

  // ── computed ───────────────────────────────────────────────────────────────

  const pastList = list.filter((s) => s.status === 'past');
  const upcomingWithMovie = list.filter((s) => s.status === 'upcoming' && s.title);
  const votingList = list.filter((s) => s.status === 'upcoming' && !s.title);
  const scoredPast = pastList.filter((s) => s.avgScore != null);
  const avgClub = scoredPast.length > 0
    ? scoredPast.reduce((acc, s) => acc + (s.avgScore ?? 0), 0) / scoredPast.length
    : null;
  const adminCount = userList.filter((u) => u.role === 'admin').length;

  // ── style helpers ──────────────────────────────────────────────────────────

  const inp: React.CSSProperties = {
    width: '100%', background: '#0F1216', border: '1px solid var(--line)',
    borderRadius: 6, padding: '9px 12px', fontSize: 13, color: 'var(--ink)',
    outline: 'none', height: 38, fontFamily: 'var(--font-sans)',
  };

  const tblHeadInline: React.CSSProperties = {
    padding: '0 18px', background: '#0F1216',
    borderBottom: '1px solid var(--line)', fontFamily: 'var(--font-mono)',
    fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em',
    color: 'var(--ink-mute)',
  };

  const tblRowInline: React.CSSProperties = {
    padding: '0 18px',
  };

  const ibtn = (variant: 'default' | 'primary' | 'active' = 'default'): React.CSSProperties => ({
    width: 32, height: 32, background: variant === 'active' ? 'rgba(228, 98, 23, 0.12)' : 'transparent',
    border: `1px solid ${variant === 'primary' ? 'var(--accent)' : variant === 'active' ? 'var(--accent)' : 'var(--line)'}`,
    borderRadius: 6, color: variant !== 'default' ? 'var(--accent)' : 'var(--ink-soft)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  });

  const pill = (s: ScreeningRow) => {
    const isVoting = s.status === 'upcoming' && !s.title;
    if (isVoting) return { label: 'Votación', bg: 'rgba(228, 242, 119, 0.15)', color: '#E4F277', border: 'none' };
    if (s.status === 'upcoming') return { label: 'Próxima', bg: 'var(--accent)', color: '#14181C', border: 'none' };
    return { label: 'Pasada', bg: 'var(--bg-card)', color: 'var(--ink-mute)', border: '1px solid var(--line)' };
  };

  const posterStyle = (s: ScreeningRow): React.CSSProperties => ({
    width: 40, height: 56, borderRadius: 4, flexShrink: 0,
    ...(s.posterPath
      ? { backgroundImage: `url(https://image.tmdb.org/t/p/w92${s.posterPath})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : { background: `linear-gradient(135deg, oklch(0.32 0.10 ${s.posterHue ?? 210}), oklch(0.18 0.06 ${s.posterHue ?? 210}))` }),
  });

  const statCard = (label: string, value: React.ReactNode, sub?: string) => (
    <div style={{ background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 10, padding: '16px 18px' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.14em', textTransform: 'uppercase' as const, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)', letterSpacing: '0.08em' }}>{sub}</div>}
    </div>
  );

  const pageHead = (crumb: string, title: string, action?: React.ReactNode) => (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, marginBottom: 24 }}>
      <div>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>{crumb}</p>
        <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', margin: '4px 0 0', lineHeight: 1 }}>{title}</h2>
      </div>
      {action}
    </div>
  );

  const btnPrimary: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6, height: 38, padding: '0 16px',
    background: 'var(--accent)', color: '#14181C', border: 'none', borderRadius: 6,
    fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)', letterSpacing: '0.01em',
  };

  const btnGhost: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6, height: 38, padding: '0 16px',
    background: 'transparent', color: 'var(--ink)', border: '1px solid var(--line)', borderRadius: 6,
    fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)',
  };

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="page-enter admin-layout">

      {/* ═══ SIDEBAR ═══════════════════════════════════════════════════════ */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 6px' }}>
            Panel · Admin
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.01em', margin: '0 0 24px', lineHeight: 1.05 }}>
            Cine <span style={{ color: 'var(--accent)' }}>Terabithia</span>
          </h1>
        </div>

        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'contents' }}>
          {([
            { key: 'funciones' as const, label: 'Funciones', count: list.length },
            { key: 'entradas' as const, label: 'Entradas', count: list.length },
            { key: 'watchlist' as const, label: 'Sugeridos', count: recList.length + assignedRecList.length },
            { key: 'usuarios' as const, label: 'Usuarios', count: userList.length },
            { key: 'notificaciones' as const, label: 'Notificaciones', count: subscribedUserIds.length },
            { key: 'actividad' as const, label: 'Actividad', count: analyticsRows.length },
          ]).map((item) => (
            <li
              key={item.key}
              onClick={() => setTab(item.key)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 12px', borderRadius: 6, cursor: 'pointer', marginBottom: 2,
                background: tab === item.key ? 'rgba(228, 98, 23, 0.12)' : 'transparent',
                color: tab === item.key ? 'var(--accent)' : 'var(--ink-soft)',
                fontWeight: tab === item.key ? 600 : 500, fontSize: 13, userSelect: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              <span>{item.label}</span>
              <span className="admin-tab-count" style={{
                fontFamily: 'var(--font-mono)', fontSize: 11, padding: '2px 8px', borderRadius: 999,
                background: tab === item.key ? 'var(--accent)' : 'var(--bg-elev)',
                color: tab === item.key ? '#14181C' : 'var(--ink-mute)', minWidth: 28, textAlign: 'center' as const,
                marginLeft: 8,
              }}>{item.count}</span>
            </li>
          ))}
        </ul>

        <div className="admin-sidebar-footer" style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--ink-mute)', fontSize: 12, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, padding: '6px 12px', borderRadius: 4 }}>
            ← Ir al sitio
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-mute)', fontSize: 12, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, padding: '6px 12px', textAlign: 'left' as const }}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ═══ MAIN ══════════════════════════════════════════════════════════ */}
      <main className="admin-main">

        {/* ── FUNCIONES ── */}
        {tab === 'funciones' && (
          <section>
            {pageHead('Admin / Funciones', 'Funciones',
              <button onClick={() => setTab('nueva')} style={btnPrimary}>+ Nueva función</button>
            )}

            <div className="admin-stats-4">
              {statCard('Total proyectadas', pastList.length, `+${list.length} en total`)}
              {statCard(
                'Próxima',
                upcomingWithMovie[0]
                  ? <span style={{ color: 'var(--accent)', fontSize: 20 }}>{fmtDate(upcomingWithMovie[0].scheduledDate)}</span>
                  : '—',
                upcomingWithMovie[0]?.title ?? undefined,
              )}
              {statCard('En votación', votingList.length, votingList.length > 0 ? 'Esperando votos' : 'Ninguna activa')}
              {statCard(
                'Promedio club',
                avgClub
                  ? <>{avgClub.toFixed(1)}<span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 400, color: 'var(--ink-mute)', marginLeft: 6 }}>/ 5</span></>
                  : '—',
                scoredPast.length > 0 ? `${scoredPast.length} funciones votadas` : 'Sin votos aún',
              )}
            </div>

            <div style={{ background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
            <div className="admin-table-scroll">
              <div className="admin-fn-head" style={tblHeadInline}>
                <span />
                <span>Película</span>
                <span>Estado</span>
                <span>Fecha</span>
                <span>Curador</span>
                <span>Puntaje</span>
                <span style={{ textAlign: 'right' }}>Acciones</span>
              </div>

              {list.length === 0 && (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-mute)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>Sin funciones.</div>
              )}

              {list.map((s, i) => {
                const isOpen = s.status === 'upcoming' && !s.title;
                const isAssigning = assigningId === s.id;
                const isCopied = copiedId === s.id;
                const p = pill(s);

                return (
                  <div key={s.id} style={{ borderBottom: i === list.length - 1 ? 'none' : '1px solid var(--line)' }}>
                    <div className="admin-fn-row" style={tblRowInline}>
                      {/* Poster */}
                      <div className="admin-fn-poster" style={posterStyle(s)} />

                      {/* Title + meta */}
                      <div className="admin-fn-title" style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.25, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {isOpen
                            ? <em style={{ fontStyle: 'italic', color: 'var(--ink-mute)' }}>&ldquo;a definir por votación&rdquo;</em>
                            : <>{s.title}<span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 400, color: 'var(--ink-mute)', marginLeft: 4 }}>&apos;{(s.year ?? '').toString().slice(-2)}</span></>
                          }
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-mute)', letterSpacing: '0.06em', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                          {isOpen ? 'Votación abierta' : [s.director, s.duration ? `${s.duration} min` : null, s.genre].filter(Boolean).join(' · ')}
                        </div>
                      </div>

                      {/* Status pill */}
                      <span className="admin-fn-status" style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.14em',
                        textTransform: 'uppercase', padding: '4px 10px', borderRadius: 999,
                        height: 22, fontWeight: 500, whiteSpace: 'nowrap' as const,
                        background: p.bg, color: p.color, border: p.border,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
                        {p.label}
                      </span>

                      {/* Date */}
                      <div className="admin-fn-date" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.04em' }}>
                        {fmtDate(s.scheduledDate)}
                        <span style={{ display: 'block', fontSize: 10.5, color: 'var(--ink-mute)', letterSpacing: '0.08em', marginTop: 2 }}>
                          {[s.hour, s.location].filter(Boolean).join(' · ')}
                        </span>
                      </div>

                      {/* Curator */}
                      <div className="admin-fn-curator" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {s.curatedBy && <Avatar name={s.curatedBy} size="sm" />}
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.curatedBy || '—'}
                        </span>
                      </div>

                      {/* Rating */}
                      <div className="admin-fn-rating">
                        {s.avgScore ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ color: '#E4F277', fontSize: 14 }}>★</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13 }}>{s.avgScore.toFixed(1)}</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>/ 5</span>
                          </div>
                        ) : (
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>—</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="admin-fn-actions" style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                        {isOpen ? (
                          <button
                            onClick={() => handleOpenAssign(s.id)}
                            style={{ height: 32, padding: '0 10px', background: isAssigning ? 'transparent' : 'var(--accent)', color: isAssigning ? 'var(--accent)' : '#14181C', border: '1px solid var(--accent)', borderRadius: 6, fontWeight: 700, fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap' as const }}
                          >
                            {isAssigning ? 'Cerrar ▲' : '🗳 Definir ▼'}
                          </button>
                        ) : s.status === 'upcoming' ? (
                          <button
                            title={isCopied ? '¡Copiado!' : 'Copiar enlace de asistencia'}
                            onClick={() => handleCopyLink(s.id)}
                            style={ibtn(isCopied ? 'active' : 'default')}
                          >
                            {isCopied
                              ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M20 6L9 17l-5-5" /></svg>
                              : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
                            }
                          </button>
                        ) : null}

                        {!isOpen && (
                          <button
                            title={s.status === 'upcoming' ? 'Marcar como pasada' : 'Restaurar a próxima'}
                            onClick={() => handleToggleStatus(s.id, s.status)}
                            style={ibtn()}
                          >
                            {s.status === 'upcoming'
                              ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M20 6L9 17l-5-5" /></svg>
                              : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M3 12a9 9 0 0115-6.7l3-3v9h-9l3-3a6 6 0 100 8.5" /></svg>
                            }
                          </button>
                        )}

                        {s.status !== 'past' && (
                          <button
                            title="Editar"
                            onClick={() => handleOpenEdit(s)}
                            style={ibtn()}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                        )}

                        <button
                          title="Eliminar"
                          onClick={() => handleDelete(s.id)}
                          style={{ ...ibtn(), border: '1px solid transparent' }}
                          onMouseEnter={(e) => {
                            Object.assign((e.currentTarget as HTMLButtonElement).style, { color: 'var(--hot)', borderColor: 'var(--hot)', background: 'rgba(255,90,95,0.1)' });
                          }}
                          onMouseLeave={(e) => {
                            Object.assign((e.currentTarget as HTMLButtonElement).style, { color: 'var(--ink-soft)', borderColor: 'transparent', background: 'transparent' });
                          }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Assign panel */}
                    {isAssigning && (
                      <div style={{ padding: '16px 24px', background: '#0F1216', borderTop: '1px solid var(--line)' }}>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 12px' }}>
                          Resultados de la votación — elegí la ganadora
                        </p>
                        {voteResults.length === 0
                          ? <p style={{ color: 'var(--ink-mute)', fontSize: 13, margin: 0 }}>Todavía no hay votos. Podés asignar cualquier sugerencia.</p>
                          : voteResults.map((r, idx) => (
                            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: idx < voteResults.length - 1 ? '1px solid var(--line)' : 'none' }}>
                              <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.04em', color: idx === 0 ? 'var(--accent)' : 'var(--ink-mute)', minWidth: 28 }}>{idx + 1}</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700 }}>{r.title}{r.year ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 400, color: 'var(--ink-mute)', marginLeft: 6 }}>{r.year}</span> : null}</div>
                                {r.director && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)' }}>dir. {r.director}</div>}
                              </div>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: idx === 0 ? 'var(--accent)' : 'var(--ink-mute)', fontWeight: 700 }}>{r.votes} votos</span>
                              <button style={{ ...btnPrimary, height: 32, fontSize: 12 }} onClick={() => handleAssignWinner(s.id, r.id)}>Asignar ✓</button>
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            </div>
          </section>
        )}

        {/* ── SUGERIDOS ── */}
        {tab === 'watchlist' && (
          <section>
            {pageHead('Admin / Sugeridos', 'Sugeridos por el club')}

            {recList.length === 0 && assignedRecList.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-mute)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>Sin sugerencias todavía.</div>
            )}

            <div className="admin-recs-grid">
              {recList.map((r) => (
                <div key={r.id} style={{
                  background: r.featured
                    ? `linear-gradient(180deg, rgba(228, 98, 23, 0.08), transparent 30%), var(--bg-elev)`
                    : 'var(--bg-elev)',
                  border: `1px solid ${r.featured ? 'var(--accent)' : 'var(--line)'}`,
                  borderRadius: 10, padding: 16,
                  display: 'grid', gridTemplateColumns: '64px 1fr', gap: 14,
                }}>
                  <div style={{
                    width: 64, height: 90, borderRadius: 4,
                    ...(r.posterPath
                      ? { backgroundImage: `url(https://image.tmdb.org/t/p/w92${r.posterPath})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                      : { background: `linear-gradient(135deg, oklch(0.32 0.10 ${r.posterHue ?? 210}), oklch(0.18 0.06 ${r.posterHue ?? 210}))` }),
                  }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.title}{r.year && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 400, color: 'var(--ink-mute)', marginLeft: 4 }}>&apos;{r.year.toString().slice(-2)}</span>}
                      </div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: r.votes > 0 ? 'var(--accent)' : 'var(--ink-mute)', background: r.votes > 0 ? 'rgba(228, 98, 23, 0.12)' : 'var(--bg-card)', padding: '3px 8px', borderRadius: 6, flexShrink: 0 }}>
                        ↑ {r.votes}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)', letterSpacing: '0.04em', marginBottom: r.reason ? 8 : 12 }}>
                      <Avatar name={r.suggestedBy} size="sm" />
                      <span>{r.suggestedBy}</span>
                    </div>
                    {r.reason && (
                      <p style={{ fontStyle: 'italic', fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.4, borderLeft: '2px solid var(--line)', paddingLeft: 10, margin: '0 0 12px' }}>
                        &ldquo;{r.reason}&rdquo;
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' as const }}>
                      <button
                        onClick={() => { setQuickRec(r); setQuickForm({ scheduledDate: '', hour: '21:00', location: '', snack: '', curatedBy: r.suggestedBy }); }}
                        style={{ height: 30, padding: '0 12px', background: 'var(--accent)', color: '#14181C', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
                      >
                        Programar
                      </button>
                      <button
                        onClick={() => handleFeatureRec(r.id, r.featured)}
                        style={{ height: 30, padding: '0 12px', background: 'transparent', border: '1px solid var(--line)', borderRadius: 6, color: r.featured ? 'var(--accent)' : 'var(--ink-soft)', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
                      >
                        {r.featured ? '★ Destacada' : 'Destacar'}
                      </button>
                      <button
                        onClick={() => handleDeleteRec(r.id)}
                        style={{ width: 30, height: 30, background: 'transparent', border: '1px solid transparent', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-mute)' }}
                        onMouseEnter={(e) => Object.assign((e.currentTarget as HTMLButtonElement).style, { color: 'var(--hot)', borderColor: 'var(--hot)' })}
                        onMouseLeave={(e) => Object.assign((e.currentTarget as HTMLButtonElement).style, { color: 'var(--ink-mute)', borderColor: 'transparent' })}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M18 6L6 18M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {assignedRecList.length > 0 && (
              <div style={{ marginTop: 40 }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 16px' }}>
                  Ya programadas ({assignedRecList.length})
                </p>
                <div className="admin-recs-grid">
                  {assignedRecList.map((r) => (
                    <div key={r.id} style={{
                      background: 'var(--bg-elev)', border: '1px solid var(--line)',
                      borderRadius: 10, padding: 16, opacity: 0.6,
                      display: 'grid', gridTemplateColumns: '64px 1fr', gap: 14,
                    }}>
                      <div style={{
                        width: 64, height: 90, borderRadius: 4,
                        ...(r.posterPath
                          ? { backgroundImage: `url(https://image.tmdb.org/t/p/w92${r.posterPath})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                          : { background: `linear-gradient(135deg, oklch(0.32 0.10 ${r.posterHue ?? 210}), oklch(0.18 0.06 ${r.posterHue ?? 210}))` }),
                      }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                          {r.title}{r.year && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 400, color: 'var(--ink-mute)', marginLeft: 4 }}>&apos;{r.year.toString().slice(-2)}</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)', letterSpacing: '0.04em', marginBottom: 12 }}>
                          <Avatar name={r.suggestedBy} size="sm" />
                          <span>{r.suggestedBy}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => handleReactivateRec(r.id)}
                            style={{ height: 30, padding: '0 12px', background: 'transparent', border: '1px solid var(--line)', borderRadius: 6, color: 'var(--ink-soft)', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
                          >
                            Reactivar
                          </button>
                          <button
                            onClick={() => handleDeleteRec(r.id)}
                            style={{ width: 30, height: 30, background: 'transparent', border: '1px solid transparent', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-mute)' }}
                            onMouseEnter={(e) => Object.assign((e.currentTarget as HTMLButtonElement).style, { color: 'var(--hot)', borderColor: 'var(--hot)' })}
                            onMouseLeave={(e) => Object.assign((e.currentTarget as HTMLButtonElement).style, { color: 'var(--ink-mute)', borderColor: 'transparent' })}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M18 6L6 18M6 6l12 12" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── USUARIOS ── */}
        {tab === 'usuarios' && (
          <section>
            {pageHead('Admin / Usuarios', 'Miembros del club',
              <button style={btnPrimary}>+ Crear usuario</button>
            )}

            <div className="admin-stats-3">
              {statCard('Total miembros', userList.length)}
              {statCard('Admins', <span style={{ color: 'var(--accent)' }}>{adminCount}</span>, userList.filter((u) => u.role === 'admin').map((u) => u.username).join(' · ') || '—')}
              {statCard('Usuarios regulares', userList.length - adminCount)}
            </div>

            <div style={{ background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden', marginBottom: 24 }}>
            <div className="admin-table-scroll">
              <div className="admin-usr-head" style={{ padding: '0 18px', background: '#0F1216', borderBottom: '1px solid var(--line)', fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: 'var(--ink-mute)' }}>
                <span>Miembro</span>
                <span>Rol</span>
                <span>Toggle</span>
                <span style={{ textAlign: 'center' as const }}>Notis</span>
                <span style={{ textAlign: 'right' as const }}>Acción</span>
              </div>

              {userList.map((u, i) => (
                <div key={u.id} className="admin-usr-row" style={{ padding: '0 18px', borderBottom: i === userList.length - 1 ? 'none' : '1px solid var(--line)' }}>
                  <div className="admin-usr-member">
                    <Avatar name={u.displayName ?? u.username} size="md" />
                    <div className="admin-usr-member-text">
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{u.displayName ?? u.username}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)', letterSpacing: '0.06em' }}>@{u.username}</div>
                    </div>
                  </div>
                  <span className="admin-usr-role" style={{ display: 'inline-flex', alignItems: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.1em', padding: '3px 8px', borderRadius: 3, background: u.role === 'admin' ? 'var(--accent)' : 'var(--bg-card)', color: u.role === 'admin' ? '#14181C' : 'var(--ink-soft)', border: u.role === 'admin' ? 'none' : '1px solid var(--line)', width: 'fit-content' }}>
                    {u.role}
                  </span>
                  <div style={{ display: 'inline-flex', background: '#0F1216', border: '1px solid var(--line)', borderRadius: 6, padding: 2, height: 28, width: 'fit-content' }}>
                    <button
                      onClick={() => u.role !== 'admin' && handleToggleRole(u.id, u.role)}
                      style={{ background: u.role === 'admin' ? 'var(--accent)' : 'transparent', border: 'none', borderRadius: 4, color: u.role === 'admin' ? '#14181C' : 'var(--ink-mute)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' as const, padding: '0 10px', cursor: u.role !== 'admin' ? 'pointer' : 'default' }}
                    >Admin</button>
                    <button
                      onClick={() => u.role !== 'user' && handleToggleRole(u.id, u.role)}
                      style={{ background: u.role === 'user' ? 'var(--bg-card)' : 'transparent', border: 'none', borderRadius: 4, color: u.role === 'user' ? 'var(--ink)' : 'var(--ink-mute)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' as const, padding: '0 10px', cursor: u.role !== 'user' ? 'pointer' : 'default' }}
                    >User</button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <span title={subscribedSet.has(u.id) ? 'Notificaciones activas' : 'Sin notificaciones'}>
                      <svg viewBox="0 0 24 24" fill={subscribedSet.has(u.id) ? 'var(--accent)' : 'none'} stroke={subscribedSet.has(u.id) ? 'var(--accent)' : 'var(--line)'} strokeWidth={1.8} style={{ width: 16, height: 16 }}>
                        <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 01-3.46 0" />
                      </svg>
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      title="Eliminar usuario"
                      onClick={() => handleDeleteUser(u.id)}
                      style={{ ...ibtn(), border: '1px solid transparent' }}
                      onMouseEnter={(e) => Object.assign((e.currentTarget as HTMLButtonElement).style, { color: 'var(--hot)', borderColor: 'var(--hot)', background: 'rgba(255,90,95,0.1)' })}
                      onMouseLeave={(e) => Object.assign((e.currentTarget as HTMLButtonElement).style, { color: 'var(--ink-soft)', borderColor: 'transparent', background: 'transparent' })}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /></svg>
                    </button>
                  </div>
                </div>
              ))}

              {userList.length === 0 && (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-mute)' }}>Sin usuarios.</div>
              )}
            </div>
            </div>

            <div style={{ background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 12, padding: 24 }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 16px' }}>Nuevo usuario</p>
              <form onSubmit={handleCreateUser} className="admin-user-form">
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>Usuario</label>
                  <input value={newUser.username} onChange={(e) => setNewUser((p) => ({ ...p, username: e.target.value }))} placeholder="nombre" required style={inp} />
                </div>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>Contraseña</label>
                  <input type="password" value={newUser.password} onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))} placeholder="••••••••" required style={inp} />
                </div>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>Rol</label>
                  <select value={newUser.role} onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value }))} style={inp}>
                    <option value="user">Usuario</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button type="submit" style={{ ...btnPrimary, height: 38 }}>Crear</button>
              </form>
              {userError && <p style={{ marginTop: 10, fontSize: 13, color: 'var(--hot)', margin: '10px 0 0' }}>{userError}</p>}
            </div>
          </section>
        )}

        {/* ── NOTIFICACIONES ── */}
        {tab === 'notificaciones' && (
          <section>
            {pageHead('Admin / Notificaciones', 'Notificaciones push')}

            {/* Compose */}
            <div style={{ background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 12, padding: 24, marginBottom: 32 }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 16px' }}>Nueva notificación</p>

              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.14em', textTransform: 'uppercase' as const, marginBottom: 6 }}>Título</label>
                    <input value={compose.title} onChange={(e) => setCompose((p) => ({ ...p, title: e.target.value }))} placeholder="Ej: Nueva función" style={inp} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.14em', textTransform: 'uppercase' as const, marginBottom: 6 }}>URL destino</label>
                    <input value={compose.url} onChange={(e) => setCompose((p) => ({ ...p, url: e.target.value }))} placeholder="/" style={inp} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.14em', textTransform: 'uppercase' as const, marginBottom: 6 }}>Mensaje</label>
                  <textarea value={compose.body} onChange={(e) => setCompose((p) => ({ ...p, body: e.target.value }))} placeholder="Texto de la notificación..." rows={2} style={{ ...inp, resize: 'vertical' as const }} />
                </div>

                {/* Recipients */}
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.14em', textTransform: 'uppercase' as const, marginBottom: 8 }}>Destinatarios</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setCompose((p) => ({ ...p, recipients: 'all' }))}
                      style={{ height: 30, padding: '0 14px', borderRadius: 6, border: '1px solid', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', cursor: 'pointer', background: compose.recipients === 'all' ? 'var(--accent)' : 'transparent', color: compose.recipients === 'all' ? '#14181C' : 'var(--ink-mute)', borderColor: compose.recipients === 'all' ? 'var(--accent)' : 'var(--line)' }}
                    >
                      Todos ({subscribedUserIds.length})
                    </button>
                    {userList.filter((u) => subscribedSet.has(u.id)).map((u) => {
                      const selected = Array.isArray(compose.recipients) && compose.recipients.includes(u.id);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => setCompose((p) => {
                            const current = p.recipients === 'all' ? [] : [...p.recipients];
                            return { ...p, recipients: selected ? current.filter((id) => id !== u.id) : [...current, u.id] };
                          })}
                          style={{ height: 30, padding: '0 12px', borderRadius: 6, border: '1px solid', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.06em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, background: selected ? 'rgba(228,98,23,0.12)' : 'transparent', color: selected ? 'var(--accent)' : 'var(--ink-mute)', borderColor: selected ? 'var(--accent)' : 'var(--line)' }}
                        >
                          <Avatar name={u.displayName ?? u.username} size="sm" />
                          {u.displayName ?? u.username}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                  <button
                    type="button"
                    disabled={sending || !compose.title.trim() || !compose.body.trim() || (Array.isArray(compose.recipients) && compose.recipients.length === 0)}
                    onClick={() => handleSendNotification(compose)}
                    style={{ ...btnPrimary, opacity: sending ? 0.6 : 1 }}
                  >
                    {sending ? 'Enviando...' : 'Enviar'}
                  </button>
                  {sendResult && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: sendResult.failed === 0 ? '#4ade80' : 'var(--hot)' }}>
                      ✓ {sendResult.sent} enviadas{sendResult.failed > 0 ? `, ${sendResult.failed} fallidas` : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* History */}
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 12px' }}>Historial</p>
            {logs.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-mute)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>Sin notificaciones enviadas aún.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {logs.map((log) => (
                  <div key={log.id} style={{ background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 10, padding: '14px 18px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'start' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{log.title}</div>
                      <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 8 }}>{log.body}</div>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)' }}>{fmtTs(log.sentAt)}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: log.recipientType === 'all' ? 'var(--ink-mute)' : 'var(--accent)' }}>
                          {log.recipientType === 'all' ? 'Todos' : `${(JSON.parse(log.recipientUserIds ?? '[]') as number[]).length} usuarios`}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#4ade80' }}>{log.sent} enviadas</span>
                        {log.failed > 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--hot)' }}>{log.failed} fallidas</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleSendNotification({ title: log.title, body: log.body, url: log.url, recipients: log.recipientType === 'all' ? 'all' : JSON.parse(log.recipientUserIds ?? '[]') })}
                      disabled={sending}
                      style={{ ...btnGhost, height: 32, fontSize: 12, padding: '0 12px', flexShrink: 0 }}
                    >
                      Reenviar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── ENTRADAS ── */}
        {tab === 'entradas' && (() => {
          const selectedScreening = list.find((s) => s.id === entrScreeningId) ?? null;
          const attendeeIds = new Set(entrAttendees.map((a) => a.userId));
          const searchLower = entrSearch.toLowerCase();
          const searchResults = entrSearch.length > 0
            ? userList.filter((u) => !attendeeIds.has(u.id) && u.username.toLowerCase().includes(searchLower))
            : [];

          return (
            <section>
              {pageHead('Admin / Entradas', 'Entradas',
                selectedScreening && entrAttendees.length > 0
                  ? <button onClick={handlePrint} style={btnPrimary}>Imprimir tickets ({entrAttendees.length})</button>
                  : undefined,
              )}

              <div className="entradas-grid">

                {/* ── Lista de funciones ── */}
                <div className={`entradas-list-col${selectedScreening ? ' has-selection' : ''}`} style={{ background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--line)', fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: 'var(--ink-mute)', background: '#0F1216' }}>
                    Funciones ({list.length})
                  </div>
                  {list.map((s) => {
                    const isSelected = entrScreeningId === s.id;
                    return (
                      <div
                        key={s.id}
                        onClick={() => handleOpenEntradas(s.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--line)', background: isSelected ? 'rgba(228, 98, 23, 0.10)' : 'transparent', borderLeft: `3px solid ${isSelected ? 'var(--accent)' : 'transparent'}`, transition: 'background 0.1s' }}
                        onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
                        onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                      >
                        <div style={{ ...posterStyle(s), width: 28, height: 40, flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--ink)' : 'var(--ink-soft)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {s.title ?? 'Sin película'}
                          </div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: isSelected ? 'var(--accent)' : 'var(--ink-mute)', marginTop: 2 }}>
                            {fmtDate(s.scheduledDate)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── Panel de gestión ── */}
                {!selectedScreening ? (
                  <div className="entradas-detail-col no-selection" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 10, color: 'var(--ink-mute)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                    Seleccioná una función para gestionar sus entradas
                  </div>
                ) : (
                  <div className="entradas-detail-col">
                    <button className="entradas-back-btn" onClick={() => setEntrScreeningId(null)}>
                      ← Volver
                    </button>
                    <div style={{ background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 10 }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: '1px solid var(--line)', background: '#0F1216', borderRadius: '10px 10px 0 0' }}>
                      <div style={{ ...posterStyle(selectedScreening), width: 32, height: 46, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{selectedScreening.title ?? 'Sin película'}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)', marginTop: 2 }}>
                          {fmtDate(selectedScreening.scheduledDate)}{selectedScreening.location ? ` · ${selectedScreening.location}` : ''}
                        </div>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, padding: '3px 10px', borderRadius: 999, background: 'rgba(228,98,23,0.15)', color: 'var(--accent)' }}>
                        {entrAttendees.length} asistentes
                      </span>
                    </div>

                    {/* Attendees */}
                    <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {entrLoading ? (
                        <div style={{ color: 'var(--ink-mute)', fontFamily: 'var(--font-mono)', fontSize: 12, padding: '16px 0', textAlign: 'center' as const }}>Cargando...</div>
                      ) : entrAttendees.length === 0 ? (
                        <div style={{ color: 'var(--ink-mute)', fontFamily: 'var(--font-mono)', fontSize: 12, padding: '16px 0', textAlign: 'center' as const }}>Sin asistentes registrados para esta función.</div>
                      ) : (
                        entrAttendees.map((a) => (
                          <div key={a.userId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--bg-card)', borderRadius: 8 }}>
                            <Avatar name={a.displayName ?? a.username} size="sm" />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 600 }}>{a.displayName ?? a.username}</div>
                              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)' }}>@{a.username}</div>
                            </div>
                            <button
                              onClick={() => handleRemoveTicket(selectedScreening.id, a.userId)}
                              style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--hot)', cursor: 'pointer' }}
                            >
                              Quitar
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Search */}
                    <div style={{ padding: '0 18px 18px', position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="Agregar usuario..."
                        value={entrSearch}
                        onChange={(e) => setEntrSearch(e.target.value)}
                        style={inp}
                      />
                      {searchResults.length > 0 && (
                        <div style={{ position: 'absolute', top: '100%', left: 18, right: 18, zIndex: 50, background: '#1a1d23', border: '1px solid var(--accent)', borderRadius: 8, marginTop: 2, boxShadow: '0 8px 24px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
                          {searchResults.slice(0, 8).map((u) => (
                            <button
                              key={u.id}
                              onClick={() => handleAssignTicket(selectedScreening.id, u.id)}
                              style={{ width: '100%', background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: 'var(--ink)', textAlign: 'left' as const }}
                              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(228,98,23,0.10)')}
                              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'none')}
                            >
                              <Avatar name={u.displayName ?? u.username} size="sm" />
                              <div style={{ lineHeight: 1.2 }}>
                                <div style={{ fontSize: 13, color: 'var(--ink)' }}>{u.displayName ?? u.username}</div>
                                {u.displayName && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)' }}>@{u.username}</div>}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          );
        })()}

        {/* ── NUEVA FUNCIÓN ── */}
        {tab === 'nueva' && (
          <section>
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>Admin / Funciones / Nueva</p>
              <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', margin: '4px 0 0', lineHeight: 1 }}>Nueva función</h2>
            </div>

            <form onSubmit={handleCreate}>
              <div className="admin-nueva-grid">
                <div style={{ background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 12, padding: 24 }}>

                  {/* Mode switch */}
                  <div className="admin-nueva-mode-switch">
                    {[
                      { label: 'Programar directa', desc: 'Elegís la película y la fecha ahora.', val: false },
                      { label: 'Abrir a votación', desc: 'El club vota entre las sugerencias.', val: true },
                    ].map((opt) => (
                      <div
                        key={String(opt.val)}
                        onClick={() => {
                          setOpenVoting(opt.val);
                          if (opt.val) setForm((p) => ({ ...p, title: '', year: '', director: '', genre: '', duration: '', synopsis: '', posterPath: null, tmdbId: null }));
                        }}
                        style={{ border: `1px solid ${openVoting === opt.val ? 'var(--accent)' : 'var(--line)'}`, borderRadius: 10, padding: '14px 16px', cursor: 'pointer', background: openVoting === opt.val ? 'rgba(228, 98, 23, 0.08)' : '#0F1216', transition: 'all 0.12s' }}
                      >
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: openVoting === opt.val ? 'var(--accent)' : 'var(--ink-mute)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>Modo</div>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{opt.label}</div>
                        <div style={{ fontStyle: 'italic', fontSize: 13, color: 'var(--ink-mute)', lineHeight: 1.3 }}>{opt.desc}</div>
                      </div>
                    ))}
                  </div>

                  {!openVoting && <MovieSearch onSelect={handleMovieSelect} placeholder="Buscar película en TMDB…" />}

                  <div className="admin-nueva-fields">
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>Fecha *</label>
                      <DatePicker value={form.scheduledDate} onChange={(v) => setForm((p) => ({ ...p, scheduledDate: v }))} style={inp} />
                    </div>
                    {([
                      ...(!openVoting ? [
                        ['title', 'Título', 'text'],
                        ['year', 'Año', 'number'],
                        ['director', 'Director', 'text'],
                        ['genre', 'Género', 'text'],
                        ['duration', 'Duración (min)', 'number'],
                      ] : []),
                      ['hour', 'Hora', 'time'],
                      ['snack', 'Snack', 'text'],
                      ['location', 'Lugar', 'text'],
                      ['curatedBy', 'Curado por', 'text'],
                    ] as [string, string, string][]).map(([field, label, type]) => (
                      <div key={field}>
                        <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</label>
                        <input type={type} value={form[field as keyof typeof form] ?? ''} onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))} style={inp} />
                      </div>
                    ))}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>Estado</label>
                      <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} style={inp}>
                        <option value="upcoming">Próxima</option>
                        <option value="past">Pasada</option>
                      </select>
                    </div>
                    {!openVoting && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>Sinopsis</label>
                        <textarea value={form.synopsis} onChange={(e) => setForm((p) => ({ ...p, synopsis: e.target.value }))} rows={3} style={{ ...inp, height: 'auto', resize: 'vertical' as const }} />
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                    <button type="button" onClick={() => setTab('funciones')} style={btnGhost}>Cancelar</button>
                    <button type="submit" style={btnPrimary}>Crear función</button>
                  </div>
                </div>

                {/* Live preview */}
                <div className="admin-nueva-preview" style={{ position: 'sticky', top: 90 }}>
                  <div style={{ background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', background: '#0F1216', fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: 'var(--ink-mute)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Vista previa</span>
                      <span style={{ color: '#5BB17C', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#5BB17C', display: 'inline-block' }} />Live
                      </span>
                    </div>
                    <div style={{ padding: 16 }}>
                      <div style={{
                        width: '100%', aspectRatio: '2/3', borderRadius: 6, marginBottom: 14,
                        ...(form.posterPath
                          ? { backgroundImage: `url(https://image.tmdb.org/t/p/w342${form.posterPath})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                          : { background: 'linear-gradient(135deg, #2a2218 0%, #14181C 70%)' }),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {!form.posterPath && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-dim)', letterSpacing: '0.14em', textTransform: 'uppercase' as const }}>Sin póster</span>}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 18, lineHeight: 1.2, margin: '0 0 2px' }}>
                        {form.title
                          ? <>{form.title}{form.year && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 400, color: 'var(--ink-mute)', marginLeft: 6 }}>&apos;{form.year.slice(-2)}</span>}</>
                          : <span style={{ color: 'var(--ink-mute)', fontStyle: 'italic', fontSize: 15 }}>{openVoting ? 'A definir por votación' : 'Título de la película'}</span>
                        }
                      </div>
                      <div style={{ height: 1, background: 'var(--line)', margin: '12px 0' }} />
                      {([
                        ['Fecha', form.scheduledDate ? fmtDateLong(form.scheduledDate) : '—'],
                        ['Hora', form.hour || '—'],
                        ['Lugar', form.location || '—'],
                        ['Snack', form.snack || '—'],
                        ['Curado por', form.curatedBy || '—'],
                      ] as [string, string][]).map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)', letterSpacing: '0.06em', lineHeight: 1.9 }}>
                          <span>{k}</span>
                          <span style={{ color: v === '—' ? 'var(--ink-dim)' : 'var(--ink)', fontWeight: v !== '—' ? 500 : 400, textAlign: 'right' as const }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </section>
        )}

        {/* ── ACTIVIDAD ── */}
        {tab === 'actividad' && (() => {
          const now = Date.now();
          const day = 86400000;

          // Agrupar vistas por día (últimos 14 días)
          const dayBuckets: Record<string, number> = {};
          for (let i = 13; i >= 0; i--) {
            const d = new Date(now - i * day);
            const k = d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
            dayBuckets[k] = 0;
          }
          for (const row of analyticsRows) {
            if (!row.createdAt) continue;
            const age = now - row.createdAt;
            if (age > 14 * day) continue;
            const k = new Date(row.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
            if (k in dayBuckets) dayBuckets[k]++;
          }
          const dayEntries = Object.entries(dayBuckets);
          const maxDay = Math.max(...dayEntries.map(([, v]) => v), 1);

          // Vistas por ruta
          const pathCounts: Record<string, number> = {};
          for (const row of analyticsRows) {
            pathCounts[row.path] = (pathCounts[row.path] ?? 0) + 1;
          }
          const topPaths = Object.entries(pathCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
          const maxPath = Math.max(...topPaths.map(([, v]) => v), 1);

          // Actividad por usuario (últimos 30 días)
          const cutoff30 = now - 30 * day;
          const userActivity: Record<number, { views: number; lastSeen: number; paths: Set<string> }> = {};
          for (const row of analyticsRows) {
            if (!row.userId || !row.createdAt) continue;
            if (!userActivity[row.userId]) userActivity[row.userId] = { views: 0, lastSeen: 0, paths: new Set() };
            userActivity[row.userId].views++;
            if (row.createdAt > userActivity[row.userId].lastSeen) userActivity[row.userId].lastSeen = row.createdAt;
            userActivity[row.userId].paths.add(row.path);
          }

          // Usuarios sin actividad en últimos 30 días
          const activeUserIds = new Set(
            analyticsRows.filter(r => r.userId && r.createdAt && r.createdAt > cutoff30).map(r => r.userId!)
          );

          const totalViews = analyticsRows.length;
          const uniqueSessions = new Set(analyticsRows.map(r => r.sessionId).filter(Boolean)).size;
          const todayViews = analyticsRows.filter(r => r.createdAt && r.createdAt > now - day).length;

          return (
            <section>
              {pageHead('Admin / Actividad', 'Actividad')}

              {/* Stats rápidas */}
              <div className="admin-stats-4" style={{ marginBottom: 28 }}>
                {statCard('Vistas (últimas 500)', totalViews, `${uniqueSessions} sesiones únicas`)}
                {statCard('Hoy', todayViews, 'page views')}
                {statCard('Usuarios activos', activeUserIds.size, 'últimos 30 días')}
                {statCard('Inactivos', initialUsers.filter(u => !activeUserIds.has(u.id)).length, 'sin actividad en 30 días')}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

                {/* Gráfico de actividad diaria */}
                <div style={{ background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 10, padding: '18px 20px' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 16 }}>Vistas · 14 días</div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
                    {dayEntries.map(([label, count]) => (
                      <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                        <div
                          title={`${label}: ${count}`}
                          style={{
                            width: '100%', borderRadius: '3px 3px 0 0',
                            background: count > 0 ? 'var(--accent)' : 'var(--bg-card)',
                            height: `${Math.max((count / maxDay) * 100, count > 0 ? 8 : 2)}%`,
                            opacity: count > 0 ? 1 : 0.3,
                            transition: 'height 0.2s',
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-mute)' }}>{dayEntries[0]?.[0]}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-mute)' }}>{dayEntries[dayEntries.length - 1]?.[0]}</span>
                  </div>
                </div>

                {/* Top páginas */}
                <div style={{ background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 10, padding: '18px 20px' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 16 }}>Top páginas</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {topPaths.map(([path, count]) => (
                      <div key={path} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-soft)', minWidth: 110, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{path}</span>
                        <div style={{ flex: 1, background: 'var(--bg-card)', borderRadius: 3, height: 6, overflow: 'hidden' }}>
                          <div style={{ width: `${(count / maxPath) * 100}%`, height: '100%', background: 'var(--accent)', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)', minWidth: 24, textAlign: 'right' as const }}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tabla de usuarios con actividad */}
              <div style={{ background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Usuarios · actividad últimos 30 días</div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ ...tblHeadInline, height: 36 }}>
                      <th style={{ textAlign: 'left' as const, padding: '0 20px', fontWeight: 500 }}>Usuario</th>
                      <th style={{ textAlign: 'left' as const, padding: '0 12px', fontWeight: 500 }}>Último acceso</th>
                      <th style={{ textAlign: 'right' as const, padding: '0 12px', fontWeight: 500 }}>Vistas</th>
                      <th style={{ textAlign: 'right' as const, padding: '0 20px', fontWeight: 500 }}>Páginas distintas</th>
                      <th style={{ textAlign: 'center' as const, padding: '0 20px', fontWeight: 500 }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {initialUsers
                      .slice()
                      .sort((a, b) => {
                        const aLast = userActivity[a.id]?.lastSeen ?? 0;
                        const bLast = userActivity[b.id]?.lastSeen ?? 0;
                        return bLast - aLast;
                      })
                      .map((u) => {
                        const act = userActivity[u.id];
                        const isActive = activeUserIds.has(u.id);
                        const lastSeen = act?.lastSeen
                          ? new Date(act.lastSeen).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                          : '—';
                        return (
                          <tr key={u.id} style={{ ...tblRowInline, height: 46, borderBottom: '1px solid var(--line)' }}>
                            <td style={{ padding: '0 20px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Avatar name={u.displayName ?? u.username} avatarId={null} size="sm" />
                                <div>
                                  <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{u.displayName ?? u.username}</div>
                                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)' }}>@{u.username}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '0 12px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>{lastSeen}</td>
                            <td style={{ padding: '0 12px', textAlign: 'right' as const, fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: isActive ? 'var(--ink)' : 'var(--ink-mute)' }}>
                              {act?.views ?? 0}
                            </td>
                            <td style={{ padding: '0 20px', textAlign: 'right' as const, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>
                              {act?.paths.size ?? 0}
                            </td>
                            <td style={{ padding: '0 20px', textAlign: 'center' as const }}>
                              <span style={{
                                fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em',
                                padding: '3px 10px', borderRadius: 999,
                                background: isActive ? 'rgba(108, 192, 108, 0.12)' : 'var(--bg-card)',
                                color: isActive ? '#6CC06C' : 'var(--ink-mute)',
                                border: `1px solid ${isActive ? 'rgba(108,192,108,0.3)' : 'var(--line)'}`,
                              }}>
                                {isActive ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })()}
      </main>

      {/* ═══ MODAL: Quick create ═══════════════════════════════════════════ */}
      {editingScreening && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={(e) => { if (e.target === e.currentTarget) setEditingScreening(null); }}
        >
          <div style={{ background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 12, padding: 28, width: '100%', maxWidth: 560, maxHeight: '85vh', overflowY: 'auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.14em', margin: '0 0 4px' }}>Editar función</p>
            <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 24 }}>
              {editingScreening.title ?? 'Función sin película'}
            </div>

            <form onSubmit={handleSaveEdit}>
              {editingScreening.title !== null && (
                <>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 10px' }}>Película</p>
                  <MovieSearch onSelect={handleEditMovieSelect} placeholder="Cambiar película (TMDB)…" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                    {([
                      ['title', 'Título', 'text'],
                      ['year', 'Año', 'number'],
                      ['director', 'Director', 'text'],
                      ['genre', 'Género', 'text'],
                      ['duration', 'Duración (min)', 'number'],
                    ] as [string, string, string][]).map(([field, label, type]) => (
                      <div key={field}>
                        <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</label>
                        <input
                          type={type}
                          value={(editForm[field as keyof typeof editForm] as string) ?? ''}
                          onChange={(e) => setEditForm((p) => ({ ...p, [field]: e.target.value }))}
                          style={inp}
                        />
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>Sinopsis</label>
                    <textarea
                      value={editForm.synopsis}
                      onChange={(e) => setEditForm((p) => ({ ...p, synopsis: e.target.value }))}
                      rows={3}
                      style={{ ...inp, height: 'auto', resize: 'vertical' as const }}
                    />
                  </div>
                  <div style={{ height: 1, background: 'var(--line)', margin: '20px 0' }} />
                </>
              )}

              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 10px' }}>Horario y logística</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>Fecha *</label>
                  <DatePicker value={editForm.scheduledDate} onChange={(v) => setEditForm((p) => ({ ...p, scheduledDate: v }))} style={inp} />
                </div>
                {([
                  ['hour', 'Hora', 'time'],
                  ['location', 'Lugar', 'text'],
                  ['snack', 'Snack', 'text'],
                  ['curatedBy', 'Curado por', 'text'],
                ] as [string, string, string][]).map(([field, label, type]) => (
                  <div key={field}>
                    <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</label>
                    <input
                      type={type}
                      value={(editForm[field as keyof typeof editForm] as string) ?? ''}
                      onChange={(e) => setEditForm((p) => ({ ...p, [field]: e.target.value }))}
                      style={inp}
                    />
                  </div>
                ))}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>Estado</label>
                  <select value={editForm.status} onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))} style={inp}>
                    <option value="upcoming">Próxima</option>
                    <option value="past">Pasada</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>Notas</label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}
                    rows={2}
                    style={{ ...inp, height: 'auto', resize: 'vertical' as const }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
                <button type="button" onClick={() => setEditingScreening(null)} style={btnGhost}>Cancelar</button>
                <button type="submit" style={btnPrimary}>Guardar cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {quickRec && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={(e) => { if (e.target === e.currentTarget) setQuickRec(null); }}
        >
          <div style={{ background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 12, padding: 28, width: '100%', maxWidth: 480 }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.14em', margin: '0 0 4px' }}>Programar función</p>
            <div style={{ fontWeight: 800, fontSize: 20, textTransform: 'uppercase', marginBottom: 4 }}>{quickRec.title}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 24 }}>
              {[quickRec.director, quickRec.year, quickRec.duration ? `${quickRec.duration} min` : null, quickRec.genre].filter(Boolean).join(' · ')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>Fecha *</label>
                <DatePicker value={quickForm.scheduledDate} onChange={(v) => setQuickForm((p) => ({ ...p, scheduledDate: v }))} style={inp} />
              </div>
              {([['hour', 'Hora', 'time'], ['location', 'Lugar', 'text'], ['snack', 'Snack', 'text'], ['curatedBy', 'Curado por', 'text']] as [string, string, string][]).map(([field, label, type]) => (
                <div key={field}>
                  <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</label>
                  <input type={type} value={quickForm[field as keyof typeof quickForm]} onChange={(e) => setQuickForm((p) => ({ ...p, [field]: e.target.value }))} style={inp} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setQuickRec(null)} style={btnGhost}>Cancelar</button>
              <button onClick={handleQuickCreate} disabled={!quickForm.scheduledDate} style={{ ...btnPrimary, opacity: quickForm.scheduledDate ? 1 : 0.5, cursor: quickForm.scheduledDate ? 'pointer' : 'not-allowed' }}>Crear función</button>
            </div>
          </div>
        </div>
      )}

      <div id="print-tickets" style={{ display: 'none' }}>
        {entrScreeningId != null && entrAttendees.map((a) => {
          const s = list.find((sc) => sc.id === entrScreeningId);
          return s ? <Ticket key={a.userId} screening={s} username={a.username} /> : null;
        })}
      </div>
    </div>
  );
}
