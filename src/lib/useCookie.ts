'use client';
import { useState, useEffect } from 'react';

export function useCookie(name: string): string | null {
  const [value, setValue] = useState<string | null>(null);
  useEffect(() => {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    setValue(match ? decodeURIComponent(match[1]) : null);
  }, [name]);
  return value;
}

export function setCookie(name: string, value: string, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}
