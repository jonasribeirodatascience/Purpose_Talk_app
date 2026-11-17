export type PersonaId = 'pastor_and_tech' | 'pastor_david' | 'sarah_tech';

export type SpeechProfileId = 'auto' | 'pastor_david' | 'sarah_tech' | 'jake_buddy' | 'emma_british';

export interface SpeechProfileConfig {
  id: SpeechProfileId;
  name: string;
  taglinePt: string;
  accentLabelPt: string;
  voiceLang: 'en-US' | 'en-GB';
  defaultPitch: number;
  rateMultiplier: number;
  sampleQuote: string;
}

export type UserLevel = 'beginner' | 'intermediate' | 'advanced';

export type LearningFocus = 'worship' | 'tech' | 'mixed';

export type ThemeMode = 'dark' | 'light';

export interface ChatFeedback {
  isPerfect?: boolean;
  betterVersion?: string;
  explanationPt?: string;
  grammarPoints?: string[];
  pronunciationTip?: string;
}

export interface VocabularyItem {
  term: string;
  phonetic?: string;
  meaning: string;
  example: string;
  category?: 'worship' | 'tech' | 'general';
  srsRepetitions?: number;
  srsIntervalDays?: number;
  srsEaseFactor?: number;
  srsLapses?: number;
  srsNextReviewAt?: number;
  srsLastReviewedAt?: number;
}

export interface PronunciationCoachInfo {
  targetPhrase: string;
  phoneticEasy: string;
  mouthPositionPt: string;
  commonPitfallPt?: string;
}

export interface WritingDrillInfo {
  promptPt: string;
  suggestedAnswerEn: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  mentorGuidancePt?: string;
  translationPt?: string;
  score?: number;
  feedback?: ChatFeedback;
  pronunciationCoach?: PronunciationCoachInfo;
  writingDrill?: WritingDrillInfo;
  vocabulary?: VocabularyItem[];
  followUpQuestion?: string;
}

export interface SongSection {
  type: string;
  english: string;
  portuguese: string;
  keyVocab?: string[];
  grammarHighlight?: string;
  pronunciationTip?: string;
  spokenPhoneticEasy?: string;
  spokenTipPt?: string;
  sungPhoneticFlow?: string;
  sungTipPt?: string;
}

export interface WorshipSong {
  id: string;
  title: string;
  titlePt?: string;
  artist: string;
  year?: string;
  level?: 'beginner' | 'intermediate';
  themeTagPt?: string;
  spiritualTheme: string;
  keyBiblicalVerse: string;
  sections: SongSection[];
  topVocabulary: {
    word: string;
    phonetic: string;
    meaning: string;
    biblicalContext: string;
  }[];
  conversationPrompt: {
    questionEn: string;
    questionPt: string;
    suggestedAnswerTemplate: string;
  };
}

export interface TechScenario {
  id: string;
  type: 'daily_standup' | 'job_interview' | 'code_review' | 'data_science_pitch' | 'system_design';
  title: string;
  roleTitle: string;
  contextEn: string;
  contextPt: string;
  promptQuestionEn: string;
  starterHintPt: string;
  sampleAnswerEn: string;
  keyVocabulary: {
    term: string;
    meaning: string;
    context: string;
  }[];
}

export interface QuizQuestion {
  id: number;
  tag: string;
  questionEn: string;
  questionPt: string;
  options: string[];
  correctIndex: number;
  explanationPt: string;
  audioPhrase?: string;
}

export interface UserStats {
  xp: number;
  streakDays: number;
  conversationsCount: number;
  songsStudied: number;
  techDrillsCompleted: number;
  quizzesPassed: number;
  savedWordsCount: number;
}

export interface EverydayScenarioGoal {
  id: string;
  descriptionEn: string;
  descriptionPt: string;
}

export interface EverydayRoleplayScenario {
  id: string;
  title: string;
  category: 'food' | 'directions' | 'shopping' | 'travel' | 'hotel' | 'social';
  locationEmoji: string;
  characterName: string;
  characterRoleEn: string;
  characterRolePt: string;
  situationEn: string;
  situationPt: string;
  initialBotGreetingEn: string;
  initialBotGreetingPt: string;
  goals: EverydayScenarioGoal[];
  quickStartersEn: string[];
  usefulPhrases: {
    phraseEn: string;
    phrasePt: string;
    pronunciationHint: string;
  }[];
}

export interface RoleplayTurnFeedback {
  score: number;
  isNatural: boolean;
  betterVersion: string;
  grammarExplanationPt: string;
  pronunciationTips: string[];
  phoneticSpelling?: string;
  politenessTipPt?: string;
}

export interface RoleplayChatMessage {
  id: string;
  sender: 'user' | 'bot';
  contentEn: string;
  mentorGuidancePt?: string;
  translationPt?: string;
  timestamp: number;
  feedback?: RoleplayTurnFeedback;
  writingDrill?: WritingDrillInfo;
  suggestedNextResponses?: string[];
}

