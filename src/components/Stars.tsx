'use client';
import { useState } from 'react';

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
      <path d="M12 2.5l2.95 5.98 6.6.96-4.78 4.66 1.13 6.57L12 17.6l-5.9 3.07 1.13-6.57L2.45 9.44l6.6-.96L12 2.5z" />
    </svg>
  );
}

interface StarsProps {
  value: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  interactive?: boolean;
  onChange?: (v: number) => void;
}

export function Stars({ value, size = 'md', interactive, onChange }: StarsProps) {
  const [hover, setHover] = useState(0);
  const display = hover || value;
  const cls = size === 'lg' ? 'stars lg' : size === 'xl' ? 'stars xl' : 'stars';
  return (
    <span className={cls} style={interactive ? { cursor: 'pointer' } : {}}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          style={{ display: 'inline-flex' }}
          onMouseEnter={interactive ? () => setHover(i) : undefined}
          onMouseLeave={interactive ? () => setHover(0) : undefined}
          onClick={interactive ? () => onChange?.(i) : undefined}
        >
          <StarIcon filled={i <= Math.floor(display)} />
        </span>
      ))}
    </span>
  );
}

export function StarMini({ size = 14, color = 'var(--accent)' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ verticalAlign: 'middle', display: 'inline-block' }}>
      <path d="M12 2.5l2.95 5.98 6.6.96-4.78 4.66 1.13 6.57L12 17.6l-5.9 3.07 1.13-6.57L2.45 9.44l6.6-.96L12 2.5z" />
    </svg>
  );
}
