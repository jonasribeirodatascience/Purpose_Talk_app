import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { auth, db } from '../firebase';
import {
  AchievementBadge,
  CardBrand,
  DailyActivityRecord,
  LearningFocus,
  LgpdConsentRecord,
  PaymentGatewayId,
  PaymentMethodRecord,
  PaymentMethodType,
  PushNotificationPrefs,
  SubscriptionPlanId,
  SubscriptionStatus,
  ThemeMode,
  UserLevel,
  UserSubscriptionRecord,
  VocabularyItem,
} from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface CloudUserProgress {
  userLevel: UserLevel;
  focus: LearningFocus;
  xp: number;
  streak: number;
  isAudioMuted: boolean;
  speechRate: number;
  theme?: ThemeMode;
  displayName?: string;
}

export function toSafeDocId(raw: string, prefix = 'item'): string {
  const slug = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 72);

  // Add short deterministic hash to avoid collisions across punctuation differences
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash * 31 + raw.charCodeAt(i)) | 0;
  }
  const hashHex = Math.abs(hash).toString(36).slice(0, 8);
  const candidate = slug ? `${slug}_${hashHex}` : `${prefix}_${hashHex}`;
  return candidate.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
}

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function clampFloat(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Number(value.toFixed(2))));
}

function sanitizeLevel(level: string): UserLevel {
  if (level === 'beginner' || level === 'intermediate' || level === 'advanced') {
    return level;
  }
  return 'intermediate';
}

function sanitizeFocus(focus: string): LearningFocus {
  if (focus === 'worship' || focus === 'tech' || focus === 'mixed') {
    return focus;
  }
  return 'mixed';
}

function sanitizeCategory(category?: string): 'worship' | 'tech' | 'general' {
  if (category === 'worship' || category === 'tech' || category === 'general') {
    return category;
  }
  return 'general';
}

function sanitizeTheme(theme?: string): ThemeMode {
  return theme === 'light' ? 'light' : 'dark';
}

function sanitizePaymentType(type?: string): PaymentMethodType {
  if (type === 'debit_card' || type === 'pix') return type;
  return 'credit_card';
}

function sanitizeCardBrand(brand?: string, type?: PaymentMethodType): CardBrand {
  if (type === 'pix') return 'pix';
  if (
    brand === 'visa' ||
    brand === 'mastercard' ||
    brand === 'amex' ||
    brand === 'elo' ||
    brand === 'hipercard'
  ) {
    return brand;
  }
  return 'visa';
}

