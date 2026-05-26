'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { WHATS_NEW_FEATURES, WHATS_NEW_LS_KEY } from '@/lib/changelog';
import type { Feature } from '@/lib/changelog';
import WhatsNewModal from './WhatsNewModal';

function useWhatsNew(features: Feature[]) {
  const [open,     setOpen]     = useState(false);
  const [newOnes,  setNewOnes]  = useState<Feature[]>([]);
  const [lastSeen, setLastSeen] = useState<string | null>(null);

  useEffect(() => {
    let stored: string | null = null;
    try { stored = localStorage.getItem(WHATS_NEW_LS_KEY); } catch {}
    setLastSeen(stored);

    if (!stored) {
      // Primera visita: mostrar todas las novedades. El timestamp se guarda al cerrar.
      setNewOnes(features);
      setOpen(true);
      return;
    }

    const since = stored.slice(0, 10); // yyyy-mm-dd
    const news = features.filter((f) => f.date >= since);
    if (news.length > 0) {
      setNewOnes(news);
      setOpen(true);
    }
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(WHATS_NEW_LS_KEY, new Date().toISOString()); } catch {}
    setOpen(false);
  };

  return { open, newOnes, lastSeen, dismiss };
}

export default function WhatsNewGate() {
  const { status } = useSession();
  const whatsNew = useWhatsNew(WHATS_NEW_FEATURES);

  if (status !== 'authenticated' || !whatsNew.open) return null;

  return (
    <WhatsNewModal
      features={whatsNew.newOnes}
      lastSeen={whatsNew.lastSeen}
      onClose={whatsNew.dismiss}
    />
  );
}
