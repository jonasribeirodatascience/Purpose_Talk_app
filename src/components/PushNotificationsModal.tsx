import React, { useEffect, useState } from 'react';
import {
  X,
  Bell,
  BellRing,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Trash2,
  Copy,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { DailyActivityRecord, PushNotificationPrefs } from '../types';
import { evaluateStreakRisk } from '../services/fcmNotifications';

interface PushNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  streak: number;
  dailyActivity: Record<string, DailyActivityRecord>;
  pushPrefs: PushNotificationPrefs | null;
  onEnablePush: (reminderHour: number) => Promise<void>;
  onUpdateReminderHour: (reminderHour: number) => Promise<void>;
  onDisablePush: () => Promise<void>;
  onSendTestPush: () => Promise<{ mode: string; title: string; body: string }>;
}

interface NotificationServerConfig {
  vapidConfigured: boolean;
  serverPushConfigured: boolean;
}

export const PushNotificationsModal: React.FC<PushNotificationsModalProps> = ({
  isOpen,
  onClose,
  streak,
  dailyActivity,
  pushPrefs,
  onEnablePush,
  onUpdateReminderHour,
  onDisablePush,
  onSendTestPush,
}) => {
  const [selectedHour, setSelectedHour] = useState<number>(pushPrefs?.reminderHour ?? 19);
  const [serverConfig, setServerConfig] = useState<NotificationServerConfig | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedHour(pushPrefs?.reminderHour ?? 19);
    setFeedbackMsg(null);
    setErrorMsg(null);

    fetch('/api/notifications/config')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setServerConfig(data);
      })
      .catch(() => {
        // Silent fallback
      });
  }, [isOpen, pushPrefs?.reminderHour]);

  if (!isOpen) return null;

  const browserSupported =
    typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
  const browserPermission: NotificationPermission = browserSupported
    ? Notification.permission
    : 'denied';

  const risk = evaluateStreakRisk(streak, dailyActivity, selectedHour);
  const isEnabled = Boolean(pushPrefs?.enabled && browserPermission === 'granted');
  const hasRealFcmToken = Boolean(
    pushPrefs?.fcmToken && !pushPrefs.fcmToken.startsWith('browser_sw_')
  );

  const handleEnableClick = async () => {
    setErrorMsg(null);
    setFeedbackMsg(null);
    setIsBusy(true);
    try {
      await onEnablePush(selectedHour);
      setFeedbackMsg(
        'Notificações push ativadas! Avisaremos caso sua sequência diária esteja em risco.'
      );
    } catch (err: any) {
      setErrorMsg(err?.message || 'Não foi possível ativar as notificações push.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleHourChange = async (hour: number) => {
    setSelectedHour(hour);
    setErrorMsg(null);
    if (pushPrefs?.enabled) {
      try {
        await onUpdateReminderHour(hour);
        setFeedbackMsg(`Horário do lembrete atualizado para ${String(hour).padStart(2, '0')}:00.`);
      } catch (err: any) {
        setErrorMsg(err?.message || 'Erro ao atualizar horário do lembrete.');
      }
    }
  };

  const handleTestClick = async () => {
    setErrorMsg(null);
    setFeedbackMsg(null);
    setIsBusy(true);
    try {
      const result = await onSendTestPush();
      setFeedbackMsg(
        result.mode === 'fcm_server'
          ? `Push enviado via servidor FCM: "${result.title}"`
          : `Notificação de teste disparada no navegador: "${result.title}"`
      );
    } catch (err: any) {
      setErrorMsg(err?.message || 'Não foi possível enviar a notificação de teste.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleDisableClick = async () => {
    setErrorMsg(null);
    setFeedbackMsg(null);
    setIsBusy(true);
    try {
      await onDisablePush();
      setFeedbackMsg('Lembretes desativados neste navegador.');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao desativar lembretes.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleCopyToken = async () => {
    if (!pushPrefs?.fcmToken) return;
    try {
      await navigator.clipboard.writeText(pushPrefs.fcmToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    } catch {
      // Ignore clipboard error
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="push-modal-title"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              {isEnabled ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h2
                id="push-modal-title"
                className="text-base sm:text-lg font-extrabold text-white tracking-tight truncate"
              >
                Lembretes Push & Proteção de Streak (FCM)
              </h2>
              <p className="text-xs text-slate-400 truncate">
                Firebase Cloud Messaging · Alerta diário quando sua ofensiva estiver em risco
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar configurações de notificações push"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Streak Risk Monitor */}
          <div
            className={`rounded-xl border p-4 flex items-start gap-3 ${
              risk.isAtRisk
                ? 'bg-amber-950/40 border-amber-500/40'
                : 'bg-emerald-950/30 border-emerald-500/30'
            }`}
          >
            {risk.isAtRisk ? (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>
                    {risk.isAtRisk
                      ? `Streak em Risco Hoje (${streak} ${streak === 1 ? 'dia' : 'dias'})`
                      : `Ofensiva Atual: ${streak} ${streak === 1 ? 'dia' : 'dias'}`}
                  </span>
                </span>
                <span className="text-[11px] font-semibold text-slate-300 tabular-nums">
                  {risk.todayActivities} {risk.todayActivities === 1 ? 'atividade' : 'atividades'} hoje
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{risk.reasonPt}</p>
            </div>
          </div>

          {/* Browser Support & Permission Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1">
              <div className="text-slate-400 font-semibold">Permissão do Navegador</div>
              <div className="text-sm font-bold text-white">
                {!browserSupported
                  ? 'Navegador sem suporte Web Push'
                  : browserPermission === 'granted'
                  ? 'Concedida'
                  : browserPermission === 'denied'
                  ? 'Bloqueada pelo usuário'
                  : 'Pendente (aguardando aceite)'}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1">
              <div className="text-slate-400 font-semibold">Canal Firebase Cloud Messaging</div>
              <div className="text-sm font-bold text-white">
                {hasRealFcmToken
                  ? 'Token FCM Web Push Ativo'
                  : isEnabled
                  ? 'Service Worker Ativo (Modo Local)'
                  : 'Inativo neste navegador'}
              </div>
              {serverConfig && !serverConfig.vapidConfigured && (
                <div className="text-[11px] text-slate-400">
                  Adicione <code className="font-mono-code">VITE_FIREBASE_VAPID_KEY</code> para push remoto com navegador fechado.
                </div>
              )}
            </div>
          </div>

          {/* Reminder Hour Configuration */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <label
                  htmlFor="reminder-hour-select"
                  className="text-sm font-bold text-white flex items-center gap-1.5"
                >
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <span>Horário Preferido do Lembrete Diário</span>
                </label>
                <p className="text-xs text-slate-400">
                  Dispara automaticamente caso você ainda não tenha praticado até este horário.
                </p>
              </div>

              <select
                id="reminder-hour-select"
                value={selectedHour}
                onChange={(e) => handleHourChange(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {Array.from({ length: 16 }, (_, idx) => idx + 7).map((hour) => (
                  <option key={hour} value={hour}>
                    {String(hour).padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* FCM Token Readout when enabled */}
          {pushPrefs?.fcmToken && isEnabled && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Dispositivo Registrado ({pushPrefs.deviceId})</span>
                </div>
                <div className="text-xs font-mono-code text-slate-300 truncate mt-0.5">
                  {pushPrefs.fcmToken}
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyToken}
                title="Copiar token FCM"
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1 shrink-0 cursor-pointer"
              >
                {copiedToken ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-950/60 px-3.5 py-2.5 text-xs text-rose-200">
              {errorMsg}
            </div>
          )}

          {feedbackMsg && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/60 px-3.5 py-2.5 text-xs text-emerald-200">
              {feedbackMsg}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-800 bg-slate-950/70 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            {isEnabled && (
              <button
                type="button"
                onClick={handleDisableClick}
                disabled={isBusy}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Desativar neste navegador</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {isEnabled && (
              <button
                type="button"
                onClick={handleTestClick}
                disabled={isBusy}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-100 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 text-indigo-400" />
                <span>Testar Alerta Agora</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleEnableClick}
              disabled={isBusy || !browserSupported}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 transition shadow cursor-pointer"
            >
              <BellRing className="w-4 h-4" />
              <span>
                {isBusy
                  ? 'Configurando...'
                  : isEnabled
                  ? 'Sincronizar Token FCM'
                  : 'Ativar Notificações Push'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
