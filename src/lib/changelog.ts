export const WHATS_NEW_VERSION = 'v2.4';
export const WHATS_NEW_LS_KEY  = 'ct.whatsNew.lastSeen';

export type Feature = {
  id:    string;   // clave estable
  date:  string;   // 'YYYY-MM-DD' — comparado con lastSeen en localStorage
  tag:   string;   // chip de categoría, ej. 'Perfil'
  title: string;
  desc:  string;
};

// Agregar entradas nuevas al principio. Fechas en ISO yyyy-mm-dd.
export const WHATS_NEW_FEATURES: Feature[] = [
  {
    id:    'themes',
    date:  '2026-05-25',
    tag:   'Perfil',
    title: 'Color de acento',
    desc:  'Elegí entre 5 paletas cinematográficas — Brasa, Carmín, Oro, Cobalto o Esmeralda. Cambia el logo, el favicon y toda la interfaz al instante.',
  },
  {
    id:    'avatars',
    date:  '2026-05-25',
    tag:   'Perfil',
    title: 'Avatares personalizados',
    desc:  'Elegí gradiente, forma, tipografía e íconos cinematográficos — claqueta, lente, tira de film y foco — para armar tu firma visual.',
  },
];
