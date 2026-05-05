'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (res?.ok) router.push('/admin');
    else setError('Credenciales incorrectas.');
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--bg)', border: '1px solid var(--line)',
    borderRadius: 'var(--radius-sm)', padding: '10px 14px',
    fontSize: 14, color: 'var(--ink)', outline: 'none', marginBottom: 12,
  };

  return (
    <form onSubmit={handleSubmit}>
      <label className="eyebrow" style={{ display: 'block', marginBottom: 6 }}>Email</label>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required placeholder="admin@cineterabithia.local" />
      <label className="eyebrow" style={{ display: 'block', marginBottom: 6 }}>Contraseña</label>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} required placeholder="••••••••" />
      {error && <p style={{ color: 'var(--hot)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
      <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading}>
        {loading ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  );
}
