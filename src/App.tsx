/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Header, AppTabId } from './components/Header';
import { HumanAvatarsRoom } from './components/HumanAvatarsRoom';
import { ChatMentor } from './components/ChatMentor';
import { RoleplayScenarios } from './components/RoleplayScenarios';
import { WorshipStudy } from './components/WorshipStudy';
import { TechImmersion } from './components/TechImmersion';
import { QuizDrills } from './components/QuizDrills';
import { VocabularyNotebook } from './components/VocabularyNotebook';
import { AchievementsView } from './components/AchievementsView';
import { JourneyMap } from './components/JourneyMap';
import { StatsDashboard } from './components/StatsDashboard';
import { CreatorAdminDashboard } from './components/CreatorAdminDashboard';
import { AchievementUnlockToast } from './components/AchievementUnlockToast';
import { LegalLgpdModal, LegalTabId } from './components/LegalLgpdModal';
import { LgpdConsentBanner } from './components/LgpdConsentBanner';
import { SettingsScreen } from './components/SettingsScreen';
import { MarketingLandingPage } from './components/MarketingLandingPage';
import { HelpCenterModal } from './components/HelpCenterModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { CookieConsentRecord, LearningFocus, LgpdConsentRecord, PaymentMethodRecord, PushNotificationPrefs, ThemeMode, UserLevel, UserSubscriptionRecord, VocabularyItem, AchievementBadge, DailyActivityRecord } from './types';
import { INITIAL_VOCABULARY } from './data/vocabularyBank';
import { INITIAL_ACHIEVEMENTS } from './data/achievements';
import { CREATOR_ADMIN_EMAIL } from './data/subscriptionPlans';
import { COOKIE_POLICY_VERSION, LEGAL_TERMS_VERSION, PRIVACY_POLICY_VERSION } from './data/legalDocuments';
import { buildInitialActivityHistory, getLocalDateKey } from './utils/activityStats';
import { FirebaseProvider, useFirebase } from './context/FirebaseContext';
import {
  bootstrapUserInFirestore,
  deletePaymentMethodFromCloud,
  deletePushSubscriptionFromCloud,
  deleteVocabularyFromCloud,
  saveLgpdConsentToCloud,
  savePaymentMethodToCloud,
  savePushSubscriptionToCloud,
  saveSubscriptionToCloud,
  saveVocabularyToCloud,
  setDefaultPaymentMethodInCloud,
  subscribeToUserWorkspace,
  syncAchievementToCloud,
  syncDailyActivityToCloud,
  updateCloudUserProgress,
  updateSubscriptionInCloud,
  updateVocabularySrsInCloud,
} from './services/firestoreSync';
import {
  buildDefaultPushPrefs,
  evaluateStreakRisk,
  getOrCreatePushDeviceId,
  PUSH_PREFS_STORAGE_KEY,
  requestPermissionAndRegisterFcm,
  showBrowserStreakNotification,
  subscribeForegroundFcmMessages,
} from './services/fcmNotifications';

