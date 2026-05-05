'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const callbackUrl = params.get('callbackUrl') ?? '/';
    const result = await signIn('credentials', { username, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError('Usuario o contraseña incorrectos.');
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ marginBottom: 28, textAlign: 'center' }}>
        <div className="logo-mark" style={{ margin: '0 auto 12px', width: 36, height: 36 }} />
        <div style={{ fontWeight: 800, fontSize: 18, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Cine Terabithia</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>Acceso al club</div>
      </div>

      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 380, background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)', padding: 32 }}>
        <div className="eyebrow" style={{ marginBottom: 6 }}>Identificate</div>
        <h2 style={{ margin: '0 0 28px', fontWeight: 800, fontSize: 26 }}>Iniciar sesión</h2>

        <div style={{ marginBottom: 16 }}>
          <label className="eyebrow" style={{ display: 'block', marginBottom: 6 }}>Usuario</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Tu apodo"
            required
            autoFocus
            style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontSize: 14, color: 'var(--ink)', outline: 'none' }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label className="eyebrow" style={{ display: 'block', marginBottom: 6 }}>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontSize: 14, color: 'var(--ink)', outline: 'none' }}
          />
        </div>

        {error && (
          <div style={{ marginBottom: 16, padding: '10px 12px', background: 'rgba(255,90,95,0.12)', border: '1px solid var(--hot)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--hot)' }}>
            {error}
          </div>
        )}

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', display: 'flex' }}>
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
