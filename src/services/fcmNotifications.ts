import { getMessaging, getToken, isSupported, MessagePayload, onMessage } from 'firebase/messaging';
import { app } from '../firebase';
import { DailyActivityRecord, PushNotificationPrefs } from '../types';
import { getLocalDateKey } from '../utils/activityStats';

const DEVICE_ID_STORAGE_KEY = 'purpose_talk_push_device_id_v1';
export const PUSH_PREFS_STORAGE_KEY = 'purpose_talk_push_prefs_v1';

export function getOrCreatePushDeviceId(): string {
  const existing = localStorage.getItem(DEVICE_ID_STORAGE_KEY);
  if (existing && /^[a-zA-Z0-9_-]{4,64}$/.test(existing)) {
    return existing;
  }
  const generated = `browser_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  localStorage.setItem(DEVICE_ID_STORAGE_KEY, generated);
  return generated;
}

export interface StreakRiskAssessment {
  todayKey: string;
  streak: number;
  practicedToday: boolean;
  todayActivities: number;
  isAtRisk: boolean;
  urgency: 'safe' | 'gentle' | 'urgent';
  reasonPt: string;
}

export function evaluateStreakRisk(
  streak: number,
  dailyActivity: Record<string, DailyActivityRecord>,
  reminderHour = 19,
  nowDate = new Date()
): StreakRiskAssessment {
  const todayKey = getLocalDateKey(nowDate);
  const todayRec = dailyActivity[todayKey];
  const todayActivities = todayRec?.activitiesCount || 0;
  const practicedToday = todayActivities > 0;
  const currentHour = nowDate.getHours();

  if (practicedToday) {
    return {
      todayKey,
      streak,
      practicedToday: true,
      todayActivities,
      isAtRisk: false,
      urgency: 'safe',
      reasonPt: `Você já completou ${todayActivities} ${
        todayActivities === 1 ? 'atividade' : 'atividades'
      } hoje. Sua ofensiva de ${streak}d está protegida!`,
    };
  }

  if (streak <= 0) {
    return {
      todayKey,
      streak,
      practicedToday: false,
      todayActivities: 0,
      isAtRisk: false,
      urgency: 'gentle',
      reasonPt: 'Pratique 1 diálogo ou quiz hoje para iniciar sua nova sequência diária.',
    };
  }

  const isUrgent = currentHour >= Math.max(18, reminderHour);
  return {
    todayKey,
    streak,
    practicedToday: false,
    todayActivities: 0,
    isAtRisk: true,
    urgency: isUrgent ? 'urgent' : 'gentle',
    reasonPt: isUrgent
      ? `Alerta: faltam poucas horas para meia-noite e você ainda não praticou hoje! Proteja sua ofensiva de ${streak} dias.`
      : `Sua ofensiva de ${streak} dias ainda aguarda sua prática de hoje.`,
  };
}

export async function isPushEnvironmentSupported(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return false;
  try {
    return await isSupported();
  } catch {
    return false;
  }
}

export async function registerMessagingServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/firebase-cloud-messaging-push-scope',
    });
    return registration;
  } catch (err) {
    console.warn('Não foi possível registrar firebase-messaging-sw.js:', err);
    return null;
  }
}

export interface RegisterFcmResult {
  permission: NotificationPermission;
  fcmToken: string;
  usedVapidKey: boolean;
  registration: ServiceWorkerRegistration | null;
}

export async function requestPermissionAndRegisterFcm(): Promise<RegisterFcmResult> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    throw new Error('Este navegador não suporta notificações Web Push.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error(
      permission === 'denied'
        ? 'As notificações estão bloqueadas nas configurações do navegador. Libere o acesso para ativar lembretes.'
        : 'Permissão de notificação não concedida.'
    );
  }

  const registration = await registerMessagingServiceWorker();
  const vapidKey = (import.meta as any).env?.VITE_FIREBASE_VAPID_KEY as string | undefined;

  let fcmToken = `browser_sw_${getOrCreatePushDeviceId()}`;
  let usedVapidKey = false;

  const fcmSupported = await isPushEnvironmentSupported();
  if (fcmSupported && registration && vapidKey && vapidKey.trim().length > 10) {
    try {
      const messaging = getMessaging(app);
      const token = await getToken(messaging, {
        vapidKey: vapidKey.trim(),
        serviceWorkerRegistration: registration,
      });
      if (token) {
        fcmToken = token;
        usedVapidKey = true;
      }
    } catch (err) {
      console.warn('Fallback para Service Worker local após erro no getToken FCM:', err);
    }
  }

  return {
    permission,
    fcmToken,
    usedVapidKey,
    registration,
  };
}

export async function showBrowserStreakNotification(opts: {
  title: string;
  body: string;
  tag?: string;
}): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  try {
    const registration =
      (await registerMessagingServiceWorker()) ||
      ('serviceWorker' in navigator ? await navigator.serviceWorker.ready.catch(() => null) : null);
    if (registration && 'showNotification' in registration) {
      await registration.showNotification(opts.title, {
        body: opts.body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: opts.tag || 'purpose-talk-streak-reminder',
        requireInteraction: false,
        data: { url: '/?source=pwa' },
      });
      return true;
    }
  } catch {
    // Fallback to Notification constructor below
  }

  try {
    new Notification(opts.title, {
      body: opts.body,
      tag: opts.tag || 'purpose-talk-streak-reminder',
    });
    return true;
  } catch {
    return false;
  }
}

export async function subscribeForegroundFcmMessages(
  onReceive: (payload: { title: string; body: string }) => void
): Promise<() => void> {
  const supported = await isPushEnvironmentSupported();
  if (!supported) return () => {};

  try {
    const messaging = getMessaging(app);
    return onMessage(messaging, (payload: MessagePayload) => {
      const title =
        payload.notification?.title ||
        (payload.data?.title as string | undefined) ||
        'Purpose Talk · Lembrete de Streak';
      const body =
        payload.notification?.body ||
        (payload.data?.body as string | undefined) ||
        'Sua ofensiva diária de inglês está esperando você!';

      onReceive({ title, body });
    });
  } catch {
    return () => {};
  }
}

export function buildDefaultPushPrefs(
  uid: string,
  streakAtRisk: boolean,
  todayKey: string
): PushNotificationPrefs {
  const permissionStatus: 'default' | 'granted' | 'denied' =
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'default';

  return {
    uid,
    deviceId: getOrCreatePushDeviceId(),
    fcmToken: `browser_sw_${getOrCreatePushDeviceId()}`,
    permissionStatus,
    enabled: false,
    reminderHour: 19,
    streakAtRisk,
    lastPracticedDate: streakAtRisk ? undefined : todayKey,
    updatedAt: Date.now(),
  };
}