function AppContent() {
  const { user, authReady } = useFirebase();
  const isCreatorAdmin = Boolean(
    user?.email && user.email.toLowerCase() === CREATOR_ADMIN_EMAIL.toLowerCase() && user.emailVerified
  );
  const [surfaceMode, setSurfaceMode] = useState<'landing' | 'app'>(() => {
    if (typeof window === 'undefined') return 'landing';
    const params = new URLSearchParams(window.location.search);
    if (
      params.get('source') === 'pwa' ||
      params.get('page') === 'app' ||
      params.has('tab') ||
      params.has('billing')
    ) {
      return 'app';
    }
    return 'landing';
  });

  const [currentTab, setCurrentTab] = useState<AppTabId>(() => {
    if (typeof window === 'undefined') return 'worship';
    const tabParam = new URLSearchParams(window.location.search).get('tab');
    const validTabs: AppTabId[] = [
      'worship', 'avatars', 'chat', 'journey', 'roleplay', 'tech', 'quiz', 'vocab', 'settings', 'stats', 'achievements', 'admin',
    ];
    return tabParam && validTabs.includes(tabParam as AppTabId) ? (tabParam as AppTabId) : 'worship';
  });
  const [lastLearningTab, setLastLearningTab] = useState<AppTabId>('worship');

  const handleEnterApp = (targetTab: AppTabId = 'worship') => {
    setSurfaceMode('app');
    handleSelectTab(targetTab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('page', 'app');
      window.history.replaceState({}, '', url.toString());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOpenLanding = () => {
    setSurfaceMode('landing');
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('page');
      url.searchParams.delete('source');
      url.searchParams.delete('tab');
      window.history.replaceState({}, '', url.toString());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectTab = (nextTab: AppTabId) => {
    if (
      nextTab !== 'settings' &&
      nextTab !== 'stats' &&
      nextTab !== 'achievements' &&
      nextTab !== 'admin'
    ) {
      setLastLearningTab(nextTab);
    }
    setCurrentTab(nextTab);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const origin = window.location.origin;
    const canonicalUrl = `${origin}${window.location.pathname}`;
    const ogImageUrl = `${origin}/og-cover.jpg`;

    const canonicalEl = document.querySelector('link[rel="canonical"]');
    if (canonicalEl) canonicalEl.setAttribute('href', canonicalUrl);

    const ogUrlEl = document.querySelector('meta[property="og:url"]');
    if (ogUrlEl) ogUrlEl.setAttribute('content', canonicalUrl);

    const ogImageEl = document.querySelector('meta[property="og:image"]');
    if (ogImageEl) ogImageEl.setAttribute('content', ogImageUrl);

    const twitterImageEl = document.querySelector('meta[name="twitter:image"]');
    if (twitterImageEl) twitterImageEl.setAttribute('content', ogImageUrl);
  }, []);

  // Stored state with beginner default for welcoming Portuguese-first experience
  const [userLevel, setUserLevel] = useState<UserLevel>(() => {
    const saved = localStorage.getItem('faith_tech_level');
    return (saved as UserLevel) || 'beginner';
  });

  const [focus, setFocus] = useState<LearningFocus>(() => {
    const saved = localStorage.getItem('faith_tech_focus');
    return (saved as LearningFocus) || 'mixed';
  });

  const [xp, setXp] = useState<number>(() => {
    const saved = localStorage.getItem('faith_tech_xp');
    return saved ? parseInt(saved, 10) : 120;
  });

  const [streak, setStreak] = useState<number>(() => {
    const saved = localStorage.getItem('faith_tech_streak');
    return saved ? parseInt(saved, 10) : 3;
  });

  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(() => {
    const saved = localStorage.getItem('faith_tech_mute');
    return saved === 'true';
  });

  const [speechRate, setSpeechRate] = useState<number>(() => {
    const saved = localStorage.getItem('faith_tech_rate');
    return saved ? parseFloat(saved) : 0.95;
  });

  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('purpose_talk_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>(() => {
    const saved = localStorage.getItem('faith_tech_vocab');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_VOCABULARY;
      }
    }
    return INITIAL_VOCABULARY;
  });

  const [achievements, setAchievements] = useState<AchievementBadge[]>(() => {
    const saved = localStorage.getItem('purpose_talk_achievements');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_ACHIEVEMENTS;
      }
    }
    return INITIAL_ACHIEVEMENTS;
  });

  const [unlockedToastBadge, setUnlockedToastBadge] = useState<AchievementBadge | null>(null);
  const [cloudBootstrappedUid, setCloudBootstrappedUid] = useState<string | null>(null);
  const isApplyingCloudRef = useRef<boolean>(false);

  const [dailyActivity, setDailyActivity] = useState<Record<string, DailyActivityRecord>>(() => {
    const saved = localStorage.getItem('purpose_talk_daily_activity_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      } catch (e) {
        // fallback below
      }
    }
    const savedXp = localStorage.getItem('faith_tech_xp');
    const savedStreak = localStorage.getItem('faith_tech_streak');
    return buildInitialActivityHistory(
      savedXp ? parseInt(savedXp, 10) : 120,
      savedStreak ? parseInt(savedStreak, 10) : 3
    );
  });

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodRecord[]>(() => {
    const saved = localStorage.getItem('purpose_talk_payment_methods_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [subscription, setSubscription] = useState<UserSubscriptionRecord | null>(() => {
    const saved = localStorage.getItem('purpose_talk_subscription_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.planId) return parsed;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [lgpdConsent, setLgpdConsent] = useState<LgpdConsentRecord | null>(() => {
    const saved = localStorage.getItem('purpose_talk_lgpd_consent_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && typeof parsed.acceptedAt === 'number') {
          return parsed;
        }
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [isLegalModalOpen, setIsLegalModalOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const pageParam = new URLSearchParams(window.location.search).get('page');
    const path = window.location.pathname.toLowerCase();
    return (
      pageParam === 'privacy' ||
      pageParam === 'terms' ||
      pageParam === 'cookies' ||
      path === '/privacidade' ||
      path === '/privacy' ||
      path === '/termos' ||
      path === '/terms' ||
      path === '/cookies'
    );
  });
  const [legalInitialTab, setLegalInitialTab] = useState<LegalTabId>(() => {
    if (typeof window === 'undefined') return 'privacy';
    const pageParam = new URLSearchParams(window.location.search).get('page');
    const path = window.location.pathname.toLowerCase();
    if (pageParam === 'terms' || path === '/termos' || path === '/terms') return 'terms';
    if (pageParam === 'cookies' || path === '/cookies') return 'cookies';
    return 'privacy';
  });
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const [cookieConsent, setCookieConsent] = useState<CookieConsentRecord | null>(() => {
    const saved = localStorage.getItem('purpose_talk_cookie_consent_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && typeof parsed.acceptedAt === 'number') {
          return parsed;
        }
      } catch {
        return null;
      }
    }
    return null;
  });

  const [pushPrefs, setPushPrefs] = useState<PushNotificationPrefs | null>(() => {
    const saved = localStorage.getItem(PUSH_PREFS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.deviceId) {
          return parsed;
        }
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [foregroundPushToast, setForegroundPushToast] = useState<{ title: string; body: string } | null>(null);

  const isLgpdConsentActive = Boolean(
    lgpdConsent &&
      lgpdConsent.acceptedTerms &&
      lgpdConsent.acceptedPrivacy &&
      lgpdConsent.termsVersion === LEGAL_TERMS_VERSION &&
      lgpdConsent.privacyVersion === PRIVACY_POLICY_VERSION &&
      !lgpdConsent.revokedAt
  );

  const isCookieBannerDismissed = Boolean(
    cookieConsent && cookieConsent.version === COOKIE_POLICY_VERSION
  ) && isLgpdConsentActive;

  // Persist changes locally
  useEffect(() => {
    localStorage.setItem('faith_tech_level', userLevel);
  }, [userLevel]);

  useEffect(() => {
    localStorage.setItem('faith_tech_focus', focus);
  }, [focus]);

  useEffect(() => {
    localStorage.setItem('faith_tech_xp', xp.toString());
  }, [xp]);

  useEffect(() => {
    localStorage.setItem('faith_tech_streak', streak.toString());
  }, [streak]);

  useEffect(() => {
    localStorage.setItem('faith_tech_mute', isAudioMuted.toString());
  }, [isAudioMuted]);

  useEffect(() => {
    localStorage.setItem('faith_tech_rate', speechRate.toString());
  }, [speechRate]);

  useEffect(() => {
    localStorage.setItem('purpose_talk_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('theme-light', theme === 'light');
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('faith_tech_vocab', JSON.stringify(vocabulary));
  }, [vocabulary]);

  useEffect(() => {
    localStorage.setItem('purpose_talk_achievements', JSON.stringify(achievements));
  }, [achievements]);

  useEffect(() => {
    localStorage.setItem('purpose_talk_daily_activity_v1', JSON.stringify(dailyActivity));
  }, [dailyActivity]);

  useEffect(() => {
    localStorage.setItem('purpose_talk_payment_methods_v1', JSON.stringify(paymentMethods));
  }, [paymentMethods]);

  useEffect(() => {
    if (subscription) {
      localStorage.setItem('purpose_talk_subscription_v1', JSON.stringify(subscription));
    } else {
      localStorage.removeItem('purpose_talk_subscription_v1');
    }
  }, [subscription]);

  useEffect(() => {
    if (lgpdConsent) {
      localStorage.setItem('purpose_talk_lgpd_consent_v1', JSON.stringify(lgpdConsent));
    } else {
      localStorage.removeItem('purpose_talk_lgpd_consent_v1');
    }
  }, [lgpdConsent]);

  useEffect(() => {
    if (cookieConsent) {
      localStorage.setItem('purpose_talk_cookie_consent_v1', JSON.stringify(cookieConsent));
    } else {
      localStorage.removeItem('purpose_talk_cookie_consent_v1');
    }
  }, [cookieConsent]);

  useEffect(() => {
    if (pushPrefs) {
      localStorage.setItem(PUSH_PREFS_STORAGE_KEY, JSON.stringify(pushPrefs));
    } else {
      localStorage.removeItem(PUSH_PREFS_STORAGE_KEY);
    }
  }, [pushPrefs]);

  // Bootstrap and subscribe to Firestore when Google user signs in
  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      setCloudBootstrappedUid(null);
      return;
    }

    let isCancelled = false;
    let unsubscribeWorkspace: (() => void) | null = null;

    const initCloud = async () => {
      try {
        const merged = await bootstrapUserInFirestore(
          user,
          {
            displayName: user.displayName || 'Aluno Purpose Talk',
            userLevel,
            focus,
            xp,
            streak,
            isAudioMuted,
            speechRate,
            theme,
          },
          vocabulary,
          achievements,
          dailyActivity,
          paymentMethods,
          lgpdConsent
        );

        if (isCancelled) return;

        isApplyingCloudRef.current = true;
        setUserLevel(merged.userLevel);
        setFocus(merged.focus);
        setXp(merged.xp);
        setStreak(merged.streak);
        setIsAudioMuted(merged.isAudioMuted);
        setSpeechRate(merged.speechRate);
        if (merged.theme) {
          setTheme(merged.theme);
        }
        setTimeout(() => {
          isApplyingCloudRef.current = false;
        }, 50);

        setCloudBootstrappedUid(user.uid);

        unsubscribeWorkspace = subscribeToUserWorkspace(user.uid, {
          onProgressUpdate: (cloudProgress) => {
            isApplyingCloudRef.current = true;
            setUserLevel(cloudProgress.userLevel);
            setFocus(cloudProgress.focus);
            setXp((cur) => Math.max(cur, cloudProgress.xp));
            setStreak(cloudProgress.streak);
            setIsAudioMuted(cloudProgress.isAudioMuted);
            setSpeechRate(cloudProgress.speechRate);
            if (cloudProgress.theme) {
              setTheme(cloudProgress.theme);
            }
            setTimeout(() => {
              isApplyingCloudRef.current = false;
            }, 50);
          },
          onVocabularyUpdate: (cloudItems) => {
            if (cloudItems.length > 0) {
              setVocabulary(cloudItems);
            }
          },
          onAchievementsUpdate: (cloudMap) => {
            setAchievements((prev) =>
              prev.map((badge) => {
                const cloud = cloudMap[badge.id];
                if (!cloud) return badge;
                return {
                  ...badge,
                  currentProgress: Math.max(badge.currentProgress, cloud.currentProgress),
                  isUnlocked: badge.isUnlocked || cloud.isUnlocked,
                  unlockedAt: badge.unlockedAt || cloud.unlockedAt,
                };
              })
            );
          },
          onDailyActivityUpdate: (cloudActivity) => {
            setDailyActivity((prev) => {
              const mergedMap: Record<string, DailyActivityRecord> = { ...prev };
              Object.entries(cloudActivity).forEach(([dateKey, cloudRec]) => {
                const localRec = mergedMap[dateKey];
                mergedMap[dateKey] = {
                  date: dateKey,
                  xpEarned: Math.max(localRec?.xpEarned || 0, cloudRec.xpEarned),
                  activitiesCount: Math.max(localRec?.activitiesCount || 0, cloudRec.activitiesCount),
                  wordsSaved: Math.max(localRec?.wordsSaved || 0, cloudRec.wordsSaved),
                };
              });
              return mergedMap;
            });
          },
          onPaymentMethodsUpdate: (cloudMethods) => {
            setPaymentMethods(cloudMethods);
          },
          onSubscriptionUpdate: (cloudSub) => {
            if (cloudSub) {
              setSubscription(cloudSub);
            }
          },
          onLgpdConsentUpdate: (cloudConsent) => {
            if (cloudConsent) {
              setLgpdConsent(cloudConsent);
            }
          },
          onPushSubscriptionUpdate: (cloudPush) => {
            if (cloudPush) {
              setPushPrefs((prev) =>
                prev && prev.updatedAt > cloudPush.updatedAt ? prev : cloudPush
              );
            }
          },
        });
      } catch (err) {
        console.error('Erro ao inicializar Firestore do usuário:', err);
      }
    };

    initCloud();

    return () => {
      isCancelled = true;
      unsubscribeWorkspace?.();
    };
  }, [authReady, user?.uid]);

  // Listen to foreground Firebase Cloud Messaging messages
  useEffect(() => {
    let unsubFcm: (() => void) | undefined;
    subscribeForegroundFcmMessages((msg) => {
      setForegroundPushToast(msg);
      showBrowserStreakNotification({ title: msg.title, body: msg.body });
    }).then((unsub) => {
      unsubFcm = unsub;
    });
    return () => {
      unsubFcm?.();
    };
  }, []);

  // Automatically evaluate daily streak-at-risk status and trigger reminder push when enabled
  const streakAssessment = evaluateStreakRisk(
    streak,
    dailyActivity,
    pushPrefs?.reminderHour ?? 19
  );

  useEffect(() => {
    if (!pushPrefs || !pushPrefs.enabled) return;

    const nowHour = new Date().getHours();
    const shouldUpdateRiskState =
      pushPrefs.streakAtRisk !== streakAssessment.isAtRisk ||
      (streakAssessment.practicedToday &&
        pushPrefs.lastPracticedDate !== streakAssessment.todayKey);

    const shouldNotifyNow =
      streakAssessment.isAtRisk &&
      nowHour >= pushPrefs.reminderHour &&
      pushPrefs.lastNotifiedDate !== streakAssessment.todayKey &&
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted';

    if (!shouldUpdateRiskState && !shouldNotifyNow) return;

    let nextPrefs: PushNotificationPrefs = {
      ...pushPrefs,
      streakAtRisk: streakAssessment.isAtRisk,
      lastPracticedDate: streakAssessment.practicedToday
        ? streakAssessment.todayKey
        : pushPrefs.lastPracticedDate,
      updatedAt: Date.now(),
    };

    if (shouldNotifyNow) {
      nextPrefs = {
        ...nextPrefs,
        lastNotifiedDate: streakAssessment.todayKey,
      };
      const title = `Purpose Talk · Proteja sua ofensiva de ${streak} ${streak === 1 ? 'dia' : 'dias'}!`;
      const body =
        'Você ainda não praticou inglês hoje. Fale ou estude 1 frase agora para manter sua streak!';
      showBrowserStreakNotification({ title, body });
      setForegroundPushToast({ title, body });
    }

    setPushPrefs(nextPrefs);
    if (user && cloudBootstrappedUid === user.uid) {
      savePushSubscriptionToCloud(user.uid, nextPrefs).catch((err) =>
        console.error('Erro ao atualizar estado FCM no Firestore:', err)
      );
    }
  }, [
    pushPrefs,
    streak,
    streakAssessment.isAtRisk,
    streakAssessment.practicedToday,
    streakAssessment.todayKey,
    user,
    cloudBootstrappedUid,
  ]);

  // Debounced sync of user progress & preferences to Firestore
  useEffect(() => {
    if (!user || cloudBootstrappedUid !== user.uid || isApplyingCloudRef.current) return;

    const timer = setTimeout(() => {
      updateCloudUserProgress(user.uid, {
        displayName: user.displayName || 'Aluno Purpose Talk',
        userLevel,
        focus,
        xp,
        streak,
        isAudioMuted,
        speechRate,
        theme,
      }).catch((err) => console.error('Falha ao sincronizar progresso no Firestore:', err));
    }, 600);

    return () => clearTimeout(timer);
  }, [user, cloudBootstrappedUid, userLevel, focus, xp, streak, isAudioMuted, speechRate, theme]);

  // Unlock milestone badge helper
  const triggerUnlockBadge = (badgeId: string) => {
    setAchievements(prev => {
      const target = prev.find(b => b.id === badgeId);
      if (!target || target.isUnlocked) return prev;

      let unlockedCopy: AchievementBadge | null = null;
      const updated = prev.map(b => {
        if (b.id === badgeId) {
          const unlockedBadge = {
            ...b,
            isUnlocked: true,
            currentProgress: b.targetProgress,
            unlockedAt: Date.now(),
          };
          unlockedCopy = unlockedBadge;
          setUnlockedToastBadge(unlockedBadge);
          return unlockedBadge;
        }
        return b;
      });

      if (unlockedCopy && user && cloudBootstrappedUid === user.uid) {
        syncAchievementToCloud(user.uid, unlockedCopy).catch((err) =>
          console.error('Erro ao sincronizar conquista:', err)
        );
      }

      setXp(cur => cur + (target.xpReward || 100));
      return updated;
    });
  };

  // Check automated milestones whenever stats change
  useEffect(() => {
    setAchievements(prev => {
      let hasChanges = false;
      const changedBadges: AchievementBadge[] = [];
      const updated = prev.map(b => {
        let newProgress = b.currentProgress;

        // Streak Milestones
        if (b.category === 'streak') {
          newProgress = Math.max(b.currentProgress, streak);
        }

        // Vocabulary Milestones
        if (b.category === 'vocab') {
          newProgress = Math.max(b.currentProgress, vocabulary.length);
        }

        if (newProgress !== b.currentProgress) {
          hasChanges = true;
          const shouldUnlock = !b.isUnlocked && newProgress >= b.targetProgress;
          const nextBadge: AchievementBadge = {
            ...b,
            currentProgress: newProgress,
            isUnlocked: b.isUnlocked || shouldUnlock,
            unlockedAt: shouldUnlock ? Date.now() : b.unlockedAt,
          };
          if (shouldUnlock) {
            setUnlockedToastBadge(nextBadge);
            setXp(cur => cur + b.xpReward);
          }
          changedBadges.push(nextBadge);
          return nextBadge;
        }
        return b;
      });

      if (hasChanges && user && cloudBootstrappedUid === user.uid) {
        changedBadges.forEach((badge) => {
          syncAchievementToCloud(user.uid, badge).catch((err) =>
            console.error('Erro ao salvar progresso da conquista:', err)
          );
        });
      }

      return hasChanges ? updated : prev;
    });
  }, [streak, vocabulary.length, user, cloudBootstrappedUid]);

  const recordDailyProgress = (xpDelta: number, activitiesDelta: number, wordsDelta: number = 0) => {
    const todayKey = getLocalDateKey();
    setDailyActivity((prev) => {
      const current = prev[todayKey] || {
        date: todayKey,
        xpEarned: 0,
        activitiesCount: 0,
        wordsSaved: 0,
      };
      const updatedRecord: DailyActivityRecord = {
        date: todayKey,
        xpEarned: current.xpEarned + Math.max(0, xpDelta),
        activitiesCount: current.activitiesCount + Math.max(0, activitiesDelta),
        wordsSaved: current.wordsSaved + Math.max(0, wordsDelta),
      };
      if (user && cloudBootstrappedUid === user.uid) {
        syncDailyActivityToCloud(user.uid, updatedRecord).catch((err) =>
          console.error('Erro ao sincronizar atividade diária no Firestore:', err)
        );
      }
      return {
        ...prev,
        [todayKey]: updatedRecord,
      };
    });
  };

  const handleAddXp = (amount: number) => {
    setXp(prev => prev + amount);
    recordDailyProgress(amount, 1, 0);
  };

  const handleSaveWord = (newWord: VocabularyItem) => {
    setVocabulary(prev => {
      if (prev.some(w => w.term.toLowerCase() === newWord.term.toLowerCase())) {
        return prev;
      }
      if (user && cloudBootstrappedUid === user.uid) {
        saveVocabularyToCloud(user.uid, newWord).catch((err) =>
          console.error('Erro ao salvar palavra no Firestore:', err)
        );
      }
      recordDailyProgress(0, 1, 1);
      return [newWord, ...prev];
    });
  };

  const handleUpdateWord = (updatedWord: VocabularyItem) => {
    setVocabulary(prev =>
      prev.map(w =>
        w.term.toLowerCase() === updatedWord.term.toLowerCase() ? updatedWord : w
      )
    );
    if (user && cloudBootstrappedUid === user.uid) {
      updateVocabularySrsInCloud(user.uid, updatedWord).catch((err) =>
        console.error('Erro ao atualizar repetição espaçada da palavra no Firestore:', err)
      );
    }
  };

  const handleDeleteWord = (term: string) => {
    setVocabulary(prev => prev.filter(w => w.term !== term));
    if (user && cloudBootstrappedUid === user.uid) {
      deleteVocabularyFromCloud(user.uid, term).catch((err) =>
        console.error('Erro ao remover palavra do Firestore:', err)
      );
    }
  };

  const handleSimulateUnlock = (badgeId: string) => {
    triggerUnlockBadge(badgeId);
  };


  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleAddPaymentMethod = async (newMethod: PaymentMethodRecord): Promise<void> => {
    setPaymentMethods((prev) => {
      const updated = newMethod.isDefault
        ? [newMethod, ...prev.map((m) => ({ ...m, isDefault: false }))]
        : [...prev, newMethod];
      return updated;
    });
    if (user && cloudBootstrappedUid === user.uid) {
      await savePaymentMethodToCloud(user.uid, newMethod);
    }
  };

  const handleSetDefaultPaymentMethod = (methodId: string) => {
    setPaymentMethods((prev) =>
      prev.map((m) => ({ ...m, isDefault: m.id === methodId }))
    );
    if (user && cloudBootstrappedUid === user.uid) {
      setDefaultPaymentMethodInCloud(user.uid, methodId).catch((err) =>
        console.error('Erro ao atualizar forma de pagamento padrão no Firestore:', err)
      );
    }
  };

  const handleDeletePaymentMethod = (methodId: string) => {
    setPaymentMethods((prev) => {
      const filtered = prev.filter((m) => m.id !== methodId);
      if (filtered.length > 0 && !filtered.some((m) => m.isDefault)) {
        const nextDefault = filtered[0];
        const reassigned = filtered.map((m, idx) => ({
          ...m,
          isDefault: idx === 0,
        }));
        if (user && cloudBootstrappedUid === user.uid) {
          setDefaultPaymentMethodInCloud(user.uid, nextDefault.id).catch((err) =>
            console.error('Erro ao definir novo método padrão no Firestore:', err)
          );
        }
        return reassigned;
      }
      return filtered;
    });
    if (user && cloudBootstrappedUid === user.uid) {
      deletePaymentMethodFromCloud(user.uid, methodId).catch((err) =>
        console.error('Erro ao remover forma de pagamento do Firestore:', err)
      );
    }
  };

  const handleActivateSubscription = async (sub: UserSubscriptionRecord): Promise<void> => {
    const normalizedSub: UserSubscriptionRecord = user
      ? {
          ...sub,
          uid: user.uid,
          userEmail: user.email || sub.userEmail,
          userName: user.displayName || sub.userName,
        }
      : sub;
    setSubscription(normalizedSub);
    if (user && cloudBootstrappedUid === user.uid) {
      await saveSubscriptionToCloud(user.uid, normalizedSub);
    }
  };

  const handleUpdateSubscription = async (
    patch: Partial<
      Pick<
        UserSubscriptionRecord,
        'status' | 'cancelAtPeriodEnd' | 'planId' | 'planName' | 'priceBrlCents' | 'billingCycle'
      >
    >,
    options?: { skipCloudSync?: boolean }
  ): Promise<void> => {
    setSubscription((prev) => (prev ? { ...prev, ...patch, updatedAt: Date.now() } : prev));
    if (!options?.skipCloudSync && user && cloudBootstrappedUid === user.uid) {
      await updateSubscriptionInCloud(user.uid, patch);
    }
  };

  const handleOpenLegal = (tab: LegalTabId) => {
    setLegalInitialTab(tab);
    setIsLegalModalOpen(true);
  };

  const handleSaveCookieConsent = (opts: {
    preferences: boolean;
    analyticsAndProduct: boolean;
    marketing: boolean;
  }) => {
    const now = Date.now();
    setCookieConsent((prev) => ({
      essential: true,
      preferences: opts.preferences,
      analyticsAndProduct: opts.analyticsAndProduct,
      marketing: opts.marketing,
      version: COOKIE_POLICY_VERSION,
      acceptedAt: prev?.acceptedAt || now,
      updatedAt: now,
    }));
  };

  const handleSaveLgpdConsent = async (opts: {
    acceptedTerms: boolean;
    acceptedPrivacy: boolean;
    marketingOptIn: boolean;
  }): Promise<void> => {
    const now = Date.now();
    const record: LgpdConsentRecord = {
      uid: user?.uid || 'local_user',
      userEmail: user?.email || undefined,
      acceptedTerms: opts.acceptedTerms,
      acceptedPrivacy: opts.acceptedPrivacy,
      marketingOptIn: opts.marketingOptIn,
      termsVersion: LEGAL_TERMS_VERSION,
      privacyVersion: PRIVACY_POLICY_VERSION,
      acceptedAt: lgpdConsent?.acceptedAt && !lgpdConsent?.revokedAt ? lgpdConsent.acceptedAt : now,
      updatedAt: now,
    };
    setLgpdConsent(record);
    if (user && cloudBootstrappedUid === user.uid) {
      await saveLgpdConsentToCloud(user.uid, record);
    }
  };

  const handleAcceptQuickLgpd = async (): Promise<void> => {
    handleSaveCookieConsent({
      preferences: true,
      analyticsAndProduct: true,
      marketing: false,
    });
    await handleSaveLgpdConsent({
      acceptedTerms: true,
      acceptedPrivacy: true,
      marketingOptIn: lgpdConsent?.marketingOptIn ?? false,
    });
  };

  const handleAcceptEssentialOnlyCookies = () => {
    handleSaveCookieConsent({
      preferences: false,
      analyticsAndProduct: false,
      marketing: false,
    });
    handleSaveLgpdConsent({
      acceptedTerms: true,
      acceptedPrivacy: true,
      marketingOptIn: false,
    }).catch(() => {
      // ignore offline sync error
    });
  };

  const handleRevokeLgpdConsent = async (): Promise<void> => {
    const now = Date.now();
    const revokedRecord: LgpdConsentRecord = {
      uid: user?.uid || 'local_user',
      userEmail: user?.email || undefined,
      acceptedTerms: false,
      acceptedPrivacy: false,
      marketingOptIn: false,
      termsVersion: LEGAL_TERMS_VERSION,
      privacyVersion: PRIVACY_POLICY_VERSION,
      acceptedAt: lgpdConsent?.acceptedAt || now,
      updatedAt: now,
      revokedAt: now,
    };
    setLgpdConsent(revokedRecord);
    if (user && cloudBootstrappedUid === user.uid) {
      await saveLgpdConsentToCloud(user.uid, revokedRecord);
    }
  };

  const handleExportUserData = () => {
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      legalBasis: 'Art. 18, V da Lei nº 13.709/2018 (LGPD - Portabilidade de Dados)',
      profile: {
        uid: user?.uid || 'local_user',
        displayName: user?.displayName || 'Aluno Purpose Talk',
        email: user?.email || null,
        userLevel,
        focus,
        xp,
        streak,
        theme,
      },
      lgpdConsent,
      subscription,
      paymentMethodsMasked: paymentMethods,
      vocabularyCount: vocabulary.length,
      vocabulary,
      achievementsUnlocked: achievements.filter((a) => a.isUnlocked),
      dailyActivity,
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `purpose-talk-dados-lgpd-${getLocalDateKey()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleEnablePush = async (reminderHour: number): Promise<void> => {
    const regResult = await requestPermissionAndRegisterFcm();
    const risk = evaluateStreakRisk(streak, dailyActivity, reminderHour);
    const deviceId = getOrCreatePushDeviceId();
    const nextPrefs: PushNotificationPrefs = {
      ...(pushPrefs || buildDefaultPushPrefs(user?.uid || 'local_user', risk.isAtRisk, risk.todayKey)),
      uid: user?.uid || 'local_user',
      deviceId,
      fcmToken: regResult.fcmToken,
      permissionStatus: regResult.permission,
      enabled: true,
      reminderHour,
      streakAtRisk: risk.isAtRisk,
      lastPracticedDate: risk.practicedToday ? risk.todayKey : pushPrefs?.lastPracticedDate,
      updatedAt: Date.now(),
    };
    setPushPrefs(nextPrefs);
    if (user && cloudBootstrappedUid === user.uid) {
      await savePushSubscriptionToCloud(user.uid, nextPrefs);
    }
  };

  const handleUpdateReminderHour = async (reminderHour: number): Promise<void> => {
    if (!pushPrefs) return;
    const risk = evaluateStreakRisk(streak, dailyActivity, reminderHour);
    const nextPrefs: PushNotificationPrefs = {
      ...pushPrefs,
      reminderHour,
      streakAtRisk: risk.isAtRisk,
      updatedAt: Date.now(),
    };
    setPushPrefs(nextPrefs);
    if (user && cloudBootstrappedUid === user.uid) {
      await savePushSubscriptionToCloud(user.uid, nextPrefs);
    }
  };

  const handleDisablePush = async (): Promise<void> => {
    const deviceId = pushPrefs?.deviceId || getOrCreatePushDeviceId();
    if (pushPrefs) {
      const nextPrefs: PushNotificationPrefs = {
        ...pushPrefs,
        enabled: false,
        updatedAt: Date.now(),
      };
      setPushPrefs(nextPrefs);
    }
    if (user && cloudBootstrappedUid === user.uid) {
      await deletePushSubscriptionFromCloud(user.uid, deviceId);
    }
  };

  const handleSendTestPush = async (): Promise<{ mode: string; title: string; body: string }> => {
    const risk = evaluateStreakRisk(streak, dailyActivity, pushPrefs?.reminderHour ?? 19);
    const res = await fetch('/api/notifications/streak-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fcmToken: pushPrefs?.fcmToken,
        streak,
        userName: user?.displayName || 'Aluno',
        streakAtRisk: risk.isAtRisk,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || 'Erro ao preparar notificação push.');
    }

    const title: string = data?.payload?.title || 'Purpose Talk · Lembrete de Streak';
    const body: string = data?.payload?.body || 'Pratique inglês hoje para manter sua ofensiva!';

    if (data?.mode !== 'fcm_server') {
      await showBrowserStreakNotification({ title, body });
    }
    setForegroundPushToast({ title, body });
    return { mode: data?.mode || 'client_sw_ready', title, body };
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {surfaceMode === 'landing' ? (
        <MarketingLandingPage
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onEnterApp={handleEnterApp}
          onOpenHelp={() => setIsHelpModalOpen(true)}
          onOpenLegal={handleOpenLegal}
          isAuthenticated={Boolean(user)}
        />
      ) : currentTab === 'settings' ? (
        <SettingsScreen
          onBack={() => handleSelectTab(lastLearningTab)}
          onNavigateUtilityTab={(tab) => handleSelectTab(tab)}
          userLevel={userLevel}
          onLevelChange={setUserLevel}
          focus={focus}
          onFocusChange={setFocus}
          xp={xp}
          streak={streak}
          unlockedAchievementsCount={achievements.filter((a) => a.isUnlocked).length}
          isAudioMuted={isAudioMuted}
          onToggleAudio={() => setIsAudioMuted(!isAudioMuted)}
          speechRate={speechRate}
          onSpeechRateChange={setSpeechRate}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          paymentMethods={paymentMethods}
          onAddPaymentMethod={handleAddPaymentMethod}
          onSetDefaultPaymentMethod={handleSetDefaultPaymentMethod}
          onDeletePaymentMethod={handleDeletePaymentMethod}
          subscription={subscription}
          onActivateSubscription={handleActivateSubscription}
          onUpdateSubscription={handleUpdateSubscription}
          lgpdAccepted={isLgpdConsentActive}
          onOpenLegal={handleOpenLegal}
          onAcceptLgpd={handleAcceptQuickLgpd}
          onExportUserData={handleExportUserData}
          dailyActivity={dailyActivity}
          pushPrefs={pushPrefs}
          streakAtRisk={streakAssessment.isAtRisk}
          onEnablePush={handleEnablePush}
          onUpdateReminderHour={handleUpdateReminderHour}
          onDisablePush={handleDisablePush}
          onSendTestPush={handleSendTestPush}
          onOpenHelp={() => setIsHelpModalOpen(true)}
          onOpenLanding={handleOpenLanding}
          cookieConsentConfigured={Boolean(cookieConsent)}
        />
      ) : (
        <>
          {/* Header */}
          <Header
            currentTab={currentTab}
            onTabChange={handleSelectTab}
            userLevel={userLevel}
            xp={xp}
            streak={streak}
          />

          {/* Foreground FCM / Streak Reminder In-App Toast */}
          {foregroundPushToast && (
            <div
              role="status"
              className="fixed top-20 right-4 z-50 max-w-sm rounded-2xl border border-amber-500/40 bg-slate-900/95 backdrop-blur-md p-4 shadow-2xl space-y-2"
            >
              <div className="text-xs font-extrabold text-amber-300">{foregroundPushToast.title}</div>
              <p className="text-xs text-slate-200 leading-relaxed">{foregroundPushToast.body}</p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setForegroundPushToast(null)}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1 cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleSelectTab('worship');
                    setForegroundPushToast(null);
                  }}
                  className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-lg cursor-pointer"
                >
                  Praticar Agora
                </button>
              </div>
            </div>
          )}

          {/* Floating Global Achievement Toast */}
          <AchievementUnlockToast
            badge={unlockedToastBadge}
            onDismiss={() => setUnlockedToastBadge(null)}
          />

          {/* Main Content Area */}
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            {(currentTab === 'stats' || currentTab === 'achievements' || currentTab === 'admin') && (
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => handleSelectTab('settings')}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-300 hover:text-white transition cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Voltar para Configurações</span>
                  </button>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <button
                    type="button"
                    onClick={() => handleSelectTab(lastLearningTab)}
                    className="text-xs font-medium text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    Ir para Assuntos de Aprendizagem
                  </button>
                </div>
                <span className="text-xs text-slate-400">
                  {currentTab === 'stats'
                    ? 'Progresso (30 Dias)'
                    : currentTab === 'achievements'
                      ? 'Conquistas'
                      : 'Painel do Criador'}
                </span>
              </div>
            )}

        {currentTab === 'avatars' && (
          <HumanAvatarsRoom
            userLevel={userLevel}
            speechRate={speechRate}
            isAudioMuted={isAudioMuted}
            onSaveWord={handleSaveWord}
            onAddXp={handleAddXp}
          />
        )}

        {currentTab === 'journey' && (
          <JourneyMap
            userLevel={userLevel}
            xp={xp}
            streak={streak}
            speechRate={speechRate}
            onNavigateTab={setCurrentTab}
            onAddXp={handleAddXp}
          />
        )}

        {currentTab === 'achievements' && (
          <AchievementsView
            achievements={achievements}
            xp={xp}
            streak={streak}
            wordsCount={vocabulary.length}
            onUnlockSimulate={handleSimulateUnlock}
          />
        )}

        {currentTab === 'chat' && (
          <ChatMentor
            userLevel={userLevel}
            focus={focus}
            speechRate={speechRate}
            isAudioMuted={isAudioMuted}
            onSaveWord={handleSaveWord}
            onAddXp={handleAddXp}
          />
        )}

        {currentTab === 'roleplay' && (
          <RoleplayScenarios
            userLevel={userLevel}
            speechRate={speechRate}
            isAudioMuted={isAudioMuted}
            onSaveWord={handleSaveWord}
            onAddXp={handleAddXp}
          />
        )}

        {currentTab === 'worship' && (
          <WorshipStudy
            userLevel={userLevel}
            speechRate={speechRate}
            onSaveWord={handleSaveWord}
            onAddXp={handleAddXp}
          />
        )}

        {currentTab === 'tech' && (
          <TechImmersion
            speechRate={speechRate}
            onSaveWord={handleSaveWord}
            onAddXp={handleAddXp}
          />
        )}

        {currentTab === 'quiz' && (
          <QuizDrills
            userLevel={userLevel}
            speechRate={speechRate}
            onAddXp={handleAddXp}
          />
        )}

        {currentTab === 'vocab' && (
          <VocabularyNotebook
            vocabulary={vocabulary}
            speechRate={speechRate}
            onAddWord={handleSaveWord}
            onUpdateWord={handleUpdateWord}
            onDeleteWord={handleDeleteWord}
            onAddXp={handleAddXp}
          />
        )}

        {currentTab === 'stats' && (
          <StatsDashboard
            xp={xp}
            streak={streak}
            userLevel={userLevel}
            vocabulary={vocabulary}
            achievements={achievements}
            dailyActivity={dailyActivity}
            theme={theme}
            onNavigateTab={(t) => setCurrentTab(t)}
          />
        )}

        {currentTab === 'admin' && isCreatorAdmin && (
          <CreatorAdminDashboard
            theme={theme}
            creatorEmail={user?.email || CREATOR_ADMIN_EMAIL}
          />
        )}
      </main>

          {/* Minimal Footer keeping utility links tucked cleanly away */}
          <footer className="border-t border-slate-900 bg-slate-950/90 py-4 px-6 text-center text-xs text-slate-500 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <span>Purpose Talk · Inglês acolhedor através de louvores, fé e prática diária.</span>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setIsHelpModalOpen(true)}
              className="text-slate-400 hover:text-white underline cursor-pointer"
            >
              Central de Ajuda (FAQ)
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => handleOpenLegal('cookies')}
              className="text-slate-400 hover:text-white underline cursor-pointer"
            >
              Política de Cookies
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => handleOpenLegal('privacy')}
              className="text-slate-400 hover:text-white underline cursor-pointer"
            >
              Privacidade & Termos (LGPD)
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={handleOpenLanding}
              className="text-slate-400 hover:text-white underline cursor-pointer"
            >
              Página Inicial
            </button>
          </footer>
        </>
      )}

      {/* Legal, Privacy & Cookie Policy Modal */}
      <LegalLgpdModal
        isOpen={isLegalModalOpen}
        initialTab={legalInitialTab}
        onClose={() => setIsLegalModalOpen(false)}
        consent={lgpdConsent}
        cookieConsent={cookieConsent}
        onSaveConsent={handleSaveLgpdConsent}
        onSaveCookieConsent={handleSaveCookieConsent}
        onRevokeConsent={handleRevokeLgpdConsent}
        onExportUserData={handleExportUserData}
      />

      {/* Help Center & FAQ Modal */}
      <HelpCenterModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        onOpenLegal={handleOpenLegal}
        onOpenApp={surfaceMode === 'landing' ? () => handleEnterApp('worship') : undefined}
      />

      {/* Offline PWA Banner */}
      <OfflineIndicator />

      {/* Compact Cookie & LGPD Consent Banner when acceptance is pending */}
      {!isCookieBannerDismissed && (
        <LgpdConsentBanner
          onOpenLegal={handleOpenLegal}
          onAcceptAll={handleAcceptQuickLgpd}
          onAcceptEssentialOnly={handleAcceptEssentialOnlyCookies}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <FirebaseProvider>
      <AppContent />
    </FirebaseProvider>
  );
}

