import React from 'react';

export type GradientDef = { id: string; label: string; from: string; to: string };
export type ShapeDef = { id: string; label: string };
export type FontDef = { id: string; label: string; family: string; size: number; weight: number; style?: string };
export type IconDef = { id: string; label: string; Render: () => React.ReactElement | null };

export const GRADIENTS: GradientDef[] = [
  { id: 'brasa-borgona', label: 'Brasa',   from: '#E46217', to: '#C7426E' },
  { id: 'pino-mar',      label: 'Pino',    from: '#3A7D44', to: '#2E86AB' },
  { id: 'lima-brasa',    label: 'Lima',    from: '#D4A24C', to: '#E85D3C' },
  { id: 'violeta-azul',  label: 'Violeta', from: '#7B5EA7', to: '#3D5A80' },
  { id: 'borgona-noche', label: 'Borgoña', from: '#B8336A', to: '#5D4E6D' },
  { id: 'cobre',         label: 'Cobre',   from: '#E07A5F', to: '#8B5A3C' },
  { id: 'noche',         label: 'Noche',   from: '#3D5A80', to: '#1C2228' },
  { id: 'selva',         label: 'Selva',   from: '#5C8A4F', to: '#2E4A3E' },
];

export const SHAPES: ShapeDef[] = [
  { id: 'none',     label: 'Limpio'    },
  { id: 'diagonal', label: 'Diagonal'  },
  { id: 'circle',   label: 'Círculo'   },
  { id: 'triangle', label: 'Triángulo' },
  { id: 'halfmoon', label: 'Luna'      },
  { id: 'cross',    label: 'Cruz'      },
  { id: 'split',    label: 'Split'     },
];

export const FONTS: FontDef[] = [
  { id: 'poster',    label: 'Cartel',    family: "'Bebas Neue', sans-serif",              size: 17, weight: 400 },
  { id: 'editorial', label: 'Arthouse',  family: "'Cormorant Garamond', serif",           size: 22, weight: 600, style: 'italic' },
  { id: 'title',     label: 'Título',    family: "'Cinzel', serif",                        size: 14, weight: 700 },
];

const IC = 'rgba(255,255,255,0.92)';

