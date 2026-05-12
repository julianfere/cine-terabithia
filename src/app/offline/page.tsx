"use client";

export default function OfflinePage() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '70vh', textAlign: 'center', padding: '0 24px',
    }}>
      <svg viewBox="0 0 100 100" style={{ width: 64, height: 64, marginBottom: 24, opacity: 0.4 }}>
        <rect width="100" height="100" rx="20" fill="#E46217"/>
        <path d="M 16 32 H 84 V 48 a6 6 0 0 0 0 12 V 76 H 16 V 60 a6 6 0 0 0 0 -12 Z" fill="#14181C"/>
        <line x1="56" y1="36" x2="56" y2="72" stroke="#E46217" strokeWidth="1.5" strokeDasharray="2.5 2.5"/>
        <text x="36" y="59" textAnchor="middle" fontFamily="DM Mono" fontWeight="500" fontSize="11" fill="#E46217" letterSpacing="1">CT</text>
        <text x="71" y="59" textAnchor="middle" fontFamily="DM Mono" fontWeight="500" fontSize="9" fill="#E46217">048</text>
      </svg>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)', letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 12px' }}>
        Sin conexión
      </p>
      <h1 style={{ fontFamily: 'var(--font-sans)', fontWeight: 900, fontSize: 'clamp(28px, 5vw, 48px)', letterSpacing: '-0.03em', lineHeight: 1, margin: '0 0 16px', textTransform: 'uppercase' }}>
        No hay<br /><em style={{ color: 'var(--accent)', fontStyle: 'normal' }}>internet</em>
      </h1>
      <p style={{ color: 'var(--ink-mute)', fontSize: 15, maxWidth: 320, margin: '0 0 32px', lineHeight: 1.5 }}>
        Revisá tu conexión y volvé a intentarlo.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="btn btn-primary"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        Reintentar
      </button>
    </div>
  );
}
