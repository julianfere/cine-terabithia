'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import { Avatar } from './Avatar';
import PwaInstallButton from './PwaInstallButton';
import WhatsNewModal from './WhatsNewModal';
import { WHATS_NEW_FEATURES } from '@/lib/changelog';

type UserSession = { name?: string | null; role?: string };
type MyProfile = { displayName: string | null; avatar: string | null } | null;
type Stats = { ticketCount: number; suggestionsCount: number; avgScore: number } | null;

const links = [
  ['/', 'Próxima'],
  ['/calendario', 'Calendario'],
  ['/watchlist', 'Sugeridos'],
  ['/votacion', 'Votación'],
  ['/ranking', 'Ranking'],
  ['/trivia', 'Trivia'],
] as const;

function IconTicket() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{ width: 18, height: 18, flexShrink: 0, color: 'var(--ink-mute)' }}>
      <path d="M3 8a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 100-4V8z" />
      <path d="M13 6v12" strokeDasharray="2 2" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{ width: 18, height: 18, flexShrink: 0, color: 'var(--ink-mute)' }}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0116 0" />
    </svg>
  );
}

function IconPalette() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{ width: 18, height: 18, flexShrink: 0, color: 'var(--ink-mute)' }}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="8" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="8" r="1" fill="currentColor" />
      <circle cx="16" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="16" r="1" fill="currentColor" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{ width: 18, height: 18, flexShrink: 0, color: 'currentColor' }}>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{ width: 18, height: 18, flexShrink: 0, color: 'var(--ink-mute)' }}>
      <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

