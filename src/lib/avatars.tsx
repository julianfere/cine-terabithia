import React from 'react';

export type AvatarDef = {
  id: string;
  label: string;
  bg: string;
  Icon: React.FC;
};

export const AVATARS: AvatarDef[] = [

  // ── CINÉFILOS ────────────────────────────────────────────────
  {
    id: 'reel', label: 'Reel', bg: '#2C1810',
    Icon: () => (
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
        <rect width="100" height="100" fill="#2C1810"/>
        <circle cx="50" cy="50" r="32" fill="none" stroke="#E46217" strokeWidth="4"/>
        <circle cx="50" cy="50" r="6" fill="#E46217"/>
        <g fill="#E46217">
          <circle cx="50" cy="28" r="5"/>
          <circle cx="72" cy="50" r="5"/>
          <circle cx="50" cy="72" r="5"/>
          <circle cx="28" cy="50" r="5"/>
        </g>
      </svg>
    ),
  },
  {
    id: 'proyector', label: 'Proyector', bg: '#1A2A3A',
    Icon: () => (
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
        <rect width="100" height="100" fill="#1A2A3A"/>
        <circle cx="38" cy="38" r="14" fill="none" stroke="#E4F277" strokeWidth="3"/>
        <circle cx="38" cy="38" r="3" fill="#E4F277"/>
        <circle cx="62" cy="38" r="9" fill="none" stroke="#E4F277" strokeWidth="3"/>
        <rect x="22" y="56" width="56" height="14" rx="3" fill="#E4F277"/>
        <path d="M 78 60 L 92 50 L 92 76 L 78 66 Z" fill="#E4F277" opacity={0.6}/>
      </svg>
    ),
  },
  {
    id: 'ticket', label: 'Ticket', bg: '#E46217',
    Icon: () => (
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
        <rect width="100" height="100" fill="#E46217"/>
        <path d="M 16 32 H 84 V 48 a6 6 0 0 0 0 12 V 76 H 16 V 60 a6 6 0 0 0 0 -12 Z" fill="#14181C"/>
        <line x1="56" y1="36" x2="56" y2="72" stroke="#E46217" strokeWidth="1.5" strokeDasharray="2.5 2.5"/>
        <text x="36" y="60" textAnchor="middle" fontFamily="DM Mono" fontWeight="500" fontSize="11" fill="#E46217">CT</text>
        <text x="71" y="60" textAnchor="middle" fontFamily="DM Mono" fontWeight="500" fontSize="9" fill="#E46217">21</text>
      </svg>
    ),
  },
  {
    id: 'butaca', label: 'Butaca', bg: '#3D1F2E',
    Icon: () => (
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
        <rect width="100" height="100" fill="#3D1F2E"/>
        <rect x="22" y="24" width="56" height="44" rx="10" fill="#E4F277"/>
        <rect x="30" y="68" width="40" height="14" rx="2" fill="#E4F277"/>
        <rect x="22" y="78" width="8" height="12" fill="#E4F277"/>
        <rect x="70" y="78" width="8" height="12" fill="#E4F277"/>
      </svg>
    ),
  },
  {
    id: 'claqueta', label: 'Claqueta', bg: '#0F1F1A',
    Icon: () => (
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
        <rect width="100" height="100" fill="#0F1F1A"/>
        <rect x="14" y="40" width="72" height="46" rx="3" fill="#E4F277"/>
        <g transform="translate(14 22)">
          <rect width="72" height="18" rx="2" fill="#14181C"/>
          <polygon points="2,16 14,2 28,16 22,16 14,8 6,16" fill="#E4F277"/>
          <polygon points="28,16 40,2 54,16 48,16 40,8 34,16" fill="#E4F277"/>
          <polygon points="54,16 66,2 70,8 70,16 64,16 60,12" fill="#E4F277"/>
        </g>
      </svg>
    ),
  },
  {
    id: 'pochoclo', label: 'Pochoclo', bg: '#7A1F2A',
    Icon: () => (
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
        <rect width="100" height="100" fill="#7A1F2A"/>
        <path d="M 28 38 L 72 38 L 76 84 Q 50 90 24 84 Z" fill="#E4F277"/>
        <g stroke="#7A1F2A" strokeWidth="1.5">
          <line x1="36" y1="44" x2="36" y2="80"/>
          <line x1="50" y1="44" x2="50" y2="82"/>
          <line x1="64" y1="44" x2="64" y2="80"/>
        </g>
        <g fill="#FFF8E0">
          <circle cx="32" cy="32" r="6"/>
          <circle cx="44" cy="26" r="7"/>
          <circle cx="56" cy="28" r="6"/>
          <circle cx="68" cy="32" r="6"/>
          <circle cx="50" cy="36" r="5"/>
        </g>
      </svg>
    ),
  },
  {
    id: 'vhs', label: 'VHS', bg: '#252A30',
    Icon: () => (
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
        <rect width="100" height="100" fill="#252A30"/>
        <rect x="14" y="28" width="72" height="44" rx="3" fill="#E4F277"/>
        <circle cx="34" cy="50" r="9" fill="#14181C"/>
        <circle cx="66" cy="50" r="9" fill="#14181C"/>
        <circle cx="34" cy="50" r="3" fill="#E4F277"/>
        <circle cx="66" cy="50" r="3" fill="#E4F277"/>
        <rect x="20" y="74" width="60" height="6" rx="1" fill="#14181C"/>
      </svg>
    ),
  },
  {
    id: 'estrella', label: 'Estrella', bg: '#E4F277',
    Icon: () => (
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
        <rect width="100" height="100" fill="#E4F277"/>
        <path d="M50 18 L57 42 L82 42 L62 56 L70 80 L50 66 L30 80 L38 56 L18 42 L43 42 Z" fill="#14181C"/>
      </svg>
    ),
  },

  // ── GEOMÉTRICOS ──────────────────────────────────────────────
  {
    id: 'stripes', label: 'Stripes', bg: '#E46217',
    Icon: () => (
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
        <rect width="100" height="100" fill="#E46217"/>
        <rect y="18" width="100" height="10" fill="#14181C"/>
        <rect y="36" width="100" height="10" fill="#14181C"/>
        <rect y="54" width="100" height="10" fill="#14181C"/>
        <rect y="72" width="100" height="10" fill="#14181C"/>
      </svg>
    ),
  },
  {
    id: 'eclipse', label: 'Eclipse', bg: '#1A2A3A',
    Icon: () => (
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
        <rect width="100" height="100" fill="#1A2A3A"/>
        <rect x="50" width="50" height="100" fill="#E4F277"/>
        <circle cx="50" cy="50" r="22" fill="#E46217"/>
      </svg>
    ),
  },
  {
    id: 'grid', label: 'Grid', bg: '#2C1810',
    Icon: () => (
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
        <rect width="100" height="100" fill="#2C1810"/>
        <g fill="#E4F277">
          <rect x="14" y="14" width="22" height="22"/>
          <rect x="64" y="14" width="22" height="22"/>
          <rect x="14" y="64" width="22" height="22"/>
          <rect x="64" y="64" width="22" height="22"/>
        </g>
        <rect x="39" y="39" width="22" height="22" fill="#E46217"/>
      </svg>
    ),
  },
  {
    id: 'triangulo', label: 'Triángulo', bg: '#0F4A3F',
    Icon: () => (
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
        <rect width="100" height="100" fill="#0F4A3F"/>
        <polygon points="50,16 86,80 14,80" fill="#E4F277"/>
        <circle cx="50" cy="60" r="10" fill="#0F4A3F"/>
      </svg>
    ),
  },
  {
    id: 'diafragma', label: 'Diafragma', bg: '#14181C',
    Icon: () => (
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
        <rect width="100" height="100" fill="#14181C"/>
        <circle cx="50" cy="50" r="40" fill="#E46217"/>
        <circle cx="50" cy="50" r="28" fill="#14181C"/>
        <circle cx="50" cy="50" r="18" fill="#E4F277"/>
        <circle cx="50" cy="50" r="6" fill="#14181C"/>
      </svg>
    ),
  },
  {
    id: 'diagonal', label: 'Diagonal', bg: '#7A1F2A',
    Icon: () => (
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
        <rect width="100" height="100" fill="#7A1F2A"/>
        <polygon points="0,0 100,0 0,100" fill="#E4F277"/>
        <circle cx="34" cy="34" r="10" fill="#7A1F2A"/>
      </svg>
    ),
  },
  {
    id: 'bauhaus', label: 'Bauhaus', bg: '#E4F277',
    Icon: () => (
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
        <rect width="100" height="100" fill="#E4F277"/>
        <rect x="0" y="0" width="50" height="50" fill="#14181C"/>
        <rect x="50" y="50" width="50" height="50" fill="#14181C"/>
        <rect x="34" y="34" width="32" height="32" fill="#E46217"/>
      </svg>
    ),
  },
  {
    id: 'burst', label: 'Burst', bg: '#1A2A3A',
    Icon: () => (
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
        <rect width="100" height="100" fill="#1A2A3A"/>
        <g fill="#E46217">
          <polygon points="50,50 50,8 56,8"/>
          <polygon points="50,50 92,50 92,56"/>
          <polygon points="50,50 50,92 44,92"/>
          <polygon points="50,50 8,50 8,44"/>
          <polygon points="50,50 80,20 84,24"/>
          <polygon points="50,50 80,80 76,84"/>
          <polygon points="50,50 20,80 16,76"/>
          <polygon points="50,50 20,20 24,16"/>
        </g>
        <circle cx="50" cy="50" r="8" fill="#E4F277"/>
      </svg>
    ),
  },

  // ── RETRATOS ─────────────────────────────────────────────────
  {
    id: 'lentes', label: 'Lentes', bg: '#E46217',
    Icon: () => (
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
        <rect width="100" height="100" fill="#E46217"/>
        <circle cx="50" cy="56" r="34" fill="#14181C"/>
        <g fill="#E4F277">
          <circle cx="38" cy="48" r="8"/>
          <circle cx="62" cy="48" r="8"/>
        </g>
        <line x1="46" y1="48" x2="54" y2="48" stroke="#E46217" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    id: 'mostacho', label: 'Mostacho', bg: '#0F4A3F',
    Icon: () => (
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
        <rect width="100" height="100" fill="#0F4A3F"/>
        <circle cx="50" cy="54" r="32" fill="#E4F277"/>
        <g fill="#14181C">
          <circle cx="40" cy="48" r="3"/>
          <circle cx="60" cy="48" r="3"/>
        </g>
        <path d="M 36 64 Q 42 70 50 64 Q 58 70 64 64" fill="none" stroke="#14181C" strokeWidth="3" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'sombrero', label: 'Sombrero', bg: '#1A2A3A',
    Icon: () => (
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
        <rect width="100" height="100" fill="#1A2A3A"/>
        <circle cx="50" cy="62" r="28" fill="#E4F277"/>
        <path d="M 14 50 H 86 L 78 30 H 22 Z" fill="#14181C"/>
        <rect x="22" y="44" width="56" height="6" fill="#E46217"/>
      </svg>
    ),
  },
  {
    id: 'rodete', label: 'Rodete', bg: '#7A1F2A',
    Icon: () => (
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
        <rect width="100" height="100" fill="#7A1F2A"/>
        <circle cx="50" cy="32" r="10" fill="#14181C"/>
        <circle cx="50" cy="58" r="28" fill="#E4F277"/>
        <g fill="#14181C">
          <circle cx="40" cy="54" r="2.5"/>
          <circle cx="60" cy="54" r="2.5"/>
        </g>
        <path d="M 44 68 Q 50 72 56 68" fill="none" stroke="#14181C" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'oso', label: 'Oso', bg: '#2C1810',
    Icon: () => (
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
        <rect width="100" height="100" fill="#2C1810"/>
        <circle cx="28" cy="38" r="10" fill="#E4F277"/>
        <circle cx="72" cy="38" r="10" fill="#E4F277"/>
        <circle cx="50" cy="56" r="30" fill="#E4F277"/>
        <g fill="#14181C">
          <circle cx="40" cy="52" r="3"/>
          <circle cx="60" cy="52" r="3"/>
          <ellipse cx="50" cy="64" rx="4" ry="3"/>
        </g>
      </svg>
    ),
  },
  {
    id: 'visera', label: 'Visera', bg: '#252A30',
    Icon: () => (
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
        <rect width="100" height="100" fill="#252A30"/>
        <circle cx="50" cy="60" r="28" fill="#E46217"/>
        <path d="M 22 46 Q 50 22 78 46 L 80 52 L 90 52 L 90 58 L 18 58 L 18 52 L 22 46 Z" fill="#14181C"/>
        <g fill="#14181C">
          <circle cx="42" cy="60" r="2.5"/>
          <circle cx="58" cy="60" r="2.5"/>
        </g>
      </svg>
    ),
  },
  {
    id: 'auriculares', label: 'Auriculares', bg: '#3D1F2E',
    Icon: () => (
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
        <rect width="100" height="100" fill="#3D1F2E"/>
        <circle cx="50" cy="56" r="28" fill="#E4F277"/>
        <path d="M 16 52 Q 16 22 50 22 Q 84 22 84 52" fill="none" stroke="#14181C" strokeWidth="5"/>
        <rect x="10" y="46" width="14" height="20" rx="3" fill="#E46217"/>
        <rect x="76" y="46" width="14" height="20" rx="3" fill="#E46217"/>
        <g fill="#14181C">
          <circle cx="40" cy="56" r="2.5"/>
          <circle cx="60" cy="56" r="2.5"/>
        </g>
      </svg>
    ),
  },
  {
    id: 'melena', label: 'Melena', bg: '#14181C',
    Icon: () => (
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
        <rect width="100" height="100" fill="#14181C"/>
        <path d="M 14 88 L 14 50 Q 14 24 50 24 Q 86 24 86 50 L 86 88 Z" fill="#E46217"/>
        <ellipse cx="50" cy="58" rx="22" ry="26" fill="#E4F277"/>
        <g fill="#14181C">
          <circle cx="42" cy="56" r="2.5"/>
          <circle cx="58" cy="56" r="2.5"/>
        </g>
        <path d="M 44 68 Q 50 72 56 68" fill="none" stroke="#14181C" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },

  // ── MONOGRAMAS ───────────────────────────────────────────────
  {
    id: 'mono-a', label: 'A · Brasa', bg: '#E46217',
    Icon: () => (
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
        <rect width="100" height="100" fill="#E46217"/>
        <text x="50" y="74" textAnchor="middle" fontFamily="Instrument Serif" fontStyle="italic" fontWeight="400" fontSize="80" fill="#14181C">A</text>
      </svg>
    ),
  },
  {
    id: 'mono-m', label: 'M · Lima', bg: '#14181C',
    Icon: () => (
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
        <rect width="100" height="100" fill="#14181C"/>
        <text x="50" y="74" textAnchor="middle" fontFamily="Inter Tight" fontWeight="900" fontSize="68" fill="#E4F277" letterSpacing="-3">M</text>
      </svg>
    ),
  },
  {
    id: 'mono-s', label: 'S · Pino', bg: '#0F4A3F',
    Icon: () => (
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
        <rect width="100" height="100" fill="#0F4A3F"/>
        <text x="50" y="74" textAnchor="middle" fontFamily="Instrument Serif" fontStyle="italic" fontWeight="400" fontSize="80" fill="#E4F277">S</text>
      </svg>
    ),
  },
  {
    id: 'mono-r', label: 'R · Borgoña', bg: '#7A1F2A',
    Icon: () => (
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
        <rect width="100" height="100" fill="#7A1F2A"/>
        <text x="50" y="74" textAnchor="middle" fontFamily="Inter Tight" fontWeight="900" fontSize="68" fill="#E4F277" letterSpacing="-3">R</text>
      </svg>
    ),
  },
  {
    id: 'mono-n', label: 'N · Lima', bg: '#E4F277',
    Icon: () => (
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
        <rect width="100" height="100" fill="#E4F277"/>
        <text x="50" y="74" textAnchor="middle" fontFamily="Instrument Serif" fontStyle="italic" fontWeight="400" fontSize="80" fill="#14181C">N</text>
      </svg>
    ),
  },
  {
    id: 'mono-l', label: 'L · Slate', bg: '#252A30',
    Icon: () => (
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
        <rect width="100" height="100" fill="#252A30"/>
        <text x="50" y="74" textAnchor="middle" fontFamily="Inter Tight" fontWeight="900" fontSize="68" fill="#E46217" letterSpacing="-3">L</text>
      </svg>
    ),
  },
  {
    id: 'mono-f', label: 'F · Marino', bg: '#1A2A3A',
    Icon: () => (
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
        <rect width="100" height="100" fill="#1A2A3A"/>
        <text x="50" y="74" textAnchor="middle" fontFamily="Instrument Serif" fontStyle="italic" fontWeight="400" fontSize="80" fill="#E46217">F</text>
      </svg>
    ),
  },
  {
    id: 'mono-j', label: 'J · Cacao', bg: '#2C1810',
    Icon: () => (
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
        <rect width="100" height="100" fill="#2C1810"/>
        <text x="50" y="74" textAnchor="middle" fontFamily="Inter Tight" fontWeight="900" fontSize="68" fill="#E4F277" letterSpacing="-3">J</text>
      </svg>
    ),
  },
];