export async function bootstrapUserInFirestore(
  user: User,
  localState: CloudUserProgress,
  localVocab: VocabularyItem[],
  localAchievements: AchievementBadge[],
  localDailyActivity: Record<string, DailyActivityRecord> = {},
  localPaymentMethods: PaymentMethodRecord[] = [],
  localLgpdConsent: LgpdConsentRecord | null = null
): Promise<CloudUserProgress> {
  const uid = user.uid;
  const userPath = `users/${uid}`;
  const userRef = doc(db, 'users', uid);
  const privatePath = `users/${uid}/private/info`;
  const privateRef = doc(db, 'users', uid, 'private', 'info');

  let userSnap;
  try {
    userSnap = await getDoc(userRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, userPath);
  }

  let resolvedState: CloudUserProgress = { ...localState };

  if (!userSnap.exists()) {
    const initialPayload = {
      uid,
      displayName: (user.displayName || 'Aluno Purpose Talk').trim().slice(0, 120),
      userLevel: sanitizeLevel(localState.userLevel),
      focus: sanitizeFocus(localState.focus),
      xp: clampInt(localState.xp, 0, 50000),
      streak: clampInt(localState.streak, 0, 365),
      isAudioMuted: Boolean(localState.isAudioMuted),
      speechRate: clampFloat(localState.speechRate, 0.5, 2.0),
      theme: sanitizeTheme(localState.theme),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(userRef, initialPayload);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, userPath);
    }

    // Create private PII record after parent doc exists
    const privatePayload: Record<string, unknown> = {
      uid,
      email: (user.email || 'unknown@example.com').trim().slice(0, 254),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (user.photoURL && user.photoURL.startsWith('https://')) {
      privatePayload.photoURL = user.photoURL.slice(0, 500);
    }

    try {
      await setDoc(privateRef, privatePayload);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, privatePath);
    }

    // Seed initial vocabulary if empty
    for (const item of localVocab.slice(0, 30)) {
      await saveVocabularyToCloud(uid, item);
    }

    // Seed achievements
    for (const badge of localAchievements) {
      await syncAchievementToCloud(uid, badge);
    }

    // Seed recent daily activity
    for (const rec of Object.values(localDailyActivity).slice(-30)) {
      await syncDailyActivityToCloud(uid, rec);
    }

    // Seed saved masked payment methods
    for (const method of localPaymentMethods.slice(0, 10)) {
      await savePaymentMethodToCloud(uid, method);
    }

    // Seed LGPD consent if user already accepted locally before signing in
    if (localLgpdConsent && localLgpdConsent.acceptedTerms && localLgpdConsent.acceptedPrivacy) {
      await saveLgpdConsentToCloud(uid, {
        ...localLgpdConsent,
        uid,
        userEmail: user.email || localLgpdConsent.userEmail,
      });
    }
  } else {
    const data = userSnap.data();
    const cloudXp = typeof data.xp === 'number' ? data.xp : 0;
    const cloudStreak = typeof data.streak === 'number' ? data.streak : 0;

    const cloudTheme: ThemeMode | undefined =
      data.theme === 'dark' || data.theme === 'light' ? data.theme : undefined;
    const localTheme = sanitizeTheme(localState.theme);
    const resolvedTheme: ThemeMode = cloudTheme ?? localTheme;

    resolvedState = {
      displayName: typeof data.displayName === 'string' ? data.displayName : user.displayName || '',
      userLevel: sanitizeLevel(String(data.userLevel || localState.userLevel)),
      focus: sanitizeFocus(String(data.focus || localState.focus)),
      xp: Math.min(500000, Math.max(cloudXp, clampInt(localState.xp, 0, cloudXp + 10000))),
      streak: Math.min(3650, Math.max(cloudStreak, clampInt(localState.streak, 0, cloudStreak + 30))),
      isAudioMuted: typeof data.isAudioMuted === 'boolean' ? data.isAudioMuted : localState.isAudioMuted,
      speechRate:
        typeof data.speechRate === 'number'
          ? clampFloat(data.speechRate, 0.5, 2.0)
          : clampFloat(localState.speechRate, 0.5, 2.0),
      theme: resolvedTheme,
    };

    // Sync merged XP/streak or missing theme field back to Firestore
    if (resolvedState.xp > cloudXp || resolvedState.streak > cloudStreak || !cloudTheme) {
      try {
        await updateDoc(userRef, {
          xp: resolvedState.xp,
          streak: resolvedState.streak,
          theme: resolvedTheme,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, userPath);
      }
    }

    // Ensure private PII doc exists and stays up to date
    try {
      const privateSnap = await getDoc(privateRef);
      if (!privateSnap.exists()) {
        const privatePayload: Record<string, unknown> = {
          uid,
          email: (user.email || 'unknown@example.com').trim().slice(0, 254),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        if (user.photoURL && user.photoURL.startsWith('https://')) {
          privatePayload.photoURL = user.photoURL.slice(0, 500);
        }
        await setDoc(privateRef, privatePayload);
      } else {
        const updatePrivate: Record<string, unknown> = {
          email: (user.email || 'unknown@example.com').trim().slice(0, 254),
          updatedAt: serverTimestamp(),
        };
        if (user.photoURL && user.photoURL.startsWith('https://')) {
          updatePrivate.photoURL = user.photoURL.slice(0, 500);
        }
        await updateDoc(privateRef, updatePrivate);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, privatePath);
    }

    // Backfill vocabulary if user's cloud notebook has no entries yet
    try {
      const vocabColPath = `users/${uid}/vocabulary`;
      const vocabSnap = await getDocs(
        query(collection(db, vocabColPath), where('uid', '==', uid))
      );
      if (vocabSnap.empty && localVocab.length > 0) {
        for (const item of localVocab.slice(0, 30)) {
          await saveVocabularyToCloud(uid, item);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `users/${uid}/vocabulary`);
    }
    // Backfill payment methods if cloud has none yet
    try {
      const pmColPath = `users/${uid}/paymentMethods`;
      const pmSnap = await getDocs(query(collection(db, pmColPath), where('uid', '==', uid)));
      if (pmSnap.empty && localPaymentMethods.length > 0) {
        for (const method of localPaymentMethods.slice(0, 10)) {
          await savePaymentMethodToCloud(uid, method);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `users/${uid}/paymentMethods`);
    }

    // Backfill LGPD consent if accepted locally and not yet saved to cloud
    if (localLgpdConsent && localLgpdConsent.acceptedTerms && localLgpdConsent.acceptedPrivacy) {
      try {
        const consentSnap = await getDoc(doc(db, 'lgpdConsents', uid));
        if (!consentSnap.exists()) {
          await saveLgpdConsentToCloud(uid, {
            ...localLgpdConsent,
            uid,
            userEmail: user.email || localLgpdConsent.userEmail,
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `lgpdConsents/${uid}`);
      }
    }
  }

  return resolvedState;
}

export async function updateCloudUserProgress(
  uid: string,
  progress: CloudUserProgress
): Promise<void> {
  const userPath = `users/${uid}`;
  const userRef = doc(db, 'users', uid);

  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) return;
    const existingData = snap.data();
    const existingXp = typeof existingData.xp === 'number' ? existingData.xp : 0;
    const existingStreak = typeof existingData.streak === 'number' ? existingData.streak : 0;

    await updateDoc(userRef, {
      displayName: (progress.displayName || existingData.displayName || 'Aluno Purpose Talk')
        .trim()
        .slice(0, 120),
      userLevel: sanitizeLevel(progress.userLevel),
      focus: sanitizeFocus(progress.focus),
      xp: Math.min(500000, Math.max(existingXp, clampInt(progress.xp, existingXp, existingXp + 10000))),
      streak: Math.min(3650, clampInt(progress.streak, 0, existingStreak + 30)),
      isAudioMuted: Boolean(progress.isAudioMuted),
      speechRate: clampFloat(progress.speechRate, 0.5, 2.0),
      theme: sanitizeTheme(
        progress.theme ?? (typeof existingData.theme === 'string' ? existingData.theme : 'dark')
      ),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, userPath);
  }
}

export async function saveVocabularyToCloud(
  uid: string,
  item: VocabularyItem
): Promise<void> {
  const term = item.term.trim().slice(0, 120);
  const meaning = item.meaning.trim().slice(0, 300);
  const example = (item.example || `Example with ${term}`).trim().slice(0, 500);
  if (!term || !meaning) return;

  const wordId = toSafeDocId(term, 'word');
  const wordPath = `users/${uid}/vocabulary/${wordId}`;
  const wordRef = doc(db, 'users', uid, 'vocabulary', wordId);

  try {
    const existingSnap = await getDoc(wordRef);
    const baseFields: Record<string, unknown> = {
      term,
      meaning,
      example,
      category: sanitizeCategory(item.category),
      updatedAt: serverTimestamp(),
    };
    if (item.phonetic && item.phonetic.trim()) {
      baseFields.phonetic = item.phonetic.trim().slice(0, 120);
    }
    if (typeof item.srsRepetitions === 'number') {
      baseFields.srsRepetitions = clampInt(item.srsRepetitions, 0, 10000);
    }
    if (typeof item.srsIntervalDays === 'number') {
      baseFields.srsIntervalDays = clampInt(item.srsIntervalDays, 0, 3650);
    }
    if (typeof item.srsEaseFactor === 'number') {
      baseFields.srsEaseFactor = clampFloat(item.srsEaseFactor, 1.3, 4.0);
    }
    if (typeof item.srsLapses === 'number') {
      baseFields.srsLapses = clampInt(item.srsLapses, 0, 10000);
    }
    if (typeof item.srsNextReviewAt === 'number') {
      baseFields.srsNextReviewAt = clampInt(item.srsNextReviewAt, 0, 9999999999999);
    }
    if (typeof item.srsLastReviewedAt === 'number') {
      baseFields.srsLastReviewedAt = clampInt(item.srsLastReviewedAt, 0, 9999999999999);
    }

    if (!existingSnap.exists()) {
      await setDoc(wordRef, {
        uid,
        ...baseFields,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(wordRef, baseFields);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, wordPath);
  }
}

export async function updateVocabularySrsInCloud(
  uid: string,
  item: VocabularyItem
): Promise<void> {
  const term = item.term.trim().slice(0, 120);
  if (!term) return;

  const wordId = toSafeDocId(term, 'word');
  const wordPath = `users/${uid}/vocabulary/${wordId}`;
  const wordRef = doc(db, 'users', uid, 'vocabulary', wordId);

  try {
    const existingSnap = await getDoc(wordRef);
    if (!existingSnap.exists()) {
      await saveVocabularyToCloud(uid, item);
      return;
    }

    const srsPatch: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };
    if (typeof item.srsRepetitions === 'number') {
      srsPatch.srsRepetitions = clampInt(item.srsRepetitions, 0, 10000);
    }
    if (typeof item.srsIntervalDays === 'number') {
      srsPatch.srsIntervalDays = clampInt(item.srsIntervalDays, 0, 3650);
    }
    if (typeof item.srsEaseFactor === 'number') {
      srsPatch.srsEaseFactor = clampFloat(item.srsEaseFactor, 1.3, 4.0);
    }
    if (typeof item.srsLapses === 'number') {
      srsPatch.srsLapses = clampInt(item.srsLapses, 0, 10000);
    }
    if (typeof item.srsNextReviewAt === 'number') {
      srsPatch.srsNextReviewAt = clampInt(item.srsNextReviewAt, 0, 9999999999999);
    }
    if (typeof item.srsLastReviewedAt === 'number') {
      srsPatch.srsLastReviewedAt = clampInt(item.srsLastReviewedAt, 0, 9999999999999);
    }

    await updateDoc(wordRef, srsPatch);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, wordPath);
  }
}

export async function deleteVocabularyFromCloud(
  uid: string,
  term: string
): Promise<void> {
  const wordId = toSafeDocId(term, 'word');
  const wordPath = `users/${uid}/vocabulary/${wordId}`;
  const wordRef = doc(db, 'users', uid, 'vocabulary', wordId);

  try {
    await deleteDoc(wordRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, wordPath);
  }
}

export async function syncAchievementToCloud(
  uid: string,
  badge: AchievementBadge
): Promise<void> {
  const safeBadgeId = badge.id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
  if (!safeBadgeId) return;

  const badgePath = `users/${uid}/achievements/${safeBadgeId}`;
  const badgeRef = doc(db, 'users', uid, 'achievements', safeBadgeId);

  try {
    const existingSnap = await getDoc(badgeRef);
    const clampedProgress = clampInt(badge.currentProgress, 0, 100000);

    if (!existingSnap.exists()) {
      const payload: Record<string, unknown> = {
        uid,
        badgeId: safeBadgeId,
        currentProgress: clampedProgress,
        isUnlocked: Boolean(badge.isUnlocked),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (badge.isUnlocked) {
        payload.unlockedAt = clampInt(badge.unlockedAt || Date.now(), 0, 9999999999999);
      }
      await setDoc(badgeRef, payload);
    } else {
      const prev = existingSnap.data();
      const wasUnlocked = Boolean(prev.isUnlocked);
      const prevProgress = typeof prev.currentProgress === 'number' ? prev.currentProgress : 0;

      if (wasUnlocked) {
        // Respect terminal state lock: never un-unlock or touch unlockedAt
        if (clampedProgress > prevProgress) {
          await updateDoc(badgeRef, {
            currentProgress: clampedProgress,
            updatedAt: serverTimestamp(),
          });
        }
      } else {
        const nextUnlocked = Boolean(badge.isUnlocked);
        const updatePayload: Record<string, unknown> = {
          currentProgress: Math.max(prevProgress, clampedProgress),
          isUnlocked: nextUnlocked,
          updatedAt: serverTimestamp(),
        };
        if (nextUnlocked) {
          updatePayload.unlockedAt = clampInt(badge.unlockedAt || Date.now(), 0, 9999999999999);
        }
        await updateDoc(badgeRef, updatePayload);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, badgePath);
  }
}

export async function savePronunciationLogToCloud(
  uid: string,
  targetText: string,
  spokenText: string,
  accuracyScore: number
): Promise<void> {
  const logId = `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const logPath = `users/${uid}/pronunciationLogs/${logId}`;
  const logRef = doc(db, 'users', uid, 'pronunciationLogs', logId);

  try {
    await setDoc(logRef, {
      uid,
      targetText: targetText.trim().slice(0, 500) || '(free speech)',
      spokenText: spokenText.trim().slice(0, 500) || '(audio)',
      accuracyScore: clampInt(accuracyScore, 0, 100),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, logPath);
  }
}

export async function syncDailyActivityToCloud(
  uid: string,
  record: DailyActivityRecord
): Promise<void> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(record.date)) return;
  const path = `users/${uid}/dailyActivity/${record.date}`;
  const ref = doc(db, 'users', uid, 'dailyActivity', record.date);

  const xpEarned = clampInt(record.xpEarned, 0, 50000);
  const activitiesCount = clampInt(record.activitiesCount, 0, 5000);
  const wordsSaved = clampInt(record.wordsSaved, 0, 5000);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid,
        date: record.date,
        xpEarned,
        activitiesCount,
        wordsSaved,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const prev = snap.data();
      const prevXp = typeof prev.xpEarned === 'number' ? prev.xpEarned : 0;
      const prevAct = typeof prev.activitiesCount === 'number' ? prev.activitiesCount : 0;
      const prevWords = typeof prev.wordsSaved === 'number' ? prev.wordsSaved : 0;

      await updateDoc(ref, {
        xpEarned: Math.max(prevXp, xpEarned),
        activitiesCount: Math.max(prevAct, activitiesCount),
        wordsSaved: Math.max(prevWords, wordsSaved),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function savePaymentMethodToCloud(
  uid: string,
  method: PaymentMethodRecord
): Promise<void> {
  const safeId = method.id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
  if (!safeId) return;

  const pmPath = `users/${uid}/paymentMethods/${safeId}`;
  const pmRef = doc(db, 'users', uid, 'paymentMethods', safeId);

  const safeType = sanitizePaymentType(method.type);
  const safeBrand = sanitizeCardBrand(method.brand, safeType);
  const holderName = method.holderName.trim().slice(0, 80) || 'Titular';
  const label = method.label.trim().slice(0, 80) || 'Forma de pagamento';

  const payload: Record<string, unknown> = {
    uid,
    type: safeType,
    label,
    holderName,
    brand: safeBrand,
    isDefault: Boolean(method.isDefault),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (safeType === 'pix') {
    payload.pixKeyMasked = (method.pixKeyMasked || '***').trim().slice(0, 80);
  } else {
    const cleanLast4 = (method.last4 || '0000').replace(/\D/g, '').slice(-4).padStart(4, '0');
    payload.last4 = cleanLast4;
    payload.expiryMonth = clampInt(method.expiryMonth ?? 12, 1, 12);
    payload.expiryYear = clampInt(method.expiryYear ?? 2029, 2025, 2050);
  }

  try {
    if (method.isDefault) {
      const existingSnap = await getDocs(
        query(collection(db, `users/${uid}/paymentMethods`), where('uid', '==', uid))
      );
      const batch = writeBatch(db);
      existingSnap.docs.forEach((docSnap) => {
        if (docSnap.id !== safeId && docSnap.data().isDefault === true) {
          batch.update(docSnap.ref, { isDefault: false, updatedAt: serverTimestamp() });
        }
      });
      batch.set(pmRef, payload);
      await batch.commit();
    } else {
      await setDoc(pmRef, payload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, pmPath);
  }
}

export async function setDefaultPaymentMethodInCloud(
  uid: string,
  targetMethodId: string
): Promise<void> {
  const safeId = targetMethodId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
  if (!safeId) return;
  const colPath = `users/${uid}/paymentMethods`;

  try {
    const snap = await getDocs(query(collection(db, colPath), where('uid', '==', uid)));
    const batch = writeBatch(db);
    snap.docs.forEach((docSnap) => {
      const shouldBeDefault = docSnap.id === safeId;
      if (Boolean(docSnap.data().isDefault) !== shouldBeDefault) {
        batch.update(docSnap.ref, {
          isDefault: shouldBeDefault,
          updatedAt: serverTimestamp(),
        });
      }
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${colPath}/${safeId}`);
  }
}

export async function deletePaymentMethodFromCloud(
  uid: string,
  methodId: string
): Promise<void> {
  const safeId = methodId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
  if (!safeId) return;
  const pmPath = `users/${uid}/paymentMethods/${safeId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'paymentMethods', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, pmPath);
  }
}

function sanitizePlanId(planId?: string): SubscriptionPlanId {
  if (planId === 'essencial_mensal' || planId === 'pro_anual') return planId;
  return 'pro_mensal';
}

function sanitizeSubscriptionStatus(status?: string): SubscriptionStatus {
  if (status === 'active' || status === 'past_due' || status === 'canceled') return status;
  return 'trialing';
}

function sanitizeGateway(gw?: string): PaymentGatewayId {
  return gw === 'stripe' ? 'stripe' : 'mercadopago';
}

export async function saveSubscriptionToCloud(
  uid: string,
  sub: UserSubscriptionRecord
): Promise<void> {
  const subPath = `subscriptions/${uid}`;
  const subRef = doc(db, 'subscriptions', uid);

  const planId = sanitizePlanId(sub.planId);
  const priceBrlCents =
    planId === 'essencial_mensal' ? 3990 : planId === 'pro_anual' ? 47880 : 5990;
  const billingCycle = planId === 'pro_anual' ? 'annual' : 'monthly';
  const safePaymentMethodId = sub.paymentMethodId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
  if (!safePaymentMethodId) return;

  try {
    const existingSnap = await getDoc(subRef);
    const payload: Record<string, unknown> = {
      uid,
      userEmail: (sub.userEmail || 'unknown@example.com').trim().slice(0, 254),
      userName: (sub.userName || 'Aluno Purpose Talk').trim().slice(0, 120),
      planId,
      planName: sub.planName.trim().slice(0, 80),
      priceBrlCents,
      billingCycle,
      status: sanitizeSubscriptionStatus(sub.status),
      gateway: sanitizeGateway(sub.gateway),
      paymentMethodId: safePaymentMethodId,
      paymentMethodLabel: sub.paymentMethodLabel.trim().slice(0, 80),
      trialDays: 7,
      trialStartedAt: clampInt(sub.trialStartedAt, 1, 9999999999999),
      trialEndsAt: clampInt(sub.trialEndsAt, sub.trialStartedAt, 9999999999999),
      nextBillingAt: clampInt(sub.nextBillingAt, sub.trialStartedAt, 9999999999999),
      cancelAtPeriodEnd: Boolean(sub.cancelAtPeriodEnd),
      updatedAt: serverTimestamp(),
    };
    if (sub.gatewaySubscriptionId) {
      payload.gatewaySubscriptionId = sub.gatewaySubscriptionId.trim().slice(0, 128);
    }

    if (!existingSnap.exists()) {
      await setDoc(subRef, {
        ...payload,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(subRef, {
        planId,
        planName: payload.planName,
        priceBrlCents,
        billingCycle,
        paymentMethodId: safePaymentMethodId,
        paymentMethodLabel: payload.paymentMethodLabel,
        cancelAtPeriodEnd: Boolean(sub.cancelAtPeriodEnd),
        status: existingSnap.data().status === 'active' ? 'active' : 'trialing',
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, subPath);
  }
}

export async function updateSubscriptionInCloud(
  uid: string,
  patch: Partial<Pick<UserSubscriptionRecord, 'status' | 'cancelAtPeriodEnd' | 'planId' | 'planName' | 'priceBrlCents' | 'billingCycle'>>
): Promise<void> {
  const subPath = `subscriptions/${uid}`;
  const subRef = doc(db, 'subscriptions', uid);
  try {
    const updatePayload: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };
    if (typeof patch.cancelAtPeriodEnd === 'boolean') {
      updatePayload.cancelAtPeriodEnd = patch.cancelAtPeriodEnd;
    }
    if (patch.status) {
      updatePayload.status = sanitizeSubscriptionStatus(patch.status);
    }
    if (patch.planId) {
      const safePlanId = sanitizePlanId(patch.planId);
      updatePayload.planId = safePlanId;
      updatePayload.planName = (patch.planName || safePlanId).slice(0, 80);
      updatePayload.priceBrlCents =
        safePlanId === 'essencial_mensal' ? 3990 : safePlanId === 'pro_anual' ? 47880 : 5990;
      updatePayload.billingCycle = safePlanId === 'pro_anual' ? 'annual' : 'monthly';
    }
    await updateDoc(subRef, updatePayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, subPath);
  }
}

export async function saveLgpdConsentToCloud(
  uid: string,
  consent: LgpdConsentRecord
): Promise<void> {
  const consentPath = `lgpdConsents/${uid}`;
  const consentRef = doc(db, 'lgpdConsents', uid);

  const termsVersion = (consent.termsVersion || '2026.1').trim().slice(0, 20) || '2026.1';
  const privacyVersion = (consent.privacyVersion || '2026.1').trim().slice(0, 20) || '2026.1';
  const acceptedAt = clampInt(consent.acceptedAt || Date.now(), 1, 9999999999999);

  try {
    const existingSnap = await getDoc(consentRef);
    const payload: Record<string, unknown> = {
      uid,
      acceptedTerms: Boolean(consent.acceptedTerms),
      acceptedPrivacy: Boolean(consent.acceptedPrivacy),
      marketingOptIn: Boolean(consent.marketingOptIn),
      termsVersion,
      privacyVersion,
      acceptedAt,
      updatedAt: serverTimestamp(),
    };

    if (consent.userEmail && consent.userEmail.trim().length >= 3) {
      payload.userEmail = consent.userEmail.trim().slice(0, 254);
    }

    if (!existingSnap.exists()) {
      if (!consent.acceptedTerms || !consent.acceptedPrivacy) return;
      if (consent.revokedAt && consent.revokedAt > 0) {
        payload.revokedAt = clampInt(consent.revokedAt, 1, 9999999999999);
      }
      await setDoc(consentRef, {
        ...payload,
        createdAt: serverTimestamp(),
      });
    } else {
      if (consent.revokedAt && consent.revokedAt > 0) {
        payload.revokedAt = clampInt(consent.revokedAt, 1, 9999999999999);
      } else {
        payload.revokedAt = deleteField();
      }
      await updateDoc(consentRef, payload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, consentPath);
  }
}

export async function savePushSubscriptionToCloud(
  uid: string,
  prefs: PushNotificationPrefs
): Promise<void> {
  const safeDeviceId = prefs.deviceId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
  if (!safeDeviceId) return;

  const pushPath = `users/${uid}/pushSubscriptions/${safeDeviceId}`;
  const pushRef = doc(db, 'users', uid, 'pushSubscriptions', safeDeviceId);

  const fcmToken = (prefs.fcmToken || 'browser_sw_local').trim().slice(0, 512);
  const permissionStatus =
    prefs.permissionStatus === 'granted' || prefs.permissionStatus === 'denied'
      ? prefs.permissionStatus
      : 'default';
  const reminderHour = clampInt(prefs.reminderHour ?? 19, 0, 23);

  try {
    const existingSnap = await getDoc(pushRef);
    const payload: Record<string, unknown> = {
      uid,
      deviceId: safeDeviceId,
      fcmToken: fcmToken.length >= 8 ? fcmToken : 'browser_sw_local',
      permissionStatus,
      enabled: Boolean(prefs.enabled),
      reminderHour,
      streakAtRisk: Boolean(prefs.streakAtRisk),
      updatedAt: serverTimestamp(),
    };

    if (prefs.lastPracticedDate && /^\d{4}-\d{2}-\d{2}$/.test(prefs.lastPracticedDate)) {
      payload.lastPracticedDate = prefs.lastPracticedDate;
    }
    if (prefs.lastNotifiedDate && /^\d{4}-\d{2}-\d{2}$/.test(prefs.lastNotifiedDate)) {
      payload.lastNotifiedDate = prefs.lastNotifiedDate;
    }

    if (!existingSnap.exists()) {
      await setDoc(pushRef, {
        ...payload,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(pushRef, {
        fcmToken: payload.fcmToken,
        permissionStatus,
        enabled: Boolean(prefs.enabled),
        reminderHour,
        streakAtRisk: Boolean(prefs.streakAtRisk),
        ...(payload.lastPracticedDate ? { lastPracticedDate: payload.lastPracticedDate } : {}),
        ...(payload.lastNotifiedDate ? { lastNotifiedDate: payload.lastNotifiedDate } : {}),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pushPath);
  }
}

export async function deletePushSubscriptionFromCloud(
  uid: string,
  deviceId: string
): Promise<void> {
  const safeDeviceId = deviceId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
  if (!safeDeviceId) return;
  const pushPath = `users/${uid}/pushSubscriptions/${safeDeviceId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'pushSubscriptions', safeDeviceId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, pushPath);
  }
}

export interface CreatorAdminUserRow {
  uid: string;
  displayName: string;
  userLevel: UserLevel;
  focus: LearningFocus;
  xp: number;
  streak: number;
  theme: ThemeMode;
  updatedAtMs: number;
}

export async function fetchCreatorDashboardSnapshot(): Promise<{
  users: CreatorAdminUserRow[];
  subscriptions: UserSubscriptionRecord[];
  lgpdConsents: LgpdConsentRecord[];
}> {
  let users: CreatorAdminUserRow[] = [];
  let subscriptions: UserSubscriptionRecord[] = [];
  let lgpdConsents: LgpdConsentRecord[] = [];

  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    users = usersSnap.docs.map((d) => {
      const data = d.data();
      const updatedMs =
        data.updatedAt && typeof data.updatedAt.toMillis === 'function'
          ? data.updatedAt.toMillis()
          : Date.now();
      return {
        uid: String(data.uid || d.id),
        displayName: String(data.displayName || 'Aluno'),
        userLevel: sanitizeLevel(String(data.userLevel || 'intermediate')),
        focus: sanitizeFocus(String(data.focus || 'mixed')),
        xp: typeof data.xp === 'number' ? data.xp : 0,
        streak: typeof data.streak === 'number' ? data.streak : 0,
        theme: sanitizeTheme(typeof data.theme === 'string' ? data.theme : 'dark'),
        updatedAtMs: updatedMs,
      };
    });
    users.sort((a, b) => b.xp - a.xp);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'users');
  }

  try {
    const subsSnap = await getDocs(collection(db, 'subscriptions'));
    subscriptions = subsSnap.docs.map((d) => {
      const data = d.data();
      const createdMs =
        data.createdAt && typeof data.createdAt.toMillis === 'function'
          ? data.createdAt.toMillis()
          : Date.now();
      const updatedMs =
        data.updatedAt && typeof data.updatedAt.toMillis === 'function'
          ? data.updatedAt.toMillis()
          : Date.now();
      return {
        uid: String(data.uid || d.id),
        userEmail: String(data.userEmail || ''),
        userName: String(data.userName || 'Aluno'),
        planId: sanitizePlanId(typeof data.planId === 'string' ? data.planId : undefined),
        planName: String(data.planName || 'Purpose Pro Mensal'),
        priceBrlCents: typeof data.priceBrlCents === 'number' ? data.priceBrlCents : 5990,
        billingCycle: data.billingCycle === 'annual' ? 'annual' : 'monthly',
        status: sanitizeSubscriptionStatus(typeof data.status === 'string' ? data.status : undefined),
        gateway: sanitizeGateway(typeof data.gateway === 'string' ? data.gateway : undefined),
        paymentMethodId: String(data.paymentMethodId || ''),
        paymentMethodLabel: String(data.paymentMethodLabel || 'Não informado'),
        trialDays: typeof data.trialDays === 'number' ? data.trialDays : 7,
        trialStartedAt: typeof data.trialStartedAt === 'number' ? data.trialStartedAt : createdMs,
        trialEndsAt: typeof data.trialEndsAt === 'number' ? data.trialEndsAt : createdMs + 7 * 86400000,
        nextBillingAt: typeof data.nextBillingAt === 'number' ? data.nextBillingAt : createdMs + 7 * 86400000,
        gatewaySubscriptionId: typeof data.gatewaySubscriptionId === 'string' ? data.gatewaySubscriptionId : undefined,
        cancelAtPeriodEnd: Boolean(data.cancelAtPeriodEnd),
        createdAt: createdMs,
        updatedAt: updatedMs,
      };
    });
    subscriptions.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'subscriptions');
  }

  try {
    const consentsSnap = await getDocs(collection(db, 'lgpdConsents'));
    lgpdConsents = consentsSnap.docs.map((d) => {
      const data = d.data();
      const updatedMs =
        data.updatedAt && typeof data.updatedAt.toMillis === 'function'
          ? data.updatedAt.toMillis()
          : Date.now();
      return {
        uid: String(data.uid || d.id),
        userEmail: typeof data.userEmail === 'string' ? data.userEmail : undefined,
        acceptedTerms: Boolean(data.acceptedTerms),
        acceptedPrivacy: Boolean(data.acceptedPrivacy),
        marketingOptIn: Boolean(data.marketingOptIn),
        termsVersion: String(data.termsVersion || '2026.1'),
        privacyVersion: String(data.privacyVersion || '2026.1'),
        acceptedAt: typeof data.acceptedAt === 'number' ? data.acceptedAt : updatedMs,
        updatedAt: updatedMs,
        revokedAt: typeof data.revokedAt === 'number' ? data.revokedAt : undefined,
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'lgpdConsents');
  }

  return { users, subscriptions, lgpdConsents };
}

export function subscribeToUserWorkspace(
  uid: string,
  callbacks: {
    onProgressUpdate: (progress: CloudUserProgress) => void;
    onVocabularyUpdate: (items: VocabularyItem[]) => void;
    onAchievementsUpdate: (
      records: Record<string, { currentProgress: number; isUnlocked: boolean; unlockedAt?: number }>
    ) => void;
    onDailyActivityUpdate?: (records: Record<string, DailyActivityRecord>) => void;
    onPaymentMethodsUpdate?: (methods: PaymentMethodRecord[]) => void;
    onSubscriptionUpdate?: (subscription: UserSubscriptionRecord | null) => void;
    onLgpdConsentUpdate?: (consent: LgpdConsentRecord | null) => void;
    onPushSubscriptionUpdate?: (prefs: PushNotificationPrefs | null) => void;
  }
): Unsubscribe {
  const userPath = `users/${uid}`;
  const unsubUser = onSnapshot(
    doc(db, 'users', uid),
    (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      callbacks.onProgressUpdate({
        displayName: typeof data.displayName === 'string' ? data.displayName : undefined,
        userLevel: sanitizeLevel(String(data.userLevel || 'intermediate')),
        focus: sanitizeFocus(String(data.focus || 'mixed')),
        xp: typeof data.xp === 'number' ? data.xp : 0,
        streak: typeof data.streak === 'number' ? data.streak : 0,
        isAudioMuted: Boolean(data.isAudioMuted),
        speechRate: typeof data.speechRate === 'number' ? data.speechRate : 0.95,
        theme: data.theme === 'dark' || data.theme === 'light' ? data.theme : undefined,
      });
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, userPath);
    }
  );

  const vocabPath = `users/${uid}/vocabulary`;
  const vocabQuery = query(collection(db, vocabPath), where('uid', '==', uid));
  const unsubVocab = onSnapshot(
    vocabQuery,
    (snap) => {
      const items: VocabularyItem[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          term: String(data.term || ''),
          phonetic: typeof data.phonetic === 'string' ? data.phonetic : undefined,
          meaning: String(data.meaning || ''),
          example: String(data.example || ''),
          category: sanitizeCategory(typeof data.category === 'string' ? data.category : undefined),
          srsRepetitions: typeof data.srsRepetitions === 'number' ? data.srsRepetitions : undefined,
          srsIntervalDays: typeof data.srsIntervalDays === 'number' ? data.srsIntervalDays : undefined,
          srsEaseFactor: typeof data.srsEaseFactor === 'number' ? data.srsEaseFactor : undefined,
          srsLapses: typeof data.srsLapses === 'number' ? data.srsLapses : undefined,
          srsNextReviewAt: typeof data.srsNextReviewAt === 'number' ? data.srsNextReviewAt : undefined,
          srsLastReviewedAt: typeof data.srsLastReviewedAt === 'number' ? data.srsLastReviewedAt : undefined,
        };
      });
      callbacks.onVocabularyUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, vocabPath);
    }
  );

  const achievementsPath = `users/${uid}/achievements`;
  const achievementsQuery = query(collection(db, achievementsPath), where('uid', '==', uid));
  const unsubAchievements = onSnapshot(
    achievementsQuery,
    (snap) => {
      const map: Record<string, { currentProgress: number; isUnlocked: boolean; unlockedAt?: number }> = {};
      snap.docs.forEach((d) => {
        const data = d.data();
        const badgeId = String(data.badgeId || d.id);
        map[badgeId] = {
          currentProgress: typeof data.currentProgress === 'number' ? data.currentProgress : 0,
          isUnlocked: Boolean(data.isUnlocked),
          unlockedAt: typeof data.unlockedAt === 'number' ? data.unlockedAt : undefined,
        };
      });
      callbacks.onAchievementsUpdate(map);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, achievementsPath);
    }
  );

  const activityPath = `users/${uid}/dailyActivity`;
  const activityQuery = query(collection(db, activityPath), where('uid', '==', uid));
  const unsubActivity = onSnapshot(
    activityQuery,
    (snap) => {
      if (!callbacks.onDailyActivityUpdate) return;
      const map: Record<string, DailyActivityRecord> = {};
      snap.docs.forEach((d) => {
        const data = d.data();
        const dateKey = String(data.date || d.id);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return;
        map[dateKey] = {
          date: dateKey,
          xpEarned: typeof data.xpEarned === 'number' ? data.xpEarned : 0,
          activitiesCount: typeof data.activitiesCount === 'number' ? data.activitiesCount : 0,
          wordsSaved: typeof data.wordsSaved === 'number' ? data.wordsSaved : 0,
        };
      });
      callbacks.onDailyActivityUpdate(map);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, activityPath);
    }
  );

  const paymentMethodsPath = `users/${uid}/paymentMethods`;
  const pmQuery = query(collection(db, paymentMethodsPath), where('uid', '==', uid));
  const unsubPaymentMethods = onSnapshot(
    pmQuery,
    (snap) => {
      if (!callbacks.onPaymentMethodsUpdate) return;
      const items: PaymentMethodRecord[] = snap.docs.map((d) => {
        const data = d.data();
        const type = sanitizePaymentType(typeof data.type === 'string' ? data.type : undefined);
        const brand = sanitizeCardBrand(typeof data.brand === 'string' ? data.brand : undefined, type);
        const createdTs = data.createdAt && typeof data.createdAt.toMillis === 'function'
          ? data.createdAt.toMillis()
          : Date.now();
        return {
          id: d.id,
          type,
          label: String(data.label || ''),
          holderName: String(data.holderName || ''),
          brand,
          last4: typeof data.last4 === 'string' ? data.last4 : undefined,
          expiryMonth: typeof data.expiryMonth === 'number' ? data.expiryMonth : undefined,
          expiryYear: typeof data.expiryYear === 'number' ? data.expiryYear : undefined,
          pixKeyMasked: typeof data.pixKeyMasked === 'string' ? data.pixKeyMasked : undefined,
          isDefault: Boolean(data.isDefault),
          createdAt: createdTs,
        };
      });
      items.sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || b.createdAt - a.createdAt);
      callbacks.onPaymentMethodsUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, paymentMethodsPath);
    }
  );

  const subPath = `subscriptions/${uid}`;
  const unsubSubscription = onSnapshot(
    doc(db, 'subscriptions', uid),
    (snap) => {
      if (!callbacks.onSubscriptionUpdate) return;
      if (!snap.exists()) {
        callbacks.onSubscriptionUpdate(null);
        return;
      }
      const data = snap.data();
      const createdMs =
        data.createdAt && typeof data.createdAt.toMillis === 'function'
          ? data.createdAt.toMillis()
          : Date.now();
      const updatedMs =
        data.updatedAt && typeof data.updatedAt.toMillis === 'function'
          ? data.updatedAt.toMillis()
          : Date.now();
      callbacks.onSubscriptionUpdate({
        uid: String(data.uid || snap.id),
        userEmail: String(data.userEmail || ''),
        userName: String(data.userName || 'Aluno'),
        planId: sanitizePlanId(typeof data.planId === 'string' ? data.planId : undefined),
        planName: String(data.planName || 'Purpose Pro Mensal'),
        priceBrlCents: typeof data.priceBrlCents === 'number' ? data.priceBrlCents : 5990,
        billingCycle: data.billingCycle === 'annual' ? 'annual' : 'monthly',
        status: sanitizeSubscriptionStatus(typeof data.status === 'string' ? data.status : undefined),
        gateway: sanitizeGateway(typeof data.gateway === 'string' ? data.gateway : undefined),
        paymentMethodId: String(data.paymentMethodId || ''),
        paymentMethodLabel: String(data.paymentMethodLabel || ''),
        trialDays: typeof data.trialDays === 'number' ? data.trialDays : 7,
        trialStartedAt: typeof data.trialStartedAt === 'number' ? data.trialStartedAt : createdMs,
        trialEndsAt: typeof data.trialEndsAt === 'number' ? data.trialEndsAt : createdMs + 7 * 86400000,
        nextBillingAt: typeof data.nextBillingAt === 'number' ? data.nextBillingAt : createdMs + 7 * 86400000,
        gatewaySubscriptionId: typeof data.gatewaySubscriptionId === 'string' ? data.gatewaySubscriptionId : undefined,
        cancelAtPeriodEnd: Boolean(data.cancelAtPeriodEnd),
        createdAt: createdMs,
        updatedAt: updatedMs,
      });
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, subPath);
    }
  );

  const lgpdPath = `lgpdConsents/${uid}`;
  const unsubLgpdConsent = onSnapshot(
    doc(db, 'lgpdConsents', uid),
    (snap) => {
      if (!callbacks.onLgpdConsentUpdate) return;
      if (!snap.exists()) {
        callbacks.onLgpdConsentUpdate(null);
        return;
      }
      const data = snap.data();
      const updatedMs =
        data.updatedAt && typeof data.updatedAt.toMillis === 'function'
          ? data.updatedAt.toMillis()
          : Date.now();
      callbacks.onLgpdConsentUpdate({
        uid: String(data.uid || snap.id),
        userEmail: typeof data.userEmail === 'string' ? data.userEmail : undefined,
        acceptedTerms: Boolean(data.acceptedTerms),
        acceptedPrivacy: Boolean(data.acceptedPrivacy),
        marketingOptIn: Boolean(data.marketingOptIn),
        termsVersion: String(data.termsVersion || '2026.1'),
        privacyVersion: String(data.privacyVersion || '2026.1'),
        acceptedAt: typeof data.acceptedAt === 'number' ? data.acceptedAt : updatedMs,
        updatedAt: updatedMs,
        revokedAt: typeof data.revokedAt === 'number' ? data.revokedAt : undefined,
      });
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, lgpdPath);
    }
  );

  const pushColPath = `users/${uid}/pushSubscriptions`;
  const pushQuery = query(collection(db, pushColPath), where('uid', '==', uid));
  const unsubPush = onSnapshot(
    pushQuery,
    (snap) => {
      if (!callbacks.onPushSubscriptionUpdate) return;
      if (snap.empty) {
        callbacks.onPushSubscriptionUpdate(null);
        return;
      }
      const docs = snap.docs.map((d) => {
        const data = d.data();
        const updatedMs =
          data.updatedAt && typeof data.updatedAt.toMillis === 'function'
            ? data.updatedAt.toMillis()
            : Date.now();
        return {
          uid: String(data.uid || uid),
          deviceId: String(data.deviceId || d.id),
          fcmToken: String(data.fcmToken || ''),
          permissionStatus:
            data.permissionStatus === 'granted' || data.permissionStatus === 'denied'
              ? (data.permissionStatus as 'granted' | 'denied')
              : ('default' as const),
          enabled: Boolean(data.enabled),
          reminderHour: typeof data.reminderHour === 'number' ? data.reminderHour : 19,
          streakAtRisk: Boolean(data.streakAtRisk),
          lastPracticedDate:
            typeof data.lastPracticedDate === 'string' ? data.lastPracticedDate : undefined,
          lastNotifiedDate:
            typeof data.lastNotifiedDate === 'string' ? data.lastNotifiedDate : undefined,
          updatedAt: updatedMs,
        };
      });
      docs.sort((a, b) => b.updatedAt - a.updatedAt);
      callbacks.onPushSubscriptionUpdate(docs[0]);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, pushColPath);
    }
  );

  return () => {
    unsubUser();
    unsubVocab();
    unsubAchievements();
    unsubActivity();
    unsubPaymentMethods();
    unsubSubscription();
    unsubLgpdConsent();
    unsubPush();
  };
}
