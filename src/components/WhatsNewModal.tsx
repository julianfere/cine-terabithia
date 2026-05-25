'use client';
import { useEffect } from 'react';
import type { Feature } from '@/lib/changelog';
import { WHATS_NEW_VERSION } from '@/lib/changelog';

const MONTHS = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d} ${MONTHS[+m - 1]} ${y}`;
}

interface Props {
  features:  Feature[];
  lastSeen:  string | null;
  onClose:   () => void;
}

export default function WhatsNewModal({ features, lastSeen, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const n = features.length;
  const sinceLabel = lastSeen
    ? `Desde tu última visita · ${fmtDate(lastSeen.slice(0, 10))}`
    : 'Bienvenidx de vuelta al club';

  return (
    <div
      className="wn-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="wn-title"
    >
      <div className="wn-modal" onClick={(e) => e.stopPropagation()}>

        <header className="wn-head">
          <div className="wn-head-text">
            <div className="wn-eyebrow">
              <span className="wn-dot" />
              <span>Cine Terabithia · {WHATS_NEW_VERSION}</span>
            </div>
            <h2 className="wn-title" id="wn-title">
              Hay <em>{n} {n === 1 ? 'novedad' : 'novedades'}</em><br />
              desde la última función
            </h2>
            <div className="wn-since">{sinceLabel}</div>
          </div>
          <button className="wn-close" onClick={onClose} aria-label="Cerrar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        <div className="wn-body">
          {features.map((f, i) => (
            <article key={f.id} className="wn-item">
              <div className="wn-index">{String(i + 1).padStart(2, '0')}</div>
              <div>
                <div className="wn-item-head">
                  <span className="wn-new">Nuevo</span>
                  <span className="wn-tag">{f.tag}</span>
                  <span className="wn-date">{fmtDate(f.date)}</span>
                </div>
                <h3 className="wn-item-title">{f.title}</h3>
                <p className="wn-item-desc">{f.desc}</p>
              </div>
            </article>
          ))}
        </div>

        <footer className="wn-foot">
          <span className="wn-foot-meta">
            {n} {n === 1 ? 'cambio' : 'cambios'} · Función única
          </span>
          <button className="btn btn-primary" onClick={onClose}>Entendido</button>
        </footer>

      </div>
    </div>
  );
}
