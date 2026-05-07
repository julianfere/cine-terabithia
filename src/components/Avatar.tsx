'use client';
import { AVATARS } from '@/lib/avatars';
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
