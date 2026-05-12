'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/Avatar';
import { AVATARS } from '@/lib/avatars';
import { invalidateProfiles } from '@/lib/useProfiles';
import { PushNotificationsToggle } from '@/components/PushNotificationsToggle';

export default function PerfilClient({
  username,
  initialDisplayName,
  initialAvatar,
}: {
  username: string;
  initialDisplayName: string | null;
  initialAvatar: string | null;
}) {
  const [displayName, setDisplayName] = useState(initialDisplayName ?? '');
  const [avatar, setAvatar] = useState<string | null>(initialAvatar);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const previewName = displayName.trim() || username;

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: displayName.trim() || null, avatar }),
    });
    setSaving(false);
    if (res.ok) {
      invalidateProfiles();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      router.refresh();
    }
  };

  return (
    <div className="page-enter shell" style={{ paddingTop: 40, maxWidth: 720, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Tu cuenta</div>
        <h1 className="h-display" style={{ fontSize: 'clamp(36px, 5vw, 56px)', margin: 0, textTransform: 'uppercase' }}>
          Perfil <em>personal</em>
        </h1>
      </div>

      {/* Preview */}
      <div className="card" style={{ padding: '28px 32px', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 24, borderLeft: '3px solid var(--accent)' }}>
        <Avatar name={previewName} avatarId={avatar} size="xl" />
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
            Así te ven los demás
          </div>
          <div style={{ fontWeight: 800, fontSize: 22, lineHeight: 1.1 }}>{previewName}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)', marginTop: 4 }}>@{username}</div>
        </div>
      </div>

      {/* Display name */}
      <div style={{ marginBottom: 36 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Nombre visible</div>
        <input
          value={displayName}
          onChange={(e) => { setDisplayName(e.target.value); setSaved(false); }}
          placeholder={username}
          maxLength={32}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 'var(--radius)',
            padding: '12px 16px', fontSize: 18, color: 'var(--ink)', outline: 'none',
            fontFamily: 'var(--font-sans)', fontWeight: 600,
            transition: 'border-color 0.15s',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--line)')}
        />
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', marginTop: 6 }}>
          Si lo dejás vacío, se usa tu nombre de usuario (@{username}).
        </div>
      </div>

      {/* Avatar picker */}
      <div style={{ marginBottom: 36 }}>
        <div className="eyebrow" style={{ marginBottom: 16 }}>Elegí tu avatar</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {/* No avatar (initials) option */}
          <button
            title="Usar iniciales"
            onClick={() => { setAvatar(null); setSaved(false); }}
            style={{
              width: 40, height: 40, flexShrink: 0,
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              boxShadow: avatar === null ? '0 0 0 3px var(--accent)' : '0 0 0 3px transparent',
              borderRadius: '50%', transition: 'box-shadow 0.15s',
            }}
          >
            <Avatar name={previewName} avatarId={null} size="lg" />
          </button>
          {AVATARS.map((def) => {
            const { Icon } = def;
            const isSelected = avatar === def.id;
            return (
              <button
                key={def.id}
                title={def.label}
                onClick={() => { setAvatar(def.id); setSaved(false); }}
                style={{
                  width: 40, height: 40, flexShrink: 0,
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  boxShadow: isSelected ? '0 0 0 3px var(--accent)' : '0 0 0 3px transparent',
                  borderRadius: '50%', transition: 'box-shadow 0.15s',
                }}
              >
                <span
                  className="avatar lg"
                  style={{ background: def.bg, overflow: 'hidden', padding: 0, lineHeight: 0, display: 'inline-flex' }}
                >
                  <Icon />
                </span>
              </button>
            );
          })}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', marginTop: 8 }}>
          La primera opción usa tus iniciales con un color único.
        </div>
      </div>

      <PushNotificationsToggle />

      {/* Save button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
          style={{ minWidth: 140 }}
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
        {saved && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)', letterSpacing: '0.06em' }}>
            ✓ Guardado
          </span>
        )}
      </div>
    </div>
  );
}
