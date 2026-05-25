'use client';
import { AVATARS } from '@/lib/avatars';
import { GRADIENTS, FONTS, ICONS, GradShape, parseGradAvatar } from '@/lib/gradientAvatars';
import type { ProfilesMap } from '@/lib/profiles';
import { resolveUser } from '@/lib/profiles';

const COLORS = [
  '#E85D3C','#3A7D44','#D4A24C','#7B5EA7','#C7426E',
  '#2E86AB','#E07A5F','#3D5A80','#B8336A','#8B5A3C',
  '#5C8A4F','#9C6644','#D08C60','#4A7C7E','#A23E48',
  '#6A8E7F','#CC7B5F','#5D4E6D','#D9586D','#7A9E7E',
];

function colorForUsername(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  return COLORS[Math.abs(hash) % COLORS.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

interface AvatarProps {
  name: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  title?: string;
  avatarId?: string | null;
}

export function Avatar({ name, color, size = 'md', title, avatarId }: AvatarProps) {
  const cls = size === 'sm' ? 'avatar sm' : size === 'lg' ? 'avatar lg' : size === 'xl' ? 'avatar xl' : 'avatar';
  const tooltip = title || name;

  if (avatarId?.startsWith('grad:')) {
    const parsed = parseGradAvatar(avatarId);
    const gradient = parsed ? GRADIENTS.find((g) => g.id === parsed.gradientId) : null;
    if (gradient && parsed) {
      const gid = `ga_${gradient.id.replace(/-/g, '_')}`;
      const contentStr = parsed.contentStr;
      const isIcon = contentStr.startsWith('icon-');
      const gradientDefs = (
        <defs>
          <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradient.from} />
            <stop offset="100%" stopColor={gradient.to} />
          </linearGradient>
        </defs>
      );

      if (isIcon) {
        const iconId = contentStr.slice(5);
        const iconDef = ICONS.find((i) => i.id === iconId);
        return (
          <span className={cls} style={{ overflow: 'hidden', padding: 0, lineHeight: 0 }} title={tooltip}>
            <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', display: 'block' }} aria-hidden>
              {gradientDefs}
              <rect width="40" height="40" fill={`url(#${gid})`} />
              <GradShape shapeId={parsed.shapeId} />
              {iconDef && iconDef.Render()}
            </svg>
          </span>
        );
      }

      const fontId = contentStr.split('-')[1] ?? 'sans';
      const fontDef = FONTS.find((f) => f.id === fontId) ?? FONTS[0];
      return (
        <span className={cls} style={{ overflow: 'hidden', position: 'relative' }} title={tooltip}>
          <svg
            viewBox="0 0 40 40"
            xmlns="http://www.w3.org/2000/svg"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
            aria-hidden
          >
            {gradientDefs}
            <rect width="40" height="40" fill={`url(#${gid})`} />
            <GradShape shapeId={parsed.shapeId} />
          </svg>
          <span style={{ position: 'relative', zIndex: 1, color: 'rgba(255,255,255,0.92)', fontFamily: fontDef.family, fontWeight: fontDef.weight, fontStyle: fontDef.style ?? 'normal' }}>
            {initials(name)}
          </span>
        </span>
      );
    }
  }

  if (avatarId) {
    const def = AVATARS.find((a) => a.id === avatarId);
    if (def) {
      const { Icon } = def;
      return (
        <span className={cls} style={{ background: def.bg, overflow: 'hidden', padding: 0, lineHeight: 0 }} title={tooltip}>
          <Icon />
        </span>
      );
    }
  }

  const bg = color || colorForUsername(name);
  return (
    <span className={cls} style={{ background: bg }} title={tooltip}>
      {initials(name)}
    </span>
  );
}

interface AvatarStackProps {
  names: string[];
  max?: number;
  size?: 'sm' | 'md';
  profiles?: ProfilesMap;
}

export function AvatarStack({ names, max = 6, size = 'md', profiles }: AvatarStackProps) {
  const shown = names.slice(0, max);
  const rest = names.length - max;
  return (
    <span className="avatar-stack">
      {shown.map((username) => {
        const resolved = profiles ? resolveUser(profiles, username) : { name: username, avatarId: null };
        return <Avatar key={username} name={resolved.name} avatarId={resolved.avatarId} size={size} title={resolved.name} />;
      })}
      {rest > 0 && (
        <span className={`avatar ${size === 'sm' ? 'sm' : ''}`} style={{ background: 'var(--bg-hover)', color: 'var(--ink-soft)' }}>
          +{rest}
        </span>
      )}
    </span>
  );
}
