import React, { useState } from 'react';
import { Cookie, Check, SlidersHorizontal } from 'lucide-react';
import { LegalTabId } from './LegalLgpdModal';

interface LgpdConsentBannerProps {
  onOpenLegal: (tab: LegalTabId) => void;
  onAcceptAll: () => Promise<void>;
  onAcceptEssentialOnly: () => void;
}

export const LgpdConsentBanner: React.FC<LgpdConsentBannerProps> = ({
  onOpenLegal,
  onAcceptAll,
  onAcceptEssentialOnly,
}) => {
  const [isAccepting, setIsAccepting] = useState(false);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await onAcceptAll();
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <aside
      aria-label="Aviso de Cookies, Privacidade e Termos de Uso LGPD"
      className="fixed bottom-3 left-3 right-3 z-40 max-w-5xl mx-auto rounded-2xl border border-slate-700/80 bg-slate-900/95 backdrop-blur-md shadow-2xl px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3"
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <Cookie className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-200 leading-snug">
          Usamos cookies essenciais e armazenamento local para manter sua sessão, áudio e progresso offline em conformidade com a{' '}
          <strong>LGPD</strong>. Veja nossa{' '}
          <button
            type="button"
            onClick={() => onOpenLegal('cookies')}
            className="text-amber-300 hover:text-white underline font-semibold cursor-pointer"
          >
            Política de Cookies
          </button>
          ,{' '}
          <button
            type="button"
            onClick={() => onOpenLegal('privacy')}
            className="text-emerald-300 hover:text-white underline font-semibold cursor-pointer"
          >
            Privacidade
          </button>{' '}
          e{' '}
          <button
            type="button"
            onClick={() => onOpenLegal('terms')}
            className="text-indigo-300 hover:text-white underline font-semibold cursor-pointer"
          >
            Termos
          </button>
          .
        </p>
      </div>

      <div className="flex items-center flex-wrap gap-2 shrink-0">
        <button
          type="button"
          onClick={onAcceptEssentialOnly}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer whitespace-nowrap shrink-0"
        >
          Apenas Essenciais
        </button>

        <button
          type="button"
          onClick={() => onOpenLegal('cookies')}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Preferências</span>
        </button>

        <button
          type="button"
          onClick={handleAccept}
          disabled={isAccepting}
          className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-xs font-bold text-white flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 shadow-sm"
        >
          <Check className="w-3.5 h-3.5" />
          <span>{isAccepting ? 'Salvando...' : 'Aceitar Todos'}</span>
        </button>
      </div>
    </aside>
  );
};
