'use client';
import { useEffect } from 'react';
import { ACCENT_LS_KEY, ACCENT_THEMES, DEFAULT_ACCENT_ID, applyAccent } from '@/lib/themes';

// Aplica el favicon en el cliente (las CSS vars las pone el script inline del <head>).
export default function AccentProvider() {
  useEffect(() => {
    let id = DEFAULT_ACCENT_ID;
    try { id = localStorage.getItem(ACCENT_LS_KEY) ?? DEFAULT_ACCENT_ID; } catch {}
    const theme = ACCENT_THEMES.find((t) => t.id === id) ?? ACCENT_THEMES[0];
    applyAccent(theme.id);
  }, []);

  return null;
}
