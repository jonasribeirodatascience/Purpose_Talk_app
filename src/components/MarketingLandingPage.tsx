import React, { useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  HelpCircle,
  Mic,
  Music,
  ShieldCheck,
  Sparkles,
  Sun,
  Moon,
  Check,
  Cookie,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import heroStudioImage from '../assets/images/hero_landing_worship_tech_1794927449132.jpg';
import { SUBSCRIPTION_PLANS } from '../data/subscriptionPlans';
import { HELP_FAQ_ITEMS } from '../data/helpFaq';
import { AppTabId } from './Header';
import { LegalTabId } from './LegalLgpdModal';
import { ThemeMode } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { GOOGLE_PLAY_STORE_URL } from '../config/appDistribution';

interface MarketingLandingPageProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  onEnterApp: (targetTab?: AppTabId) => void;
  onOpenHelp: () => void;
  onOpenLegal: (tab: LegalTabId) => void;
  isAuthenticated: boolean;
}

const WORSHIP_PREVIEW_SAMPLES = [
  {
    id: 'goodness',
    title: 'Goodness of God',
    artist: 'Bethel Music & Jenn Johnson',
    lyricEn: 'All my life You have been faithful, all my life You have been so, so good.',
    meaningPt: 'Em toda a minha vida Tu tens sido fiel; em toda a minha vida Tu tens sido tão, tão bom.',
    spokenEasy: 'ÓL mai láif iu rév bin FÊITH-ful · sou, sou GUD',
    sungFlow: 'Óól mai láááif iu rév biin FÊÊÊITH-fuul ♩ sou, sou GÚÚÚD',
  },
  {
    id: 'promises',
    title: 'Promises',
    artist: 'Maverick City Music',
    lyricEn: 'Great is Your faithfulness to me, from the rising sun to the setting same.',
    meaningPt: 'Grande é a Tua fidelidade para comigo, do nascer ao pôr do sol.',
    spokenEasy: 'GRÊIT iz iór FÊITH-ful-nes tu mi',
    sungFlow: 'GRÊÊÊIT iz iór FÊÊÊITH-fuul-nes tuu mii ♩ frôm dê rái-zin sân',
  },
  {
    id: 'waymaker',
    title: 'Way Maker',
    artist: 'Sinach / Leeland',
    lyricEn: 'Way maker, miracle worker, promise keeper, light in the darkness.',
    meaningPt: 'Deus que abre caminhos, operador de milagres, fiel às promessas, luz na escuridão.',
    spokenEasy: 'UÊI mêi-kêr · MÍ-ra-kol uôr-kêr · PRÓ-mis kí-pêr',
    sungFlow: 'UÊÊÊI mêêi-kêr ♩ MÍ-ra-kol uôôr-kêr ♩ láááit in dâ dárk-nes',
  },
];

