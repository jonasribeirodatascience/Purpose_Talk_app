import React from 'react';
import {
  Sun,
  Moon,
  Music,
  Mic,
  Cloud,
  ShieldCheck,
  Cookie,
  HelpCircle,
  ArrowRight,
  Loader2,
  AlertCircle,
  Smartphone,
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { ThemeMode } from '../types';
import { LegalTabId } from './LegalLgpdModal';
import { GOOGLE_PLAY_STORE_URL } from '../config/appDistribution';

interface LoginScreenProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenLegal: (tab: LegalTabId) => void;
  onOpenHelp: () => void;
  onViewLanding: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  theme,
  onToggleTheme,
  onOpenLegal,
  onOpenHelp,
  onViewLanding,
}) => {
  const { signInWithGoogle, isSigningIn, authError, clearAuthError } = useFirebase();

  const handleGoogleLogin = async () => {
    clearAuthError();
    await signInWithGoogle();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Minimal Header */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="text-lg sm:text-xl font-extrabold tracking-tight text-white whitespace-nowrap">
          Purpose{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-amber-300">
            Talk
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onViewLanding}
            className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-900 transition cursor-pointer"
          >
            Conhecer planos
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-400" />
            )}
          </button>
        </div>
      </header>

      {/* Main Auth Stage */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Context Column */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">
              Inglês com Louvor, Tecnologia e IA
            </p>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-[1.1]">
              Entre para começar sua jornada de inglês com propósito.
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Iniciantes são acolhidos em Português desde a primeira frase. Estude 148 louvores com pronúncia falada e cantada, pratique no microfone e salve tudo na nuvem.
            </p>

            <div className="space-y-3 pt-2 max-w-md mx-auto lg:mx-0 text-left">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0 mt-0.5">
                  <Music className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">148 Louvores Mapeados</div>
                  <div className="text-xs text-slate-400">
                    Tradução fiel, contexto bíblico e guia rítmico de canto.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Mentores e Análise de Voz</div>
                  <div className="text-xs text-slate-400">
                    Feedback instantâneo de pronúncia e simulações cotidianas e tech.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shrink-0 mt-0.5">
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Progresso Sincronizado</div>
                  <div className="text-xs text-slate-400">
                    XP, ofensiva diária, flashcards SM-2 e assinatura salvos na sua conta.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sign-In Card */}
          <div className="lg:col-span-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 max-w-md mx-auto">
              <div className="space-y-1.5 text-center">
                <h2 className="text-xl font-extrabold text-white">Acesse sua conta</h2>
                <p className="text-xs text-slate-400">
                  Entre com um clique usando sua conta Google para continuar de onde parou.
                </p>
              </div>

              {authError && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200"
                >
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isSigningIn}
                className="w-full py-3.5 px-5 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-70 text-slate-900 font-bold text-sm flex items-center justify-center gap-3 shadow-lg transition cursor-pointer"
              >
                {isSigningIn ? (
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                ) : (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                    />
                  </svg>
                )}
                <span>{isSigningIn ? 'Conectando com Google...' : 'Entrar com Google'}</span>
              </button>

              <div className="pt-4 border-t border-slate-800 space-y-3 text-center">
                <button
                  type="button"
                  onClick={onViewLanding}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 hover:text-white inline-flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <span>Conhecer metodologia e planos (7 dias grátis)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <a
                  href={GOOGLE_PLAY_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-xs font-bold text-emerald-300 hover:text-emerald-200 inline-flex items-center justify-center gap-2 transition"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Baixar app no Google Play</span>
                </a>
              </div>

              <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                Ao continuar, você concorda com os{' '}
                <button
                  type="button"
                  onClick={() => onOpenLegal('terms')}
                  className="text-indigo-300 hover:text-white underline cursor-pointer"
                >
                  Termos de Uso
                </button>{' '}
                e com a{' '}
                <button
                  type="button"
                  onClick={() => onOpenLegal('privacy')}
                  className="text-emerald-300 hover:text-white underline cursor-pointer"
                >
                  Política de Privacidade (LGPD)
                </button>
                .
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-4 px-6 text-center text-xs text-slate-500 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
        <span>Purpose Talk · Suporte: crescimentopp02@gmail.com</span>
        <span aria-hidden="true">·</span>
        <button
          type="button"
          onClick={onOpenHelp}
          className="text-slate-400 hover:text-white inline-flex items-center gap-1 underline cursor-pointer"
        >
          <HelpCircle className="w-3 h-3" />
          <span>Central de Ajuda</span>
        </button>
        <span aria-hidden="true">·</span>
        <button
          type="button"
          onClick={() => onOpenLegal('cookies')}
          className="text-slate-400 hover:text-white inline-flex items-center gap-1 underline cursor-pointer"
        >
          <Cookie className="w-3 h-3" />
          <span>Cookies</span>
        </button>
        <span aria-hidden="true">·</span>
        <button
          type="button"
          onClick={() => onOpenLegal('privacy')}
          className="text-slate-400 hover:text-white inline-flex items-center gap-1 underline cursor-pointer"
        >
          <ShieldCheck className="w-3 h-3" />
          <span>Privacidade (LGPD)</span>
        </button>
      </footer>
    </div>
  );
};
