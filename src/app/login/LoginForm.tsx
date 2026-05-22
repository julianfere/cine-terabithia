'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

export default function LoginForm() {
  const params = useSearchParams();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username.trim() || !password) {
      setError('Completá usuario y contraseña.');
      setLoading(false);
      return;
    }

    if (mode === 'register') {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoading(false);
        setError(data.error ?? 'Error al registrarse.');
        return;
      }
    }

    const callbackUrl = params.get('callbackUrl') ?? '/';
    const result = await signIn('credentials', { username, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError('Usuario o contraseña incorrectos.');
    } else {
      window.location.href = callbackUrl;
    }
  };

  const switchMode = (m: 'login' | 'register') => {
    setMode(m);
    setError('');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>

      {/* Logo */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <svg viewBox="0 0 100 100" style={{ width: 52, height: 52, margin: '0 auto 12px', display: 'block' }}>
          <rect width="100" height="100" rx="20" fill="#E46217"/>
          <path d="M 16 32 H 84 V 48 a6 6 0 0 0 0 12 V 76 H 16 V 60 a6 6 0 0 0 0 -12 Z" fill="#14181C"/>
          <line x1="56" y1="36" x2="56" y2="72" stroke="#E46217" strokeWidth="1.5" strokeDasharray="2.5 2.5"/>
          <text x="36" y="59" textAnchor="middle" fontFamily="DM Mono" fontWeight="500" fontSize="11" fill="#E46217" letterSpacing="1">CT</text>
          <text x="71" y="59" textAnchor="middle" fontFamily="DM Mono" fontWeight="500" fontSize="9" fill="#E46217">048</text>
        </svg>
        <div style={{ fontWeight: 800, fontSize: 17, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Cine Terabithia</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 3 }}>Acceso al club</div>
      </div>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: 360, background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--line)' }}>
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              style={{
                flex: 1,
                padding: '16px 0 14px',
                background: 'transparent',
                color: mode === m ? 'var(--ink)' : 'var(--ink-mute)',
                border: 'none',
                borderBottom: mode === m ? '2px solid var(--accent)' : '2px solid transparent',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                transition: 'color 0.15s, border-color 0.15s',
                marginBottom: -1,
              }}
            >
              {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px 24px 28px' }}>
          <div style={{ marginBottom: 14 }}>
            <label className="eyebrow" style={{ display: 'block', marginBottom: 6 }}>Usuario</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Tu apodo"
              autoFocus
              style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontSize: 14, color: 'var(--ink)', outline: 'none' }}
            />
          </div>

          <div style={{ marginBottom: 22 }}>
            <label className="eyebrow" style={{ display: 'block', marginBottom: 6 }}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontSize: 14, color: 'var(--ink)', outline: 'none' }}
            />
          </div>

          {error && (
            <div style={{ marginBottom: 16, padding: '9px 12px', background: 'rgba(255,90,95,0.1)', border: '1px solid var(--hot)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--hot)' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', display: 'flex' }}>
            {loading
              ? (mode === 'login' ? 'Entrando…' : 'Registrando…')
              : (mode === 'login' ? 'Entrar' : 'Crear cuenta')}
          </button>
        </form>
      </div>
    </div>
  );
}
