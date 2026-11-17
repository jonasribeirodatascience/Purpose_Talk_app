import React, { useState } from 'react';
import {
  ArrowLeft,
  Sliders,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  BarChart3,
  Trophy,
  Bell,
  BellRing,
  Crown,
  CreditCard,
  ShieldCheck,
  Download,
  Shield,
  LogOut,
  Cloud,
  Loader2,
  GraduationCap,
  CheckCircle2,
  Compass,
  HelpCircle,
  Cookie,
  Globe,
  Ban,
  AlertTriangle,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import {
  DailyActivityRecord,
  LearningFocus,
  PaymentMethodRecord,
  PushNotificationPrefs,
  ThemeMode,
  UserLevel,
  UserSubscriptionRecord,
} from '../types';
import { LegalTabId } from './LegalLgpdModal';
import { VoiceSettingsModal } from './VoiceSettingsModal';
import { PaymentMethodsModal } from './PaymentMethodsModal';
import { SubscriptionPlansModal } from './SubscriptionPlansModal';
import { PushNotificationsModal } from './PushNotificationsModal';
import { PWAInstallButton } from './PWAInstallButton';
import { CREATOR_ADMIN_EMAIL, formatBrlFromCents } from '../data/subscriptionPlans';
import { GOOGLE_PLAY_STORE_URL } from '../config/appDistribution';
import { useFirebase } from '../context/FirebaseContext';
import { updateSubscriptionInCloud } from '../services/firestoreSync';
import { tts } from '../utils/speech';

type SettingsSectionFilter = 'all' | 'learning' | 'audio' | 'progress' | 'account';

interface SettingsScreenProps {
  onBack: () => void;
  onNavigateUtilityTab: (tab: 'stats' | 'achievements' | 'admin') => void;
  userLevel: UserLevel;
  onLevelChange: (level: UserLevel) => void;
  focus: LearningFocus;
  onFocusChange: (focus: LearningFocus) => void;
  xp: number;
  streak: number;
  unlockedAchievementsCount?: number;
  isAudioMuted: boolean;
  onToggleAudio: () => void;
  speechRate: number;
  onSpeechRateChange: (rate: number) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  paymentMethods: PaymentMethodRecord[];
  onAddPaymentMethod: (method: PaymentMethodRecord) => Promise<void>;
  onSetDefaultPaymentMethod: (methodId: string) => void;
  onDeletePaymentMethod: (methodId: string) => void;
  subscription: UserSubscriptionRecord | null;
  onActivateSubscription: (sub: UserSubscriptionRecord) => Promise<void>;
  onUpdateSubscription: (
    patch: Partial<
      Pick<
        UserSubscriptionRecord,
        'status' | 'cancelAtPeriodEnd' | 'planId' | 'planName' | 'priceBrlCents' | 'billingCycle'
      >
    >,
    options?: { skipCloudSync?: boolean }
  ) => Promise<void>;
  lgpdAccepted: boolean;
  onOpenLegal: (tab: LegalTabId) => void;
  onAcceptLgpd: () => Promise<void>;
  onExportUserData: () => void;
  dailyActivity: Record<string, DailyActivityRecord>;
  pushPrefs: PushNotificationPrefs | null;
  streakAtRisk: boolean;
  onEnablePush: (reminderHour: number) => Promise<void>;
  onUpdateReminderHour: (reminderHour: number) => Promise<void>;
  onDisablePush: () => Promise<void>;
  onSendTestPush: () => Promise<{ mode: string; title: string; body: string }>;
  onOpenHelp: () => void;
  onOpenLanding: () => void;
  cookieConsentConfigured?: boolean;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onBack,
  onNavigateUtilityTab,
  userLevel,
  onLevelChange,
  focus,
  onFocusChange,
  xp,
  streak,
  unlockedAchievementsCount = 0,
  isAudioMuted,
  onToggleAudio,
  speechRate,
  onSpeechRateChange,
  theme,
  onToggleTheme,
  paymentMethods,
  onAddPaymentMethod,
  onSetDefaultPaymentMethod,
  onDeletePaymentMethod,
  subscription,
  onActivateSubscription,
  onUpdateSubscription,
  lgpdAccepted,
  onOpenLegal,
  onAcceptLgpd,
  onExportUserData,
  dailyActivity,
  pushPrefs,
  streakAtRisk,
  onEnablePush,
  onUpdateReminderHour,
  onDisablePush,
  onSendTestPush,
  onOpenHelp,
  onOpenLanding,
  cookieConsentConfigured = false,
}) => {
  const [activeSection, setActiveSection] = useState<SettingsSectionFilter>('all');
  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPlansModalOpen, setIsPlansModalOpen] = useState(false);
  const [isPushModalOpen, setIsPushModalOpen] = useState(false);
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [isCancelingSubscription, setIsCancelingSubscription] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const { user, authReady, isSigningIn, authError, clearAuthError, signInWithGoogle, signOutUser } =
    useFirebase();

  const handleCancelViaMercadoPago = async () => {
    if (!subscription) return;
    setIsCancelingSubscription(true);
    setCancelFeedback(null);
    try {
      const endpoint =
        subscription.gateway === 'mercadopago'
          ? '/api/billing/mercadopago/cancel'
          : '/api/billing/cancel-subscription';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gateway: subscription.gateway,
          gatewaySubscriptionId: subscription.gatewaySubscriptionId,
          cancelScope: 'preapproval',
          userId: user?.uid || subscription.uid,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Não foi possível cancelar a assinatura.');
      }

      if (user?.uid) {
        await updateSubscriptionInCloud(user.uid, {
          status: 'canceled',
          cancelAtPeriodEnd: true,
        });
      }

      await onUpdateSubscription(
        {
          cancelAtPeriodEnd: true,
          status: 'canceled',
        },
        { skipCloudSync: Boolean(user?.uid) }
      );
      setIsConfirmingCancel(false);
      setCancelFeedback({
        type: 'success',
        message:
          data?.message ||
          'Assinatura cancelada com sucesso. Nenhuma cobrança futura será realizada.',
      });
    } catch (err: any) {
      setCancelFeedback({
        type: 'error',
        message: err?.message || 'Erro ao comunicar com a API do Mercado Pago.',
      });
    } finally {
      setIsCancelingSubscription(false);
    }
  };

  const isCreatorAdmin = Boolean(
    user?.email &&
      user.email.toLowerCase() === CREATOR_ADMIN_EMAIL.toLowerCase() &&
      user.emailVerified
  );

  const levelSummaryLabel =
    userLevel === 'beginner'
      ? 'Iniciante'
      : userLevel === 'intermediate'
      ? 'Intermediário'
      : 'Avançado';

  const navItems: Array<{ id: SettingsSectionFilter; label: string }> = [
    { id: 'all', label: 'Todas as Seções' },
    { id: 'learning', label: 'Nível & Foco' },
    { id: 'audio', label: 'Áudio, Voz & Tema' },
    { id: 'progress', label: 'Progresso & Lembretes' },
    { id: 'account', label: 'Conta, Planos & LGPD' },
  ];

  const showSection = (id: Exclude<SettingsSectionFilter, 'all'>) =>
    activeSection === 'all' || activeSection === id;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Full-Screen Settings Top Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 hover:text-white transition whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-indigo-400" />
              <span>Voltar ao Aprendizado</span>
            </button>

            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-white truncate">
                Configurações e Conta
              </h1>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 whitespace-nowrap tabular-nums">
            <span>Nível {levelSummaryLabel}</span>
            <span aria-hidden="true">·</span>
            <span>{streak} dias</span>
            <span aria-hidden="true">·</span>
            <span>{xp} XP</span>
          </div>
        </div>
      </header>

      {/* Full-Page Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {authError && (
          <div className="mb-6 px-4 py-2.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between gap-3">
            <span>{authError}</span>
            <button
              type="button"
              onClick={clearAuthError}
              className="text-rose-300 hover:text-white underline font-semibold shrink-0 cursor-pointer"
            >
              Fechar
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Navigation Rail (3 cols on desktop, top filter row on mobile) */}
          <aside className="lg:col-span-3 space-y-4 lg:sticky lg:top-20">
            <nav
              aria-label="Seções de configurações"
              className="flex lg:flex-col gap-1.5 overflow-x-auto no-scrollbar pb-1"
            >
              {navItems.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800/80'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="hidden lg:block p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2.5 text-xs">
              <div className="font-semibold text-slate-200">Resumo da Conta</div>
              <div className="space-y-1.5 text-slate-400">
                <div className="flex justify-between gap-2">
                  <span>Nuvem</span>
                  <span className={user ? 'text-emerald-400 font-medium' : 'text-slate-300'}>
                    {user ? 'Conectado' : 'Local'}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>Assinatura</span>
                  <span className="text-slate-200">
                    {subscription?.status === 'active'
                      ? 'Ativa'
                      : subscription?.status === 'trialing'
                      ? 'Teste 7 dias'
                      : 'Gratuita'}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>Lembretes</span>
                  <span className="text-slate-200">
                    {pushPrefs?.enabled
                      ? `${String(pushPrefs.reminderHour).padStart(2, '0')}:00`
                      : 'Desativado'}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>LGPD</span>
                  <span className={lgpdAccepted ? 'text-emerald-400' : 'text-amber-300'}>
                    {lgpdAccepted ? 'Aceita' : 'Pendente'}
                  </span>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Full Content Area (9 cols) */}
          <div className="lg:col-span-9 space-y-6">
            {/* 1. Nível e Foco de Aprendizagem */}
            {showSection('learning') && (
              <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5">
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <GraduationCap className="w-4 h-4 text-indigo-400" />
                    <h2>Nível de Inglês & Foco de Estudo</h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    No nível Iniciante, as primeiras interações são acolhedoras em Português e introduzem o inglês aos poucos.
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-300 block">Seu Nível Atual</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => onLevelChange('beginner')}
                      className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                        userLevel === 'beginner'
                          ? 'bg-indigo-600/20 border-indigo-500 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold">Iniciante (A1–A2)</span>
                        {userLevel === 'beginner' && (
                          <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Começa acolhendo em Português e evolui sem pressão
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => onLevelChange('intermediate')}
                      className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                        userLevel === 'intermediate'
                          ? 'bg-indigo-600/20 border-indigo-500 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold">Intermediário (B1–B2)</span>
                        {userLevel === 'intermediate' && (
                          <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Diálogos em inglês com apoio e explicações claras
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => onLevelChange('advanced')}
                      className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                        userLevel === 'advanced'
                          ? 'bg-indigo-600/20 border-indigo-500 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold">Avançado (C1)</span>
                        {userLevel === 'advanced' && (
                          <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Imersão natural e vocabulário avançado de fluência
                      </p>
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                    <Compass className="w-3.5 h-3.5 text-purple-400" />
                    <span>Foco Temático dos Mentores</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => onFocusChange('worship')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        focus === 'worship'
                          ? 'bg-purple-600/20 border-purple-500 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold">Louvores & Fé</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Adoração, oração e significados bíblicos
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => onFocusChange('tech')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        focus === 'tech'
                          ? 'bg-cyan-600/20 border-cyan-500 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold">Tecnologia & Dados</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Reuniões, entrevistas e termos técnicos
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => onFocusChange('mixed')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        focus === 'mixed'
                          ? 'bg-indigo-600/20 border-indigo-500 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold">Completo (Fé + Tech)</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Equilíbrio entre louvor, dia a dia e carreira
                      </div>
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* 2. Áudio, Voz & Tema */}
            {showSection('audio') && (
              <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-white">Áudio, Voz da IA e Aparência</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Personalize a velocidade da leitura, o perfil vocal dos mentores e o contraste visual.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      {isAudioMuted ? (
                        <VolumeX className="w-4 h-4 text-slate-400 shrink-0" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      <div>
                        <div className="text-xs font-semibold text-slate-200">
                          {isAudioMuted ? 'Áudio Automático Mutado' : 'Áudio Automático Ativo'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Leitura automática das respostas
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onToggleAudio}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white cursor-pointer whitespace-nowrap"
                    >
                      {isAudioMuted ? 'Ativar' : 'Mutar'}
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold text-slate-200">Velocidade da Fala</div>
                      <div className="text-[11px] text-slate-400">Ritmo das falas em inglês</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        aria-label="Velocidade do áudio"
                        value={speechRate}
                        onChange={(e) => onSpeechRateChange(parseFloat(e.target.value))}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none cursor-pointer"
                      >
                        <option value={0.8}>0.8x Lento</option>
                        <option value={0.95}>1.0x Normal</option>
                        <option value={1.15}>1.2x Nativo</option>
                      </select>
                      <button
                        type="button"
                        onClick={() =>
                          tts.speak(
                            'Olá! Tudo pronto para você praticar no seu ritmo.',
                            speechRate,
                            1.0,
                            undefined,
                            undefined,
                            'pt-BR'
                          )
                        }
                        className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                      >
                        Testar
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsVoiceSettingsOpen(true)}
                    className="p-4 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-left flex items-center justify-between gap-3 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Sliders className="w-4 h-4 text-indigo-400 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-slate-200">Perfis de Voz da IA</div>
                        <div className="text-[11px] text-slate-400">
                          Escolha sotaque americano, britânico e timbre
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-indigo-400 font-semibold shrink-0">Ajustar</span>
                  </button>

                  <button
                    type="button"
                    onClick={onToggleTheme}
                    className="p-4 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-left flex items-center justify-between gap-3 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      {theme === 'dark' ? (
                        <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <Moon className="w-4 h-4 text-indigo-400 shrink-0" />
                      )}
                      <div>
                        <div className="text-xs font-semibold text-slate-200">
                          {theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Alto contraste WCAG AA/AAA
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-indigo-400 font-semibold shrink-0">Alternar</span>
                  </button>
                </div>
              </section>
            )}

            {/* 3. Progresso, Estatísticas & Lembretes Push */}
            {showSection('progress') && (
              <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-white">
                    Progresso, Estatísticas & Lembretes Diários
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Acompanhe sua evolução nos últimos 30 dias, medalhas e lembretes para proteger sua ofensiva.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => onNavigateUtilityTab('stats')}
                    className="p-4 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-left transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-100">
                      <BarChart3 className="w-4 h-4 text-indigo-400" />
                      <span>Estatísticas (30d)</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1.5 tabular-nums">
                      {xp} XP · {streak}d ofensiva
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigateUtilityTab('achievements')}
                    className="p-4 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-left transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-100">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span>Conquistas & Medalhas</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1.5 tabular-nums">
                      {unlockedAchievementsCount} desbloqueadas
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPushModalOpen(true)}
                    className="p-4 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-left transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-100">
                      {pushPrefs?.enabled ? (
                        <BellRing className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Bell className="w-4 h-4 text-amber-400" />
                      )}
                      <span>Lembretes Push</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1.5">
                      {pushPrefs?.enabled
                        ? streakAtRisk
                          ? 'Streak em risco hoje'
                          : `Ativo (${String(pushPrefs.reminderHour).padStart(2, '0')}:00)`
                        : 'Notificações desativadas'}
                    </div>
                  </button>
                </div>
              </section>
            )}

            {/* 4. Conta Google, Planos, Pagamentos & LGPD */}
            {showSection('account') && (
              <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-white">
                    Conta, Planos, Pagamentos & Privacidade (LGPD)
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Gerencie sua conta Google, assinatura com 7 dias grátis, meios de pagamento e dados pessoais.
                  </p>
                </div>

                {/* Google Account Card */}
                {authReady && (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    {user ? (
                      <>
                        <div className="flex items-center gap-3">
                          {user.photoURL ? (
                            <img
                              src={user.photoURL}
                              alt={user.displayName || 'Aluno'}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-full object-cover border border-emerald-400/40"
                            />
                          ) : (
                            <span className="w-10 h-10 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center">
                              {(user.displayName || user.email || 'U')[0].toUpperCase()}
                            </span>
                          )}
                          <div>
                            <div className="text-xs font-bold text-white">
                              {user.displayName || user.email}
                            </div>
                            <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
                              <Cloud className="w-3.5 h-3.5" />
                              <span>Sincronização na nuvem ativa ({user.email})</span>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={signOutUser}
                          className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-xs font-semibold text-slate-200 hover:text-rose-200 flex items-center gap-1.5 cursor-pointer transition"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sair da Conta</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <div>
                          <div className="text-xs font-bold text-white">
                            Salvar Progresso na Nuvem
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Entre com Google para manter seu XP, flashcards e louvores em qualquer dispositivo.
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={signInWithGoogle}
                          disabled={isSigningIn}
                          className="px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          {isSigningIn && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          <span>{isSigningIn ? 'Entrando...' : 'Entrar com Google'}</span>
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* Subscription Status & Mercado Pago Cancellation Card */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Crown className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span className="text-xs font-bold text-white">
                          Status da Assinatura:
                        </span>
                        {subscription ? (
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                              subscription.status === 'active'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : subscription.status === 'trialing'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : subscription.status === 'canceled'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {subscription.status === 'active'
                              ? 'Ativa'
                              : subscription.status === 'trialing'
                              ? 'Teste Grátis (7 dias)'
                              : subscription.status === 'canceled'
                              ? 'Cancelada'
                              : 'Pagamento Pendente'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-800 text-slate-300">
                            Sem assinatura ativa
                          </span>
                        )}
                      </div>

                      {subscription ? (
                        <div className="text-[11px] text-slate-400 space-y-0.5">
                          <p>
                            Plano <strong className="text-slate-200">{subscription.planName}</strong> (
                            {formatBrlFromCents(subscription.priceBrlCents)}/
                            {subscription.billingCycle === 'annual' ? 'ano' : 'mês'}) · Pagamento:{' '}
                            <strong className="text-slate-200">{subscription.paymentMethodLabel}</strong> · Gateway:{' '}
                            <strong className="text-slate-200">
                              {subscription.gateway === 'mercadopago' ? 'Mercado Pago' : 'Stripe'}
                            </strong>
                          </p>
                          <p>
                            {subscription.status === 'canceled' || subscription.cancelAtPeriodEnd
                              ? `Cancelamento confirmado · Acesso encerrado ou válido até ${new Date(
                                  subscription.trialEndsAt
                                ).toLocaleDateString('pt-BR')}`
                              : `Próxima cobrança prevista em ${new Date(
                                  subscription.nextBillingAt
                                ).toLocaleDateString('pt-BR')}`}
                            {subscription.gatewaySubscriptionId &&
                              !subscription.gatewaySubscriptionId.startsWith('trial_') && (
                                <span className="ml-2 font-mono-code text-slate-500">
                                  ID: {subscription.gatewaySubscriptionId}
                                </span>
                              )}
                          </p>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400">
                          Você ainda está no acesso gratuito. Ative um plano com 7 dias grátis via Mercado Pago quando quiser.
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {subscription && subscription.status !== 'canceled' && !subscription.cancelAtPeriodEnd ? (
                        !isConfirmingCancel && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsConfirmingCancel(true);
                              setCancelFeedback(null);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/70 border border-rose-500/30 text-rose-200 text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>
                              Cancelar via {subscription.gateway === 'mercadopago' ? 'Mercado Pago' : 'Stripe'}
                            </span>
                          </button>
                        )
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsPlansModalOpen(true)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Crown className="w-3.5 h-3.5" />
                          <span>{subscription ? 'Reativar / Trocar Plano' : 'Ativar 7 Dias Grátis'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {isConfirmingCancel && subscription && subscription.status !== 'canceled' && (
                    <div className="rounded-lg border border-rose-500/40 bg-rose-950/30 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-2 text-xs text-rose-200">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <span>
                          Deseja cancelar a renovação automática do plano <strong>{subscription.planName}</strong> na API do{' '}
                          <strong>{subscription.gateway === 'mercadopago' ? 'Mercado Pago' : 'Stripe'}</strong>?
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsConfirmingCancel(false)}
                          disabled={isCancelingSubscription}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 cursor-pointer"
                        >
                          Manter Assinatura
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelViaMercadoPago}
                          disabled={isCancelingSubscription}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-xs font-bold text-white inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          {isCancelingSubscription && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          <span>{isCancelingSubscription ? 'Cancelando...' : 'Confirmar Cancelamento'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {cancelFeedback && (
                    <div
                      role="status"
                      className={`rounded-lg px-3 py-2 text-xs border ${
                        cancelFeedback.type === 'success'
                          ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                          : 'bg-rose-950/40 border-rose-500/30 text-rose-200'
                      }`}
                    >
                      {cancelFeedback.message}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPlansModalOpen(true)}
                    className="p-4 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-left flex items-center gap-3 transition cursor-pointer"
                  >
                    <Crown className="w-5 h-5 text-indigo-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-100">
                        Planos & Assinatura (7 dias grátis)
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {subscription?.status === 'active'
                          ? `${subscription.planName} · Ativa`
                          : subscription?.status === 'trialing'
                          ? `${subscription.planName} · Teste 7d`
                          : subscription?.status === 'canceled'
                          ? `${subscription.planName} · Cancelada`
                          : 'Conheça os planos disponíveis'}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="p-4 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-left flex items-center gap-3 transition cursor-pointer"
                  >
                    <CreditCard className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-100">
                        Formas de Pagamento ({paymentMethods.length})
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Cartão de crédito, débito ou PIX
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenLegal('privacy')}
                    className="p-4 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-left flex items-center gap-3 transition cursor-pointer"
                  >
                    <ShieldCheck
                      className={`w-5 h-5 shrink-0 ${
                        lgpdAccepted ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-100">
                        Termos de Uso & Privacidade (LGPD)
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {lgpdAccepted ? 'Consentimento ativo' : 'Revisar e aceitar termos'}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={onExportUserData}
                    className="p-4 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-left flex items-center gap-3 transition cursor-pointer"
                  >
                    <Download className="w-5 h-5 text-slate-300 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-100">
                        Baixar Meus Dados (JSON)
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Portabilidade LGPD completa
                      </div>
                    </div>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => onOpenLegal('cookies')}
                    className="p-4 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-left flex items-center gap-3 transition cursor-pointer"
                  >
                    <Cookie className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-100">
                        Política de Cookies & Preferências
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {cookieConsentConfigured ? 'Preferências salvas' : 'Configurar cookies'}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={onOpenHelp}
                    className="p-4 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-left flex items-center gap-3 transition cursor-pointer"
                  >
                    <HelpCircle className="w-5 h-5 text-indigo-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-100">
                        Central de Ajuda & FAQ
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Dúvidas, microfone, planos e suporte
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={onOpenLanding}
                    className="p-4 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-left flex items-center gap-3 transition cursor-pointer"
                  >
                    <Globe className="w-5 h-5 text-cyan-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-100">
                        Página Inicial (Marketing)
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Visualizar apresentação pública
                      </div>
                    </div>
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                  <div className="text-xs text-slate-400">
                    Baixe o Purpose Talk no seu celular pela loja oficial ou instale direto pelo navegador:
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <a
                      href={GOOGLE_PLAY_STORE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-2 transition whitespace-nowrap shrink-0"
                    >
                      <Smartphone className="w-4 h-4 shrink-0" />
                      <span>Baixar no Google Play</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                    <PWAInstallButton variant="card" label="Instalar via Navegador (PWA)" />
                  </div>
                </div>

                {isCreatorAdmin && (
                  <button
                    type="button"
                    onClick={() => onNavigateUtilityTab('admin')}
                    className="w-full p-4 rounded-xl bg-amber-950/40 hover:bg-amber-950/60 border border-amber-500/40 text-left flex items-center justify-between gap-3 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-amber-400 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-amber-200">
                          Painel de Gerenciamento do Criador
                        </div>
                        <div className="text-[11px] text-amber-300/80 mt-0.5">
                          Indicadores de usuários, assinaturas, gateway e conta recebedora
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-amber-300 shrink-0">Abrir →</span>
                  </button>
                )}
              </section>
            )}
          </div>
        </div>
      </main>

      {/* Sub-Modals launched smoothly over the Full-Page Settings Screen */}
      <VoiceSettingsModal
        isOpen={isVoiceSettingsOpen}
        onClose={() => setIsVoiceSettingsOpen(false)}
        speechRate={speechRate}
        onSpeechRateChange={onSpeechRateChange}
        isAudioMuted={isAudioMuted}
        onToggleAudio={onToggleAudio}
      />

      <PaymentMethodsModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        paymentMethods={paymentMethods}
        onAddPaymentMethod={onAddPaymentMethod}
        onSetDefaultMethod={onSetDefaultPaymentMethod}
        onDeletePaymentMethod={onDeletePaymentMethod}
      />

      <SubscriptionPlansModal
        isOpen={isPlansModalOpen}
        onClose={() => setIsPlansModalOpen(false)}
        paymentMethods={paymentMethods}
        subscription={subscription}
        onAddPaymentMethod={onAddPaymentMethod}
        onActivateSubscription={onActivateSubscription}
        onUpdateSubscription={onUpdateSubscription}
        lgpdAccepted={lgpdAccepted}
        onOpenLegal={onOpenLegal}
        onAcceptLgpd={onAcceptLgpd}
      />

      <PushNotificationsModal
        isOpen={isPushModalOpen}
        onClose={() => setIsPushModalOpen(false)}
        streak={streak}
        dailyActivity={dailyActivity}
        pushPrefs={pushPrefs}
        onEnablePush={onEnablePush}
        onUpdateReminderHour={onUpdateReminderHour}
        onDisablePush={onDisablePush}
        onSendTestPush={onSendTestPush}
      />
    </div>
  );
};
