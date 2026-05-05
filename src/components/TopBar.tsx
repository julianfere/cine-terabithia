'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Avatar } from './Avatar';

type UserSession = { name?: string | null; role?: string };
type MyProfile = { displayName: string | null; avatar: string | null } | null;

const links = [
  ['/', 'Próxima'],
  ['/calendario', 'Calendario'],
  ['/watchlist', 'Sugeridos'],
  ['/votacion', 'Votación'],
  ['/ranking', 'Ranking'],
] as const;

export default function TopBar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as UserSession | undefined;
  const username = user?.name ?? null;
  const isAdmin = user?.role === 'admin';

  const [profile, setProfile] = useState<MyProfile>(null);

  useEffect(() => {
    if (!username) { setProfile(null); return; }
    fetch('/api/users/me')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setProfile(data ?? null));
  }, [username]);

  const displayName = profile?.displayName ?? username ?? '';
  const avatarId = profile?.avatar ?? null;

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link href="/" className="logo">
          <svg viewBox="0 0 100 100" style={{ width: 36, height: 36, flexShrink: 0 }}>
            <rect width="100" height="100" rx="20" fill="#E46217"/>
            <path d="M 16 32 H 84 V 48 a6 6 0 0 0 0 12 V 76 H 16 V 60 a6 6 0 0 0 0 -12 Z" fill="#14181C"/>
            <line x1="56" y1="36" x2="56" y2="72" stroke="#E46217" strokeWidth="1.5" strokeDasharray="2.5 2.5"/>
            <text x="36" y="59" textAnchor="middle" fontFamily="DM Mono" fontWeight="500" fontSize="11" fill="#E46217" letterSpacing="1">CT</text>
            <text x="71" y="59" textAnchor="middle" fontFamily="DM Mono" fontWeight="500" fontSize="9" fill="#E46217">048</text>
          </svg>
          <div className="logo-text">
            Cine Terabithia
            <small>club · est. 2026</small>
          </div>
        </Link>

        <nav className="nav">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className={`nav-btn${isActive(href) ? ' active' : ''}`}>
              {label}
            </Link>
          ))}
        </nav>

        <div className="topbar-right">
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
          {username && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Link
                href="/perfil"
                style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'inherit', opacity: isActive('/perfil') ? 1 : 0.85, transition: 'opacity 0.15s' }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = isActive('/perfil') ? '1' : '0.85')}
                title="Editar perfil"
              >
                <Avatar name={displayName} avatarId={avatarId} size="md" />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-soft)', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {displayName}
                </span>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 0' }}
              >
                Salir
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