export const ICONS: IconDef[] = [
  {
    id: 'reel', label: 'Rollo',
    Render: () => (
      <>
        <circle cx="20" cy="20" r="12" fill="none" stroke={IC} strokeWidth="2.5"/>
        <circle cx="20" cy="20" r="3"  fill={IC}/>
        <circle cx="20"    cy="10"    r="2.5" fill={IC}/>
        <circle cx="28.66" cy="15"    r="2.5" fill={IC}/>
        <circle cx="28.66" cy="25"    r="2.5" fill={IC}/>
        <circle cx="20"    cy="30"    r="2.5" fill={IC}/>
        <circle cx="11.34" cy="25"    r="2.5" fill={IC}/>
        <circle cx="11.34" cy="15"    r="2.5" fill={IC}/>
      </>
    ),
  },
  {
    id: 'eye', label: 'Ojo',
    Render: () => (
      <>
        <path d="M5,20 Q12.5,9 20,9 Q27.5,9 35,20 Q27.5,31 20,31 Q12.5,31 5,20 Z" fill="none" stroke={IC} strokeWidth="2.5"/>
        <circle cx="20" cy="20" r="5" fill={IC}/>
      </>
    ),
  },
  {
    id: 'frame', label: 'Marco',
    Render: () => (
      <>
        <rect x="7" y="9" width="26" height="22" rx="1.5" fill="none" stroke={IC} strokeWidth="2.5"/>
        <rect x="2"  y="13" width="5" height="4" rx="1" fill={IC}/>
        <rect x="2"  y="23" width="5" height="4" rx="1" fill={IC}/>
        <rect x="33" y="13" width="5" height="4" rx="1" fill={IC}/>
        <rect x="33" y="23" width="5" height="4" rx="1" fill={IC}/>
      </>
    ),
  },
  {
    id: 'moon', label: 'Luna',
    Render: () => (
      <path d="M20,8 C11,8 5,13 5,20 C5,27 11,32 20,32 C16,29 14,25 14,20 C14,15 16,11 20,8 Z" fill={IC}/>
    ),
  },
  {
    id: 'clap', label: 'Claqueta',
    Render: () => (
      <>
        <rect x="8" y="15" width="24" height="19" rx="1.5" fill="none" stroke={IC} strokeWidth="2.2"/>
        <path d="M8,8 L32,8 L32,14.5 L8,14.5 Z" fill={IC}/>
        <line x1="13" y1="8" x2="11" y2="14.5" stroke="rgba(0,0,0,0.5)" strokeWidth="2.2"/>
        <line x1="19" y1="8" x2="17" y2="14.5" stroke="rgba(0,0,0,0.5)" strokeWidth="2.2"/>
        <line x1="25" y1="8" x2="23" y2="14.5" stroke="rgba(0,0,0,0.5)" strokeWidth="2.2"/>
        <line x1="31" y1="8" x2="29" y2="14.5" stroke="rgba(0,0,0,0.5)" strokeWidth="2.2"/>
        <circle cx="10.5" cy="11.2" r="1.8" fill="rgba(0,0,0,0.5)"/>
      </>
    ),
  },
  {
    id: 'lens', label: 'Lente',
    Render: () => (
      <>
        <circle cx="20" cy="20" r="14" fill="none" stroke={IC} strokeWidth="2"/>
        <circle cx="20" cy="20" r="9"  fill="none" stroke={IC} strokeWidth="1.5"/>
        <circle cx="20" cy="20" r="4.5" fill="none" stroke={IC} strokeWidth="1.5"/>
        <circle cx="20" cy="20" r="1.5" fill={IC}/>
        <rect x="18.5" y="5"    width="3" height="2" rx="0.5" fill={IC}/>
        <rect x="18.5" y="33"   width="3" height="2" rx="0.5" fill={IC}/>
        <rect x="5"    y="18.5" width="2" height="3" rx="0.5" fill={IC}/>
        <rect x="33"   y="18.5" width="2" height="3" rx="0.5" fill={IC}/>
      </>
    ),
  },
  {
    id: 'strip', label: 'Tira',
    Render: () => (
      <>
        <rect x="10" y="3" width="20" height="34" rx="1.2" fill="none" stroke={IC} strokeWidth="2"/>
        <rect x="11" y="8"    width="4" height="3.5" rx="0.7" fill={IC}/>
        <rect x="11" y="18.5" width="4" height="3.5" rx="0.7" fill={IC}/>
        <rect x="11" y="29"   width="4" height="3.5" rx="0.7" fill={IC}/>
        <rect x="25" y="8"    width="4" height="3.5" rx="0.7" fill={IC}/>
        <rect x="25" y="18.5" width="4" height="3.5" rx="0.7" fill={IC}/>
        <rect x="25" y="29"   width="4" height="3.5" rx="0.7" fill={IC}/>
        <line x1="10" y1="15.5" x2="30" y2="15.5" stroke={IC} strokeOpacity="0.4" strokeWidth="1"/>
        <line x1="10" y1="25"   x2="30" y2="25"   stroke={IC} strokeOpacity="0.4" strokeWidth="1"/>
      </>
    ),
  },
  {
    id: 'spotlight', label: 'Foco',
    Render: () => (
      <>
        <circle cx="20" cy="7" r="4" fill={IC}/>
        <path d="M16.5,11 L5,37 L35,37 Z" fill={IC} fillOpacity="0.22"/>
        <line x1="16.5" y1="11" x2="5"  y2="37" stroke={IC} strokeWidth="1.8"/>
        <line x1="23.5" y1="11" x2="35" y2="37" stroke={IC} strokeWidth="1.8"/>
        <line x1="9.5"  y1="27" x2="30.5" y2="27" stroke={IC} strokeOpacity="0.4" strokeWidth="1.2"/>
      </>
    ),
  },
];

export const GRAD_PREFIX = 'grad:';

export type ParsedGradAvatar = {
  gradientId: string;
  shapeId: string;
  contentStr: string;
};

export function parseGradAvatar(avatarId: string): ParsedGradAvatar | null {
  if (!avatarId.startsWith(GRAD_PREFIX)) return null;
  const [, gradientId, shapeId = 'none', contentStr = 'init-poster'] = avatarId.split(':');
  if (!gradientId) return null;
  return { gradientId, shapeId, contentStr };
}

export function buildGradAvatar(gradientId: string, shapeId: string, contentStr = 'init-poster'): string {
  return `${GRAD_PREFIX}${gradientId}:${shapeId}:${contentStr}`;
}

export function GradShape({ shapeId }: { shapeId: string }): React.ReactElement | null {
  switch (shapeId) {
    case 'diagonal': return <polygon points="28,0 40,0 40,12 12,40 0,40 0,28" fill="rgba(255,255,255,0.13)"/>;
    case 'circle':   return <circle cx="34" cy="6" r="20" fill="rgba(255,255,255,0.12)"/>;
    case 'triangle': return <polygon points="40,0 0,0 40,40" fill="rgba(255,255,255,0.13)"/>;
    case 'halfmoon': return <circle cx="40" cy="0" r="28" fill="rgba(255,255,255,0.12)"/>;
    case 'cross':
      return (
        <>
          <rect x="16" y="0" width="8" height="40" fill="rgba(255,255,255,0.10)"/>
          <rect x="0" y="16" width="40" height="8" fill="rgba(255,255,255,0.10)"/>
        </>
      );
    case 'split': return <rect x="0" y="0" width="40" height="20" fill="rgba(0,0,0,0.18)"/>;
    default:       return null;
  }
}