export const MarketingLandingPage: React.FC<MarketingLandingPageProps> = ({
  theme,
  onToggleTheme,
  onEnterApp,
  onOpenHelp,
  onOpenLegal,
  isAuthenticated,
}) => {
  const [selectedSampleId, setSelectedSampleId] = useState(WORSHIP_PREVIEW_SAMPLES[0].id);
  const [openFaqId, setOpenFaqId] = useState<string | null>(HELP_FAQ_ITEMS[0].id);

  const activeSample =
    WORSHIP_PREVIEW_SAMPLES.find((s) => s.id === selectedSampleId) ||
    WORSHIP_PREVIEW_SAMPLES[0];

  const topFaqItems = HELP_FAQ_ITEMS.slice(0, 4);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 border-b border-slate-800/90 bg-slate-950/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Zone 1: Clean Brand Wordmark Only */}
          <a
            href="#topo"
            className="text-lg sm:text-xl font-extrabold tracking-tight text-white whitespace-nowrap shrink-0"
          >
            Purpose{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-amber-300">
              Talk
            </span>
          </a>

          {/* Zone 2: Single-line Navigation Links */}
          <nav
            aria-label="Navegação principal"
            className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300"
          >
            <a href="#metodologia" className="hover:text-white transition whitespace-nowrap shrink-0">
              Metodologia
            </a>
            <a href="#louvores" className="hover:text-white transition whitespace-nowrap shrink-0">
              148 Louvores
            </a>
            <a href="#planos" className="hover:text-white transition whitespace-nowrap shrink-0">
              Planos
            </a>
            <button
              type="button"
              onClick={onOpenHelp}
              className="hover:text-white transition whitespace-nowrap shrink-0 cursor-pointer"
            >
              Central de Ajuda
            </button>
          </nav>

          {/* Zone 3: Theme + Install + Dominant CTA */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer shrink-0"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-400" />
              )}
            </button>

            <a
              href={GOOGLE_PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-emerald-300 hover:text-emerald-200 transition whitespace-nowrap shrink-0"
            >
              <Smartphone className="w-3.5 h-3.5 shrink-0" />
              <span>Google Play</span>
            </a>

            <button
              type="button"
              onClick={() => onEnterApp('worship')}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 transition whitespace-nowrap shrink-0 shadow-sm cursor-pointer"
            >
              <span>{isAuthenticated ? 'Ir para Meu Painel' : 'Acessar App'}</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>
        </div>
      </header>

      <main id="topo" className="flex-1">
        {/* 1. Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 sm:pt-16 sm:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">
                Inglês prático através da adoração, carreira e conversação real
              </p>

              <h1
                className="font-extrabold tracking-tight text-white leading-[1.08]"
                style={{ fontSize: 'clamp(2.2rem, 4.2vw, 3.5rem)' }}
              >
                Aprenda inglês cantando seus louvores favoritos e falando sem medo desde o primeiro dia.
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
                Para iniciantes, as primeiras conversas começam acolhendo você em Português e introduzem o inglês aos poucos. Estude 148 louvores com pronúncia falada e cantada, treine no microfone com retorno instantâneo e prepare-se para tecnologia e viagens.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => onEnterApp('worship')}
                  className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-extrabold inline-flex items-center gap-2 transition shadow-lg whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Começar Agora no App</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a
                  href={GOOGLE_PLAY_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-200 hover:text-white text-sm font-bold inline-flex items-center gap-2 transition whitespace-nowrap shrink-0"
                >
                  <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Baixar no Google Play</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>

                <a
                  href="#planos"
                  className="px-5 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white text-sm font-semibold transition whitespace-nowrap shrink-0"
                >
                  Ver Planos (7 dias grátis)
                </a>
              </div>

              <div className="grid grid-cols-3 gap-6 pt-5 border-t border-slate-800/90 max-w-lg">
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold text-white tabular-nums">148</div>
                  <div className="text-xs text-slate-400 mt-0.5">Louvores mapeados</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold text-white tabular-nums">85%</div>
                  <div className="text-xs text-slate-400 mt-0.5">Acolhimento PT-BR inicial</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold text-white tabular-nums">7 dias</div>
                  <div className="text-xs text-slate-400 mt-0.5">Grátis no Mercado Pago</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
                <img
                  src={heroStudioImage}
                  alt="Violão acústico e estação de estudo com ondas sonoras no Purpose Talk"
                  className="w-full aspect-video object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 2. Asymmetric Bento Capabilities */}
        <section
          id="metodologia"
          className="border-t border-slate-900 bg-slate-950/60 py-16 sm:py-20"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="max-w-2xl space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">
                Como você evolui
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Uma metodologia pensada para quem quer fluência real sem travar no começo.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <article className="md:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 sm:p-7 space-y-3">
                <div className="text-xs font-bold text-indigo-400 tabular-nums">01.</div>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  Primeiras interações acolhedoras em Português
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                  Ao contrário de aplicativos que jogam diálogos difíceis logo na abertura, no nível Iniciante nossos mentores conduzem as primeiras interações com 85% de Português carinhoso e apresentam 1 ou 2 expressões em inglês com leitura facilitada. Conforme você ganha segurança, o inglês assume espaço naturalmente.
                </p>
              </article>

              <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 sm:p-7 space-y-3">
                <div className="text-xs font-bold text-amber-400 tabular-nums">02.</div>
                <h3 className="text-lg font-bold text-white">
                  Pronúncia falada e cantada lado a lado
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Entenda o significado espiritual da letra e a diferença entre falar a frase pausadamente e cantá-la com ligações musicais (marcadas com ♩).
                </p>
              </article>

              <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 sm:p-7 space-y-3">
                <div className="text-xs font-bold text-emerald-400 tabular-nums">03.</div>
                <h3 className="text-lg font-bold text-white">
                  Microfone + Flashcards SM-2
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Fale no microfone para ver palavra por palavra onde ajustar língua e ritmo, salve termos no caderno e revise com repetição espaçada offline.
                </p>
              </article>

              <article className="md:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 sm:p-7 space-y-3">
                <div className="text-xs font-bold text-cyan-400 tabular-nums">04.</div>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  Da congregação ao cotidiano e carreira em Tecnologia
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                  Quando estiver pronto para ir além dos louvores, pratique diálogos de viagem, restaurantes, daily standups, code reviews e entrevistas técnicas com avatares de sotaque americano e britânico.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* 3. Interactive Worship Study Preview */}
        <section id="louvores" className="border-t border-slate-900 py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-2 max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-widest text-amber-400">
                  Catálogo com 148 louvores selecionados
                </p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Inclui Maverick City Music, Bethel, Hillsong, Elevation e hinos clássicos.
                </h2>
              </div>

              <button
                type="button"
                onClick={() => onEnterApp('worship')}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white inline-flex items-center gap-2 transition whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Music className="w-4 h-4 text-amber-400" />
                <span>Abrir Catálogo Completo no App</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-4 space-y-2">
                {WORSHIP_PREVIEW_SAMPLES.map((sample) => {
                  const selected = sample.id === activeSample.id;
                  return (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => setSelectedSampleId(sample.id)}
                      className={`w-full text-left p-4 rounded-xl border transition cursor-pointer ${
                        selected
                          ? 'bg-indigo-950/50 border-indigo-500 text-white'
                          : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-sm font-bold">{sample.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{sample.artist}</div>
                    </button>
                  );
                })}
              </div>

              <div className="lg:col-span-8 rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-7 space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-extrabold text-white">{activeSample.title}</h3>
                    <p className="text-xs text-slate-400">{activeSample.artist}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onEnterApp('worship')}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Praticar este Louvor no App</span>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Trecho em Inglês
                    </div>
                    <p className="text-base sm:text-lg font-bold text-white leading-snug">
                      {activeSample.lyricEn}
                    </p>
                  </div>

                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
                      Significado em Português
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {activeSample.meaningPt}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                        Pronúncia Falada
                      </div>
                      <p className="text-xs sm:text-sm font-mono-code text-slate-200 leading-relaxed">
                        {activeSample.spokenEasy}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                        Pronúncia Cantada (Ritmo)
                      </div>
                      <p className="text-xs sm:text-sm font-mono-code text-slate-200 leading-relaxed">
                        {activeSample.sungFlow}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Pricing Section */}
        <section
          id="planos"
          className="border-t border-slate-900 bg-slate-950/60 py-16 sm:py-20"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-2 max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                  Planos com 7 dias grátis iniciais
                </p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Experimente tudo por 7 dias sem cobrança hoje.
                </h2>
                <p className="text-sm text-slate-400">
                  Integração preparada com Mercado Pago (PIX ou Cartão). Cancele em 1 clique antes do 7º dia se preferir.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {SUBSCRIPTION_PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={`rounded-2xl border p-6 flex flex-col justify-between space-y-6 ${
                    plan.popular
                      ? 'bg-indigo-950/40 border-indigo-500/80 shadow-xl'
                      : 'bg-slate-900/80 border-slate-800'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-extrabold text-white">{plan.name}</h3>
                      {plan.badgeText && (
                        <span className="text-[11px] font-bold text-indigo-300">
                          {plan.badgeText}
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-extrabold text-white tabular-nums">
                          {plan.priceLabel}
                        </span>
                        <span className="text-xs text-slate-400">
                          /{plan.billingCycle === 'annual' ? 'ano' : 'mês'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{plan.monthlyEquivalentLabel}</p>
                    </div>

                    <ul className="space-y-2 pt-3 border-t border-slate-800/80">
                      {plan.featuresPt.map((feat) => (
                        <li key={feat} className="flex items-start gap-2 text-xs text-slate-300">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => onEnterApp('settings')}
                    className={`w-full py-3 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                      plan.popular
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  >
                    Iniciar 7 Dias Grátis no App
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. FAQ Preview & App Entry */}
        <section className="border-t border-slate-900 py-16 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">
                  Dúvidas Frequentes
                </p>
                <h2 className="text-2xl font-extrabold text-white tracking-tight mt-1">
                  Central de Ajuda & Perguntas Comuns
                </h2>
              </div>

              <button
                type="button"
                onClick={onOpenHelp}
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 hover:text-white inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                <span>Ver todas as perguntas ({HELP_FAQ_ITEMS.length})</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {topFaqItems.map((item) => {
                const isOpen = openFaqId === item.id;
                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-800 bg-slate-900/70 overflow-hidden"
                  >
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenFaqId(isOpen ? null : item.id)}
                      className="w-full px-5 py-4 text-left flex items-center justify-between gap-3 hover:bg-slate-900 transition cursor-pointer"
                    >
                      <span className="text-sm font-bold text-white">{item.question}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                          isOpen ? 'rotate-180 text-indigo-400' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 pt-1 border-t border-slate-800/70 text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Final Conversion Callout */}
            <div className="rounded-2xl border border-indigo-500/40 bg-slate-900 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                  <Sparkles className="w-4 h-4" />
                  <span>Pronto para começar hoje?</span>
                </div>
                <h3 className="text-xl font-extrabold text-white">
                  Escolha seu primeiro louvor e pratique sua primeira frase agora.
                </h3>
              </div>

              <div className="flex items-center flex-wrap gap-3 shrink-0">
                <a
                  href={GOOGLE_PLAY_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition whitespace-nowrap shrink-0"
                >
                  <Smartphone className="w-4 h-4 shrink-0" />
                  <span>Baixar no Google Play</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>
                <PWAInstallButton variant="card" label="Instalar no Navegador" />
                <button
                  type="button"
                  onClick={() => onEnterApp('worship')}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-extrabold inline-flex items-center gap-2 transition whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Entrar no App</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 text-xs text-slate-400">
          <div className="space-y-1">
            <div className="text-sm font-extrabold text-white">Purpose Talk</div>
            <p>
              Aprendizado prático de inglês com louvores, conversação acolhedora e carreira tech.
            </p>
            <p className="text-slate-500">
              Suporte & DPO (LGPD): crescimentopp02@gmail.com
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <a
              href={GOOGLE_PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white text-emerald-400 transition inline-flex items-center gap-1 whitespace-nowrap font-semibold"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Google Play Store</span>
            </a>
            <button
              type="button"
              onClick={() => onEnterApp('worship')}
              className="hover:text-white transition cursor-pointer whitespace-nowrap"
            >
              Acessar App
            </button>
            <button
              type="button"
              onClick={onOpenHelp}
              className="hover:text-white transition inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Central de Ajuda (FAQ)</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenLegal('cookies')}
              className="hover:text-white transition inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <Cookie className="w-3.5 h-3.5" />
              <span>Política de Cookies</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenLegal('privacy')}
              className="hover:text-white transition inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Privacidade & Termos (LGPD)</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
