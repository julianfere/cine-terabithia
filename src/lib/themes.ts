export type AccentTheme = {
  id:      string;
  label:   string;
  accent:  string;
  accent2: string;
};

export const ACCENT_THEMES: AccentTheme[] = [
  { id: 'brasa',     label: 'Brasa',     accent: '#E46217', accent2: '#DA5D37' },
  { id: 'carmin',    label: 'Carmín',    accent: '#C43D5A', accent2: '#AF3349' },
  { id: 'oro',       label: 'Oro',       accent: '#C9952A', accent2: '#B8821E' },
  { id: 'cobalto',   label: 'Cobalto',   accent: '#4080D0', accent2: '#3370BF' },
  { id: 'esmeralda', label: 'Esmeralda', accent: '#28A86B', accent2: '#219259' },
];

export const ACCENT_LS_KEY     = 'ct.accent';
export const DEFAULT_ACCENT_ID = 'brasa';

// Script inline para <head> — aplica el accent antes de que React hidrate (sin flash).
// Mantener sincronizado con ACCENT_THEMES.
export const ACCENT_INIT_SCRIPT = `(function(){try{var k=localStorage.getItem('ct.accent');var t={brasa:['#E46217','#DA5D37'],carmin:['#C43D5A','#AF3349'],oro:['#C9952A','#B8821E'],cobalto:['#4080D0','#3370BF'],esmeralda:['#28A86B','#219259']};if(k&&t[k]){var s=document.documentElement.style;s.setProperty('--accent',t[k][0]);s.setProperty('--accent-2',t[k][1]);}}catch(e){}}())`;

function faviconSvg(accent: string): string {
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="20" fill="${accent}"/><path d="M 16 32 H 84 V 48 a6 6 0 0 0 0 12 V 76 H 16 V 60 a6 6 0 0 0 0 -12 Z" fill="#14181C"/><line x1="56" y1="36" x2="56" y2="72" stroke="${accent}" stroke-width="1.5" stroke-dasharray="2.5 2.5"/><text x="36" y="59" text-anchor="middle" font-family="DM Mono" font-weight="500" font-size="11" fill="${accent}" letter-spacing="1">CT</text><text x="71" y="59" text-anchor="middle" font-family="DM Mono" font-weight="500" font-size="9" fill="${accent}">048</text></svg>`;
}

export function applyAccent(id: string) {
  const theme = ACCENT_THEMES.find((t) => t.id === id) ?? ACCENT_THEMES[0];
  const root = document.documentElement.style;
  root.setProperty('--accent',   theme.accent);
  root.setProperty('--accent-2', theme.accent2);

  const link = document.querySelector<HTMLLinkElement>('link[rel*="icon"][type="image/svg+xml"]');
  if (link) link.href = `data:image/svg+xml,${encodeURIComponent(faviconSvg(theme.accent))}`;

  try { localStorage.setItem(ACCENT_LS_KEY, id); } catch {}
}
