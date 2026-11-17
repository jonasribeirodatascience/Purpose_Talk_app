import React, { useMemo, useState } from 'react';
import {
  X,
  Search,
  ChevronDown,
  HelpCircle,
  Mail,
  Cookie,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { HELP_CATEGORIES, HELP_FAQ_ITEMS, HelpCategoryId } from '../data/helpFaq';
import { LegalTabId } from './LegalLgpdModal';

interface HelpCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLegal: (tab: LegalTabId) => void;
  onOpenApp?: () => void;
}

export const HelpCenterModal: React.FC<HelpCenterModalProps> = ({
  isOpen,
  onClose,
  onOpenLegal,
  onOpenApp,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<HelpCategoryId>('all');
  const [expandedId, setExpandedId] = useState<string | null>(HELP_FAQ_ITEMS[0].id);

  const filteredFaq = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return HELP_FAQ_ITEMS.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!q) return true;
      return (
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-center-title"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2
                id="help-center-title"
                className="text-base sm:text-lg font-extrabold text-white tracking-tight truncate"
              >
                Central de Ajuda & FAQ
              </h2>
              <p className="text-xs text-slate-400 truncate">
                Respostas rápidas sobre metodologia, 148 louvores, Mercado Pago, Cookies e Google Play
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar Central de Ajuda"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search + Category Filter Strip */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar dúvida (ex: Maverick City, 7 dias grátis, microfone, Mercado Pago, Play Store...)"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {HELP_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable FAQ Accordion & Quick Links */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {filteredFaq.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-8 text-center space-y-2">
              <p className="text-sm font-semibold text-white">
                Nenhuma pergunta encontrada para &quot;{searchQuery}&quot;.
              </p>
              <p className="text-xs text-slate-400">
                Tente outro termo ou fale diretamente com nosso suporte abaixo.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredFaq.map((item) => {
                const isOpenItem = expandedId === item.id;
                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden"
                  >
                    <button
                      type="button"
                      aria-expanded={isOpenItem}
                      onClick={() => setExpandedId(isOpenItem ? null : item.id)}
                      className="w-full px-4 py-3.5 text-left flex items-center justify-between gap-3 hover:bg-slate-900/70 transition cursor-pointer"
                    >
                      <span className="text-xs sm:text-sm font-bold text-white leading-snug">
                        {item.question}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                          isOpenItem ? 'rotate-180 text-indigo-400' : ''
                        }`}
                      />
                    </button>
                    {isOpenItem && (
                      <div className="px-4 pb-4 pt-1 border-t border-slate-800/70 text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Shortcuts */}
          <div className={`grid grid-cols-1 ${onOpenApp ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3 pt-2 border-t border-slate-800`}>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLegal('cookies');
              }}
              className="p-3.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-left flex items-center gap-2.5 transition cursor-pointer"
            >
              <Cookie className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">Política de Cookies</div>
                <div className="text-[11px] text-slate-400">Gerenciar aceite</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLegal('privacy');
              }}
              className="p-3.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-left flex items-center gap-2.5 transition cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">Privacidade & Termos</div>
                <div className="text-[11px] text-slate-400">Direitos LGPD</div>
              </div>
            </button>

            {onOpenApp && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenApp();
                }}
                className="p-3.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-left flex items-center gap-2.5 transition cursor-pointer"
              >
                <Smartphone className="w-4 h-4 text-indigo-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">Acessar Aplicativo</div>
                  <div className="text-[11px] text-slate-400">Ir para os estudos</div>
                </div>
              </button>
            )}
          </div>

          {/* Direct Support Contact */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Mail className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300">
                <span className="font-bold text-white block">
                  Ainda precisa de ajuda ou suporte sobre assinatura?
                </span>
                <span>
                  Escreva para{' '}
                  <a
                    href="mailto:crescimentopp02@gmail.com"
                    className="text-indigo-300 hover:text-white underline font-semibold"
                  >
                    crescimentopp02@gmail.com
                  </a>
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white whitespace-nowrap shrink-0 cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
