export const WHATS_NEW_VERSION = 'v2.8';
export const WHATS_NEW_LS_KEY  = 'ct.whatsNew.lastSeen';

export type Feature = {
  id:    string;   // clave estable
  date:  string;   // ISO 8601 — 'YYYY-MM-DD' o 'YYYY-MM-DDTHH:mm:ss' — comparado con lastSeen en localStorage
  tag:   string;   // chip de categoría, ej. 'Perfil'
  title: string;
  desc:  string;
};

// Agregar entradas nuevas al principio. Fechas en ISO (con hora opcional): 'YYYY-MM-DDTHH:mm:ss'.
export const WHATS_NEW_FEATURES: Feature[] = [
  {
    id:    'trailer-en-ingles',
    date:  '2026-06-16',
    tag:   'Funciones',
    title: 'Trailers de películas',
    desc:  'Ahora podés ver el trailer oficial de cada película directamente desde la página de la función.',
  },
  {
    id:    'recommendation-comments',
    date:  '2026-05-28',
    tag:   'Sugeridos',
    title: 'Comentarios en sugerencias',
    desc:  'Expandí cualquier película en Sugeridos para dejar un comentario, responder a alguien con @mención, y votar con upvote/downvote al estilo Reddit.',
  },
  {
    id:    'offline-mode',
    date:  '2026-05-28',
    tag:   'App',
    title: 'Modo offline',
    desc:  'La app funciona sin conexión: los pósters se guardan en caché, las confirmaciones de asistencia y votos se sincronizan automáticamente cuando volvés a conectarte.',
  },
  {
    id:    'watchlist-detail',
    date:  '2026-05-26T21:00:00',
    tag:   'Sugeridos',
    title: 'Detalle por película',
    desc:  'Tocá cualquier película en Sugeridos para ver quién la recomendó y quiénes votaron, con nombre y avatar de cada uno.',
  },
  {
    id:    'feedback-form',
    date:  '2026-05-26',
    tag:   'App',
    title: 'Sugerí o reportá desde el menú',
    desc:  'Encontrás el link al formulario de feedback en el menú de tu perfil — mandanos ideas, mejoras o bugs directo desde la app.',
  },
  {
    id:    'whats-new-button',
    date:  '2026-05-26',
    tag:   'App',
    title: 'Ver novedades cuando quieras',
    desc:  'Desde el menú de tu perfil podés abrir el historial de novedades en cualquier momento.',
  },
  {
    id:    'admin-entradas',
    date:  '2026-05-26',
    tag:   'Admin',
    title: 'Gestión de entradas',
    desc:  'Los admins pueden asignar entradas a los socios para cada función e imprimir los tickets directamente desde el panel.',
  },
  {
    id:    'pwa-install',
    date:  '2026-05-26',
    tag:   'App',
    title: 'Instalá la app desde el celular',
    desc:  'El botón para instalar la PWA ahora aparece también en mobile — agregala a tu pantalla de inicio desde cualquier dispositivo.',
  },
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