function IconChangelog() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{ width: 18, height: 18, flexShrink: 0, color: 'var(--ink-mute)' }}>
      <path d="M12 2a10 10 0 100 20A10 10 0 0012 2z" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function IconFeedback() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{ width: 18, height: 18, flexShrink: 0, color: 'var(--ink-mute)' }}>
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  );
}

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 12, height: 12, color: 'var(--ink-mute)', transition: 'transform 0.18s', transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export default function TopBar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as UserSession | undefined;
  const username = user?.name ?? null;
  const isAdmin = user?.role === 'admin';

  const [profile, setProfile] = useState<MyProfile>(null);
  const [stats, setStats] = useState<Stats>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!username) { setProfile(null); setStats(null); return; }
    const fetchProfile = () =>
      fetch('/api/users/me').then((r) => r.ok ? r.json() : null).then((data) => setProfile(data ?? null));
    fetchProfile();
    window.addEventListener('profile-updated', fetchProfile);
    return () => window.removeEventListener('profile-updated', fetchProfile);
  }, [username]);

  useEffect(() => {
    if (!username) { setStats(null); return; }
    fetch('/api/users/me/stats').then((r) => r.ok ? r.json() : null).then((data) => setStats(data ?? null));
  }, [username]);

  const displayName = profile?.displayName ?? username ?? '';
  const avatarId = profile?.avatar ?? null;

  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);

  const openMenu = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMenuOpen(true);
  };
  const closeMenu = () => {
    timerRef.current = setTimeout(() => setMenuOpen(false), 180);
  };

  return (
    <>
    <header className="topbar">
      <div className="topbar-inner">
        <Link href="/" className="logo">
          <svg viewBox="0 0 100 100" style={{ width: 36, height: 36, flexShrink: 0, color: 'var(--accent)' }}>
            <rect width="100" height="100" rx="20" fill="currentColor"/>
            <path d="M 16 32 H 84 V 48 a6 6 0 0 0 0 12 V 76 H 16 V 60 a6 6 0 0 0 0 -12 Z" fill="#14181C"/>
            <line x1="56" y1="36" x2="56" y2="72" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2.5 2.5"/>
            <text x="36" y="59" textAnchor="middle" fontFamily="DM Mono" fontWeight="500" fontSize="11" fill="currentColor" letterSpacing="1">CT</text>
            <text x="71" y="59" textAnchor="middle" fontFamily="DM Mono" fontWeight="500" fontSize="9" fill="currentColor">048</text>
          </svg>
          <div className="logo-text">
            Cine Terabithia
            <small>club · est. 2026</small>
          </div>
        </Link>

        <nav
          className="nav"
          style={{
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {links.map(([href, label]) => (
            <Link key={href} href={href} className={`nav-btn${isActive(href) ? ' active' : ''}`} style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
              {label}
            </Link>
          ))}
        </nav>

        <div className="topbar-right">
          <PwaInstallButton />
          {isAdmin && (
            <Link
              href="/admin"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: isActive('/admin') ? 'var(--accent)' : 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '4px 8px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', textDecoration: 'none', transition: 'color 0.15s, border-color 0.15s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--accent)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = isActive('/admin') ? 'var(--accent)' : 'var(--ink-mute)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)'; }}
            >
              Admin
            </Link>
          )}

          {username ? (
            <div
              className={`profile-wrap${menuOpen ? ' open' : ''}`}
              onMouseEnter={openMenu}
              onMouseLeave={closeMenu}
            >
              <button className="profile-trigger" onClick={() => setMenuOpen((v) => !v)}>
                <Avatar name={displayName} avatarId={avatarId} size="md" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1, whiteSpace: 'nowrap', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--ink-soft)' }}>{displayName}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.06em', marginTop: 2 }}>@{username}</div>
                </div>
                <IconChevron open={menuOpen} />
              </button>

              <div className="profile-dropdown">
                {/* Header */}
                <div style={{ padding: '12px 12px 14px', borderBottom: '1px solid var(--line)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar name={displayName} avatarId={avatarId} size="lg" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{displayName}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)', marginTop: 2 }}>@{username}</div>
                  </div>
                </div>

                {/* Stats */}
                {stats && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px', background: 'var(--line)', borderRadius: 8, overflow: 'hidden', margin: '6px 4px 8px' }}>
                    {[
                      { v: stats.ticketCount, l: 'Tickets', accent: true },
                      { v: stats.suggestionsCount, l: 'Sugeridas', accent: false },
                      { v: stats.avgScore > 0 ? stats.avgScore : '—', l: 'Promedio', accent: false },
                    ].map((s) => (
                      <div key={s.l} style={{ background: 'var(--bg-card)', padding: '10px 8px', textAlign: 'center' }}>
                        <div style={{ fontWeight: 800, fontSize: 18, lineHeight: 1, color: s.accent ? 'var(--accent)' : 'var(--ink)' }}>{s.v}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-mute)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Menu items */}
                <Link href="/tickets" className="pm-item" onClick={() => setMenuOpen(false)}>
                  <IconTicket />
                  <span style={{ flex: 1 }}>Mis tickets</span>
                  {stats && stats.ticketCount > 0 && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, padding: '2px 7px', borderRadius: 999, background: 'var(--accent)', color: 'var(--bg)', letterSpacing: '0.06em' }}>
                      {stats.ticketCount}
                    </span>
                  )}
                </Link>
                <Link href="/perfil" className="pm-item" onClick={() => setMenuOpen(false)}>
                  <IconUser />
                  <span>Mi perfil</span>
                </Link>
                <button className="pm-item" onClick={() => { setMenuOpen(false); setWhatsNewOpen(true); }}>
                  <IconChangelog />
                  <span>Novedades</span>
                </button>
                <a
                  href="https://forms.gle/x4mdAT8WkppHaL7m9"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pm-item"
                  onClick={() => setMenuOpen(false)}
                >
                  <IconFeedback />
                  <span>Sugerir / reportar</span>
                </a>

                <div className="pm-divider" />

                <button className="pm-item danger" onClick={() => { setMenuOpen(false); signOut({ callbackUrl: '/login' }); }}>
                  <IconLogout />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>

    {whatsNewOpen && (
      <WhatsNewModal
        features={WHATS_NEW_FEATURES}
        lastSeen={null}
        onClose={() => setWhatsNewOpen(false)}
      />
    )}
  </>
  );
}
