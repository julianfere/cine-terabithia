'use client';
import { useState } from 'react';
import { setCookie } from '@/lib/useCookie';

interface NicknameModalProps {
  onSet: (name: string) => void;
  onCancel: () => void;
}

export function NicknameModal({ onSet, onCancel }: NicknameModalProps) {
  const [name, setName] = useState('');

  const confirm = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCookie('ct_username', trimmed, 30);
    onSet(trimmed);
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Identificate</div>
        <h2 style={{ margin: '0 0 8px', fontWeight: 800, fontSize: 24 }}>
          ¿Cómo te <span style={{ color: 'var(--accent)' }}>llamás</span>?
        </h2>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--ink-mute)', lineHeight: 1.5 }}>
          Elegí un apodo. Se guarda en tu navegador y lo usás para comentar y puntuar.
        </p>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && confirm()}
          placeholder="Ej: Julieta, Tomi, El Nacho…"
          style={{
            width: '100%', background: 'var(--bg)', border: '1px solid var(--line)',
            borderRadius: 'var(--radius-sm)', padding: '10px 14px',
            fontSize: 16, marginBottom: 16, outline: 'none',
            color: 'var(--ink)',
          }}
        />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-primary btn-sm" onClick={confirm} disabled={!name.trim()}>
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
