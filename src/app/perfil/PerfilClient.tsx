'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/Avatar';
import { GRADIENTS, SHAPES, FONTS, ICONS, GradShape, buildGradAvatar, parseGradAvatar } from '@/lib/gradientAvatars';
import { invalidateProfiles } from '@/lib/useProfiles';
import { PushNotificationsToggle } from '@/components/PushNotificationsToggle';
import { Toast } from '@/components/Toast';
import { ACCENT_THEMES, ACCENT_LS_KEY, DEFAULT_ACCENT_ID, applyAccent } from '@/lib/themes';

export default function PerfilClient({
  username,
  initialDisplayName,
  initialAvatar,
  stats,
}: {
  username: string;
  initialDisplayName: string | null;
  initialAvatar: string | null;
  stats: { ticketCount: number; suggestions: number; avgScore: number | null };
}) {
  const [displayName, setDisplayName] = useState(initialDisplayName ?? '');
  const [avatar, setAvatar] = useState<string | null>(initialAvatar);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [accentId, setAccentId] = useState(DEFAULT_ACCENT_ID);
  const router = useRouter();

  useEffect(() => {
    try { setAccentId(localStorage.getItem(ACCENT_LS_KEY) ?? DEFAULT_ACCENT_ID); } catch {}
  }, []);

  const initialParsed = initialAvatar ? parseGradAvatar(initialAvatar) : null;
  const initContent = initialParsed?.contentStr ?? 'init-sans';
  const [mode, setMode] = useState<'grad' | 'initials'>(
    initialAvatar?.startsWith('grad:') ? 'grad' : 'initials'
  );
  const [selectedGradId, setSelectedGradId]   = useState(initialParsed?.gradientId ?? GRADIENTS[0].id);
  const [selectedShapeId, setSelectedShapeId] = useState(initialParsed?.shapeId ?? 'none');
  const [contentType, setContentType] = useState<'initials' | 'icon'>(
    initContent.startsWith('icon-') ? 'icon' : 'initials'
  );
  const [fontId, setFontId]   = useState(initContent.startsWith('init-') ? initContent.slice(5) : 'poster');
  const [iconId, setIconId]   = useState(initContent.startsWith('icon-') ? initContent.slice(5) : 'reel');

  const selectedGrad = GRADIENTS.find((g) => g.id === selectedGradId) ?? GRADIENTS[0];

  function currentContentStr() {
    return contentType === 'icon' ? `icon-${iconId}` : `init-${fontId}`;
  }

  function selectMode(m: 'grad' | 'initials') {
    setMode(m);
    setSaved(false);
    setAvatar(m === 'initials' ? null : buildGradAvatar(selectedGradId, selectedShapeId, currentContentStr()));
  }

  function selectGrad(gradId: string) {
    setSelectedGradId(gradId);
    setSaved(false);
    if (mode === 'grad') setAvatar(buildGradAvatar(gradId, selectedShapeId, currentContentStr()));
  }

  function selectShape(shapeId: string) {
    setSelectedShapeId(shapeId);
    setSaved(false);
    if (mode === 'grad') setAvatar(buildGradAvatar(selectedGradId, shapeId, currentContentStr()));
  }

  function selectContentType(ct: 'initials' | 'icon') {
    setContentType(ct);
    setSaved(false);
    const cs = ct === 'icon' ? `icon-${iconId}` : `init-${fontId}`;
    if (mode === 'grad') setAvatar(buildGradAvatar(selectedGradId, selectedShapeId, cs));
  }

  function selectFont(fid: string) {
    setFontId(fid);
    setSaved(false);
    if (mode === 'grad') setAvatar(buildGradAvatar(selectedGradId, selectedShapeId, `init-${fid}`));
  }

  function selectIcon(iid: string) {
    setIconId(iid);
    setSaved(false);
    if (mode === 'grad') setAvatar(buildGradAvatar(selectedGradId, selectedShapeId, `icon-${iid}`));
  }

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
      window.dispatchEvent(new Event('profile-updated'));
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

        {/* Modo */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {(['grad', 'initials'] as const).map((m) => (
            <button
              key={m}
              onClick={() => selectMode(m)}
              style={{
                padding: '6px 16px', borderRadius: 20, border: '1px solid',
                borderColor: mode === m ? 'var(--accent)' : 'var(--line)',
                background: mode === m ? 'var(--accent)' : 'transparent',
                color: mode === m ? 'var(--bg)' : 'var(--ink-soft)',
                fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {m === 'grad' ? 'Gradiente' : 'Iniciales'}
            </button>
          ))}
        </div>

        {mode === 'grad' && (
          <>
            {/* Gradiente */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                Gradiente
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {GRADIENTS.map((g) => (
                  <button
                    key={g.id}
                    title={g.label}
                    onClick={() => selectGrad(g.id)}
                    style={{
                      width: 40, height: 40, borderRadius: '50%', border: 'none',
                      cursor: 'pointer', padding: 0, flexShrink: 0,
                      background: `linear-gradient(135deg, ${g.from}, ${g.to})`,
                      boxShadow: selectedGradId === g.id
                        ? '0 0 0 3px var(--bg), 0 0 0 5px var(--accent)'
                        : '0 0 0 3px transparent',
                      transition: 'box-shadow 0.15s',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Forma */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                Forma
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {SHAPES.map((s) => (
                  <button
                    key={s.id}
                    title={s.label}
                    onClick={() => selectShape(s.id)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                    }}
                  >
                    <span style={{
                      display: 'block', borderRadius: '50%', overflow: 'hidden',
                      boxShadow: selectedShapeId === s.id
                        ? '0 0 0 3px var(--bg), 0 0 0 5px var(--accent)'
                        : '0 0 0 3px transparent',
                      transition: 'box-shadow 0.15s',
                    }}>
                      <svg viewBox="0 0 40 40" width="36" height="36" style={{ display: 'block' }}>
                        <defs>
                          <linearGradient id={`sp_${s.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={selectedGrad.from} />
                            <stop offset="100%" stopColor={selectedGrad.to} />
                          </linearGradient>
                        </defs>
                        <rect width="40" height="40" fill={`url(#sp_${s.id})`} />
                        <GradShape shapeId={s.id} />
                      </svg>
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {s.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Contenido */}
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                Contenido
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {(['initials', 'icon'] as const).map((ct) => (
                  <button
                    key={ct}
                    onClick={() => selectContentType(ct)}
                    style={{
                      padding: '5px 14px', borderRadius: 16, border: '1px solid',
                      borderColor: contentType === ct ? 'var(--accent)' : 'var(--line)',
                      background: contentType === ct ? 'var(--accent)' : 'transparent',
                      color: contentType === ct ? 'var(--bg)' : 'var(--ink-soft)',
                      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {ct === 'initials' ? 'Inicial' : 'Ícono'}
                  </button>
                ))}
              </div>

              {contentType === 'initials' && (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {FONTS.map((f) => (
                    <button
                      key={f.id}
                      title={f.label}
                      onClick={() => selectFont(f.id)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                      }}
                    >
                      <span style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 44, height: 44, borderRadius: '50%', overflow: 'hidden',
                        boxShadow: fontId === f.id
                          ? '0 0 0 3px var(--bg), 0 0 0 5px var(--accent)'
                          : '0 0 0 3px transparent',
                        transition: 'box-shadow 0.15s',
                        background: `linear-gradient(135deg, ${selectedGrad.from}, ${selectedGrad.to})`,
                        fontFamily: f.family, fontWeight: f.weight, fontStyle: f.style ?? 'normal',
                        fontSize: 18, color: 'rgba(255,255,255,0.92)',
                      }}>
                        {previewName[0]?.toUpperCase() ?? 'A'}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {f.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {contentType === 'icon' && (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {ICONS.map((ic) => (
                    <button
                      key={ic.id}
                      title={ic.label}
                      onClick={() => selectIcon(ic.id)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                      }}
                    >
                      <span style={{
                        display: 'block', borderRadius: '50%', overflow: 'hidden',
                        boxShadow: iconId === ic.id
                          ? '0 0 0 3px var(--bg), 0 0 0 5px var(--accent)'
                          : '0 0 0 3px transparent',
                        transition: 'box-shadow 0.15s',
                      }}>
                        <svg viewBox="0 0 40 40" width="44" height="44" style={{ display: 'block' }}>
                          <defs>
                            <linearGradient id={`ic_${ic.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor={selectedGrad.from} />
                              <stop offset="100%" stopColor={selectedGrad.to} />
                            </linearGradient>
                          </defs>
                          <rect width="40" height="40" fill={`url(#ic_${ic.id})`} />
                          <GradShape shapeId={selectedShapeId} />
                          {ic.Render()}
                        </svg>
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {ic.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {mode === 'initials' && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)' }}>
            Se usa tu inicial con un color único basado en tu nombre de usuario.
          </div>
        )}
      </div>

      {/* Tema */}
      <div style={{ marginBottom: 36 }}>
        <div className="eyebrow" style={{ marginBottom: 4 }}>Color de acento</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', marginBottom: 14 }}>
          Se aplica al instante · se guarda en este dispositivo
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {ACCENT_THEMES.map((t) => (
            <button
              key={t.id}
              title={t.label}
              onClick={() => { applyAccent(t.id); setAccentId(t.id); }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              }}
            >
              <span style={{
                display: 'block',
                width: 36, height: 36, borderRadius: '50%',
                background: t.accent,
                boxShadow: accentId === t.id
                  ? `0 0 0 3px var(--bg), 0 0 0 5px ${t.accent}`
                  : '0 0 0 3px transparent',
                transition: 'box-shadow 0.15s',
              }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: accentId === t.id ? 'var(--accent)' : 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', transition: 'color 0.15s' }}>
                {t.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ marginBottom: 32 }}>
        <div className="eyebrow" style={{ marginBottom: 16 }}>Tus estadísticas</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { label: 'Funciones', value: stats.ticketCount },
            { label: 'Sugeridas', value: stats.suggestions },
            { label: 'Promedio', value: stats.avgScore != null ? `${stats.avgScore.toFixed(1)} ★` : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="card" style={{ padding: '16px 20px', textAlign: 'center' }}>
              <div className="h-display" style={{ fontSize: 32, color: 'var(--accent)', marginBottom: 4 }}>{value}</div>
              <div className="eyebrow" style={{ fontSize: 9 }}>{label}</div>
            </div>
          ))}
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
      <Toast message="✓ Cambios guardados" visible={saved} />
    </div>
  );
}