export interface AvatarMentorProfile {
  id: string;
  name: string;
  role: string;
  age: number;
  location: string;
  accent: string;
  voiceLang: 'en-US' | 'en-GB';
  voiceRate: number;
  image: string;
  bioEn: string;
  bioPt: string;
  personality: string[];
  specialties: string[];
  starterPrompts: string[];
  greetingEn: string;
  greetingPt: string;
}

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'diamond';

export type AchievementCategory = 'streak' | 'vocab' | 'tech' | 'worship' | 'avatar' | 'quiz';

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  iconName: string;
  xpReward: number;
  currentProgress: number;
  targetProgress: number;
  isUnlocked: boolean;
  unlockedAt?: number;
}

export type JourneyPillar = 'tech' | 'worship' | 'conversation' | 'bridge';

export type JourneyStageLevel = 
  | 'A1_beginner' 
  | 'A2_elementary' 
  | 'B1_intermediate' 
  | 'B2_upper_intermediate' 
  | 'C1_advanced' 
  | 'C2_fluent';

export interface JourneyMilestone {
  id: string;
  stageLevel: JourneyStageLevel;
  stageNamePt: string;
  levelBadge: string;
  stepNumber: number;
  titlePt: string;
  titleEn: string;
  pillar: JourneyPillar;
  descriptionPt: string;
  targetSkillPt: string;
  pronunciationGoalPt: string;
  writingGoalPt: string;
  recommendedAction: {
    tab: 'avatars' | 'chat' | 'roleplay' | 'worship' | 'tech' | 'quiz' | 'vocab' | 'achievements';
    labelPt: string;
    actionPayload?: string;
  };
  requiredXp: number;
  xpReward: number;
  badgeRewardId?: string;
}

export type WordPronunciationStatus =
  | 'accurate'
  | 'close'
  | 'mispronounced'
  | 'missing'
  | 'extra';

export interface AnalyzedWord {
  id: string;
  expectedWord: string;
  spokenWord: string;
  status: WordPronunciationStatus;
  confidence: number;
  phoneticEasy?: string;
  ipa?: string;
  tipPt?: string;
}

export interface PronunciationAnalysisResult {
  targetText: string;
  spokenText: string;
  accuracyScore: number;
  words: AnalyzedWord[];
  summaryPt: string;
  aiEnriched?: boolean;
}

export interface DailyActivityRecord {
  date: string; // YYYY-MM-DD
  xpEarned: number;
  activitiesCount: number;
  wordsSaved: number;
}

export type PaymentMethodType = 'credit_card' | 'debit_card' | 'pix';

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'elo' | 'hipercard' | 'pix';

export interface PaymentMethodRecord {
  id: string;
  type: PaymentMethodType;
  label: string;
  holderName: string;
  brand: CardBrand;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  pixKeyMasked?: string;
  isDefault: boolean;
  createdAt: number;
}

export type SubscriptionPlanId = 'essencial_mensal' | 'pro_mensal' | 'pro_anual';

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled';

export type PaymentGatewayId = 'mercadopago' | 'stripe';

export interface SubscriptionPlanConfig {
  id: SubscriptionPlanId;
  name: string;
  taglinePt: string;
  priceBrlCents: number;
  priceLabel: string;
  monthlyEquivalentLabel: string;
  billingCycle: 'monthly' | 'annual';
  trialDays: number;
  popular?: boolean;
  badgeText?: string;
  featuresPt: string[];
}

export interface UserSubscriptionRecord {
  uid: string;
  userEmail: string;
  userName: string;
  planId: SubscriptionPlanId;
  planName: string;
  priceBrlCents: number;
  billingCycle: 'monthly' | 'annual';
  status: SubscriptionStatus;
  gateway: PaymentGatewayId;
  paymentMethodId: string;
  paymentMethodLabel: string;
  trialDays: number;
  trialStartedAt: number;
  trialEndsAt: number;
  nextBillingAt: number;
  gatewaySubscriptionId?: string;
  cancelAtPeriodEnd: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface LgpdConsentRecord {
  uid: string;
  userEmail?: string;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  marketingOptIn: boolean;
  termsVersion: string;
  privacyVersion: string;
  acceptedAt: number;
  updatedAt: number;
  revokedAt?: number;
}

export interface PushNotificationPrefs {
  uid: string;
  deviceId: string;
  fcmToken: string;
  permissionStatus: 'default' | 'granted' | 'denied';
  enabled: boolean;
  reminderHour: number;
  streakAtRisk: boolean;
  lastPracticedDate?: string;
  lastNotifiedDate?: string;
  updatedAt: number;
}

export interface CookieConsentRecord {
  essential: true;
  preferences: boolean;
  analyticsAndProduct: boolean;
  marketing: boolean;
  version: string;
  acceptedAt: number;
  updatedAt: number;
}

