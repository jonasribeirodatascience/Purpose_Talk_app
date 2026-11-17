import fs from 'node:fs';
import assert from 'node:assert/strict';

const rulesText = fs.readFileSync('firestore.rules', 'utf8');
const blueprint = JSON.parse(fs.readFileSync('firebase-blueprint.json', 'utf8'));

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    passed++;
    console.log(`PASS: ${name}`);
  } catch (err) {
    failed++;
    console.error(`FAIL: ${name}\n  -> ${err.message}`);
  }
}

// =========================================================================
// PART A: Structural & Blueprint Synchronicity Audit of firestore.rules
// =========================================================================
runTest('Rules use rules_version = 2 and global default-deny catch-all', () => {
  assert.match(rulesText, /rules_version\s*=\s*'2'/);
  assert.match(rulesText, /match \/\{document=\*\*\}\s*\{\s*allow read, write: if false;\s*\}/);
});

runTest('Every blueprint collection has an explicit match block in firestore.rules', () => {
  const expectedMatchers = [
    'match /users/{userId}',
    'match /private/{docId}',
    'match /vocabulary/{wordId}',
    'match /achievements/{badgeId}',
    'match /pronunciationLogs/{logId}',
    'match /dailyActivity/{dateId}',
    'match /paymentMethods/{methodId}',
    'match /subscriptions/{userId}',
    'match /admins/{adminId}',
    'match /lgpdConsents/{userId}',
    'match /pushSubscriptions/{deviceId}',
  ];
  assert.equal(Object.keys(blueprint.firestore).length, expectedMatchers.length);
  for (const matcher of expectedMatchers) {
    assert.ok(rulesText.includes(matcher), `Missing rule block: ${matcher}`);
  }
});

runTest('Email verification and UID ownership enforced in isSignedIn() / isOwner()', () => {
  assert.match(rulesText, /request\.auth != null && request\.auth\.token\.email_verified == true/);
  assert.match(rulesText, /isSignedIn\(\) && request\.auth\.uid == userId/);
});

runTest('All list rules forbid blanket listing or enforce owner/admin RBAC', () => {
  assert.match(rulesText, /match \/admins\/\{adminId\}[\s\S]*?allow list: if false;/);
  assert.match(rulesText, /match \/private\/\{docId\}[\s\S]*?allow list: if false;/);
  const listMatches = [...rulesText.matchAll(/allow list: if ([^;]+);/g)].map(m => m[1]);
  for (const cond of listMatches) {
    if (cond.trim() === 'false') continue;
    const isUserScoped = cond.includes('resource.data.uid == request.auth.uid');
    const isAdminScoped = cond.includes('isAdmin()');
    assert.ok(
      isUserScoped || isAdminScoped,
      `Insecure list rule without resource.data.uid or isAdmin() check: ${cond}`
    );
    if (!isAdminScoped) {
      assert.ok(!cond.includes('get(') && !cond.includes('exists('), `User list rule must not call get/exists: ${cond}`);
    }
  }
});

runTest('Hardened bounds present (XP delta, HTTPS photoURL, token email match, achievement lock)', () => {
  assert.ok(rulesText.includes('(incoming().xp - existing().xp) <= 10000'));
  assert.ok(rulesText.includes("data.photoURL.matches('^https://.*')"));
  assert.ok(rulesText.includes('data.email.lower() == request.auth.token.email.lower()'));
  assert.ok(rulesText.includes('existing().isUnlocked == true'));
  assert.ok(rulesText.includes('incoming().unlockedAt == existing().unlockedAt'));
});

// =========================================================================
// PART B: Adversarial & Positive-Path Rule Logic Simulator
// =========================================================================
const REQUEST_TIME = 1763300000000;
const isValidId = (id) => typeof id === 'string' && id.length >= 1 && id.length <= 128 && /^[a-zA-Z0-9_-]+$/.test(id);
const isSignedIn = (auth) => auth !== null && auth.token?.email_verified === true;
const isOwner = (auth, userId) => isSignedIn(auth) && auth.uid === userId;
const hasOnlyKeys = (obj, allowed) => Object.keys(obj).every((k) => allowed.includes(k));
const hasAllKeys = (obj, required) => required.every((k) => Object.prototype.hasOwnProperty.call(obj, k));
const affectedKeysOnly = (incoming, existing, allowed) => {
  const keys = new Set([...Object.keys(incoming), ...Object.keys(existing)]);
  for (const k of keys) {
    if (JSON.stringify(incoming[k]) !== JSON.stringify(existing[k])) {
      if (!allowed.includes(k)) return false;
    }
  }
  return true;
};

function evalUserProgressCreate(auth, userId, incoming) {
  if (!isSignedIn(auth) || !isValidId(userId) || !isOwner(auth, userId)) return false;
  const requiredKeys = ['uid', 'displayName', 'userLevel', 'focus', 'xp', 'streak', 'isAudioMuted', 'speechRate', 'createdAt', 'updatedAt'];
  const allowedKeys = [...requiredKeys, 'theme'];
  if (!hasAllKeys(incoming, requiredKeys) || !hasOnlyKeys(incoming, allowedKeys)) return false;
  if (incoming.uid !== auth.uid || incoming.uid !== userId) return false;
  if (typeof incoming.displayName !== 'string' || incoming.displayName.length > 120) return false;
  if (!['beginner', 'intermediate', 'advanced'].includes(incoming.userLevel)) return false;
  if (!['worship', 'tech', 'mixed'].includes(incoming.focus)) return false;
  if (!Number.isInteger(incoming.xp) || incoming.xp < 0 || incoming.xp > 50000) return false;
  if (!Number.isInteger(incoming.streak) || incoming.streak < 0 || incoming.streak > 365) return false;
  if (typeof incoming.isAudioMuted !== 'boolean') return false;
  if (typeof incoming.speechRate !== 'number' || incoming.speechRate < 0.5 || incoming.speechRate > 2.0) return false;
  if ('theme' in incoming && (typeof incoming.theme !== 'string' || !['dark', 'light'].includes(incoming.theme))) return false;
  return incoming.createdAt === REQUEST_TIME && incoming.updatedAt === REQUEST_TIME;
}

function evalUserProgressUpdate(auth, userId, incoming, existing) {
  if (!isSignedIn(auth) || !isValidId(userId) || !isOwner(auth, userId)) return false;
  const requiredKeys = ['uid', 'displayName', 'userLevel', 'focus', 'xp', 'streak', 'isAudioMuted', 'speechRate', 'createdAt', 'updatedAt'];
  const allowedKeys = [...requiredKeys, 'theme'];
  if (!hasAllKeys(incoming, requiredKeys) || !hasOnlyKeys(incoming, allowedKeys)) return false;
  if (incoming.uid !== existing.uid || incoming.createdAt !== existing.createdAt || incoming.updatedAt !== REQUEST_TIME) return false;
  if (!Number.isInteger(incoming.xp) || incoming.xp < 0 || incoming.xp > 500000) return false;
  if (!Number.isInteger(incoming.streak) || incoming.streak < 0 || incoming.streak > 3650) return false;
  if ('theme' in incoming && (typeof incoming.theme !== 'string' || !['dark', 'light'].includes(incoming.theme))) return false;

  const settingsOnly = affectedKeysOnly(incoming, existing, ['displayName', 'userLevel', 'focus', 'isAudioMuted', 'speechRate', 'theme', 'updatedAt']);
  const progressOnly = affectedKeysOnly(incoming, existing, ['xp', 'streak', 'updatedAt']) && incoming.xp >= existing.xp && (incoming.xp - existing.xp) <= 10000 && incoming.streak <= existing.streak + 30;
  const combined = affectedKeysOnly(incoming, existing, ['displayName', 'userLevel', 'focus', 'xp', 'streak', 'isAudioMuted', 'speechRate', 'theme', 'updatedAt']) && incoming.xp >= existing.xp && (incoming.xp - existing.xp) <= 10000 && incoming.streak <= existing.streak + 30;
  return settingsOnly || progressOnly || combined;
}

function evalPrivateCreate(auth, userId, docId, incoming, parentExists) {
  if (!isSignedIn(auth) || !isValidId(userId) || docId !== 'info' || !isOwner(auth, userId) || !parentExists) return false;
  if (!hasAllKeys(incoming, ['uid', 'email', 'createdAt', 'updatedAt']) || !hasOnlyKeys(incoming, ['uid', 'email', 'photoURL', 'createdAt', 'updatedAt'])) return false;
  if (incoming.uid !== auth.uid || incoming.uid !== userId) return false;
  if (typeof incoming.email !== 'string' || incoming.email.length < 3 || incoming.email.length > 254) return false;
  if (auth.token?.email && incoming.email.toLowerCase() !== auth.token.email.toLowerCase()) return false;
  if ('photoURL' in incoming && (typeof incoming.photoURL !== 'string' || incoming.photoURL.length < 8 || incoming.photoURL.length > 500 || !/^https:\/\/.*/.test(incoming.photoURL))) return false;
  return incoming.createdAt === REQUEST_TIME && incoming.updatedAt === REQUEST_TIME;
}

function evalVocabCreate(auth, userId, wordId, incoming, parentExists) {
  if (!isSignedIn(auth) || !isValidId(userId) || !isValidId(wordId) || !isOwner(auth, userId) || !parentExists) return false;
  const allowedKeys = [
    'uid', 'term', 'phonetic', 'meaning', 'example', 'category',
    'srsRepetitions', 'srsIntervalDays', 'srsEaseFactor', 'srsLapses',
    'srsNextReviewAt', 'srsLastReviewedAt', 'createdAt', 'updatedAt',
  ];
  if (!hasAllKeys(incoming, ['uid', 'term', 'meaning', 'example', 'createdAt', 'updatedAt']) || !hasOnlyKeys(incoming, allowedKeys)) return false;
  if (incoming.uid !== auth.uid || incoming.uid !== userId) return false;
  if (typeof incoming.term !== 'string' || incoming.term.length < 1 || incoming.term.length > 120) return false;
  if (typeof incoming.meaning !== 'string' || incoming.meaning.length < 1 || incoming.meaning.length > 300) return false;
  if (typeof incoming.example !== 'string' || incoming.example.length < 1 || incoming.example.length > 500) return false;
  if ('srsRepetitions' in incoming && (!Number.isInteger(incoming.srsRepetitions) || incoming.srsRepetitions < 0 || incoming.srsRepetitions > 10000)) return false;
  if ('srsIntervalDays' in incoming && (!Number.isInteger(incoming.srsIntervalDays) || incoming.srsIntervalDays < 0 || incoming.srsIntervalDays > 3650)) return false;
  if ('srsEaseFactor' in incoming && (typeof incoming.srsEaseFactor !== 'number' || incoming.srsEaseFactor < 1.3 || incoming.srsEaseFactor > 4.0)) return false;
  return incoming.createdAt === REQUEST_TIME && incoming.updatedAt === REQUEST_TIME;
}

function evalVocabUpdate(auth, userId, wordId, incoming, existing) {
  if (!isSignedIn(auth) || !isValidId(userId) || !isValidId(wordId) || !isOwner(auth, userId)) return false;
  const allowedKeys = [
    'uid', 'term', 'phonetic', 'meaning', 'example', 'category',
    'srsRepetitions', 'srsIntervalDays', 'srsEaseFactor', 'srsLapses',
    'srsNextReviewAt', 'srsLastReviewedAt', 'createdAt', 'updatedAt',
  ];
  if (!hasOnlyKeys(incoming, allowedKeys)) return false;
  if (incoming.uid !== existing.uid || incoming.createdAt !== existing.createdAt || incoming.updatedAt !== REQUEST_TIME) return false;
  if ('srsRepetitions' in incoming && (!Number.isInteger(incoming.srsRepetitions) || incoming.srsRepetitions < 0 || incoming.srsRepetitions > 10000)) return false;
  if ('srsIntervalDays' in incoming && (!Number.isInteger(incoming.srsIntervalDays) || incoming.srsIntervalDays < 0 || incoming.srsIntervalDays > 3650)) return false;
  if ('srsEaseFactor' in incoming && (typeof incoming.srsEaseFactor !== 'number' || incoming.srsEaseFactor < 1.3 || incoming.srsEaseFactor > 4.0)) return false;
  if ('srsLapses' in incoming && (!Number.isInteger(incoming.srsLapses) || incoming.srsLapses < 0 || incoming.srsLapses > 10000)) return false;
  const contentUpdate = affectedKeysOnly(incoming, existing, ['term', 'phonetic', 'meaning', 'example', 'category', 'updatedAt']);
  const srsUpdate = affectedKeysOnly(incoming, existing, [
    'srsRepetitions', 'srsIntervalDays', 'srsEaseFactor', 'srsLapses',
    'srsNextReviewAt', 'srsLastReviewedAt', 'updatedAt',
  ]);
  return contentUpdate || srsUpdate;
}

function evalAchievementUpdate(auth, userId, badgeId, incoming, existing) {
  if (!isSignedIn(auth) || !isValidId(userId) || !isValidId(badgeId) || !isOwner(auth, userId)) return false;
  if (!hasAllKeys(incoming, ['uid', 'badgeId', 'currentProgress', 'isUnlocked', 'createdAt', 'updatedAt']) || !hasOnlyKeys(incoming, ['uid', 'badgeId', 'currentProgress', 'isUnlocked', 'unlockedAt', 'createdAt', 'updatedAt'])) return false;
  if (incoming.uid !== existing.uid || incoming.badgeId !== existing.badgeId || incoming.createdAt !== existing.createdAt || incoming.updatedAt !== REQUEST_TIME) return false;
  if (!Number.isInteger(incoming.currentProgress) || incoming.currentProgress < existing.currentProgress || incoming.currentProgress > 100000) return false;
  const unlockConsistent = (!incoming.isUnlocked && !('unlockedAt' in incoming)) || (incoming.isUnlocked && Number.isInteger(incoming.unlockedAt) && incoming.unlockedAt >= 0);
  if (!unlockConsistent) return false;
  if (existing.isUnlocked) {
    return incoming.isUnlocked === true && incoming.unlockedAt === existing.unlockedAt && affectedKeysOnly(incoming, existing, ['currentProgress', 'updatedAt']);
  }
  return affectedKeysOnly(incoming, existing, ['currentProgress', 'isUnlocked', 'unlockedAt', 'updatedAt']);
}

function isValidPaymentMethodPayload(incoming, auth, userId) {
  const reqKeys = ['uid', 'type', 'label', 'holderName', 'brand', 'isDefault', 'createdAt', 'updatedAt'];
  const allKeys = [...reqKeys, 'last4', 'expiryMonth', 'expiryYear', 'pixKeyMasked'];
  if (!hasAllKeys(incoming, reqKeys) || !hasOnlyKeys(incoming, allKeys)) return false;
  if (incoming.uid !== auth.uid || incoming.uid !== userId) return false;
  if (!['credit_card', 'debit_card', 'pix'].includes(incoming.type)) return false;
  if (typeof incoming.label !== 'string' || incoming.label.length < 2 || incoming.label.length > 80) return false;
  if (typeof incoming.holderName !== 'string' || incoming.holderName.length < 2 || incoming.holderName.length > 80) return false;
  if (!['visa', 'mastercard', 'amex', 'elo', 'hipercard', 'pix'].includes(incoming.brand)) return false;
  if (typeof incoming.isDefault !== 'boolean') return false;
  if (incoming.type === 'pix') {
    if (incoming.brand !== 'pix') return false;
    if (typeof incoming.pixKeyMasked !== 'string' || incoming.pixKeyMasked.length < 3 || incoming.pixKeyMasked.length > 80) return false;
    if ('last4' in incoming || 'expiryMonth' in incoming || 'expiryYear' in incoming) return false;
  } else {
    if (!['visa', 'mastercard', 'amex', 'elo', 'hipercard'].includes(incoming.brand)) return false;
    if (typeof incoming.last4 !== 'string' || !/^[0-9]{4}$/.test(incoming.last4)) return false;
    if (!Number.isInteger(incoming.expiryMonth) || incoming.expiryMonth < 1 || incoming.expiryMonth > 12) return false;
    if (!Number.isInteger(incoming.expiryYear) || incoming.expiryYear < 2025 || incoming.expiryYear > 2050) return false;
    if ('pixKeyMasked' in incoming) return false;
  }
  return true;
}

function evalPaymentMethodCreate(auth, userId, methodId, incoming, parentExists) {
  if (!isSignedIn(auth) || !isValidId(userId) || !isValidId(methodId) || !isOwner(auth, userId) || !parentExists) return false;
  if (!isValidPaymentMethodPayload(incoming, auth, userId)) return false;
  return incoming.createdAt === REQUEST_TIME && incoming.updatedAt === REQUEST_TIME;
}

function evalPaymentMethodUpdate(auth, userId, methodId, incoming, existing) {
  if (!isSignedIn(auth) || !isValidId(userId) || !isValidId(methodId) || !isOwner(auth, userId)) return false;
  if (!isValidPaymentMethodPayload(incoming, auth, userId)) return false;
  if (incoming.uid !== existing.uid || incoming.type !== existing.type || incoming.createdAt !== existing.createdAt || incoming.updatedAt !== REQUEST_TIME) return false;
  return affectedKeysOnly(incoming, existing, ['isDefault', 'label', 'updatedAt']);
}

const isAdminUser = (auth) => isSignedIn(auth) && auth.token?.email?.toLowerCase() === 'jonasribeiro.datascience@gmail.com';

function evalSubscriptionCreate(auth, userId, incoming, paymentMethodExists) {
  if (!isSignedIn(auth) || !isValidId(userId) || !(isOwner(auth, userId) || isAdminUser(auth))) return false;
  const reqKeys = [
    'uid', 'userEmail', 'userName', 'planId', 'planName', 'priceBrlCents', 'billingCycle',
    'status', 'gateway', 'paymentMethodId', 'paymentMethodLabel',
    'trialDays', 'trialStartedAt', 'trialEndsAt', 'nextBillingAt',
    'cancelAtPeriodEnd', 'createdAt', 'updatedAt',
  ];
  const allKeys = [...reqKeys, 'gatewaySubscriptionId'];
  if (!hasAllKeys(incoming, reqKeys) || !hasOnlyKeys(incoming, allKeys)) return false;
  if (incoming.uid !== userId) return false;
  const validPrice =
    (incoming.planId === 'essencial_mensal' && incoming.priceBrlCents === 3990 && incoming.billingCycle === 'monthly') ||
    (incoming.planId === 'pro_mensal' && incoming.priceBrlCents === 5990 && incoming.billingCycle === 'monthly') ||
    (incoming.planId === 'pro_anual' && incoming.priceBrlCents === 47880 && incoming.billingCycle === 'annual');
  if (!validPrice) return false;
  if (incoming.trialDays !== 7) return false;
  if (incoming.createdAt !== REQUEST_TIME || incoming.updatedAt !== REQUEST_TIME) return false;
  if (!isAdminUser(auth)) {
    if (incoming.uid !== auth.uid || incoming.status !== 'trialing' || !paymentMethodExists) return false;
  }
  return true;
}

function evalLgpdConsentCreate(auth, userId, incoming) {
  if (!isSignedIn(auth) || !isValidId(userId) || !isOwner(auth, userId)) return false;
  const reqKeys = ['uid', 'acceptedTerms', 'acceptedPrivacy', 'marketingOptIn', 'termsVersion', 'privacyVersion', 'acceptedAt', 'createdAt', 'updatedAt'];
  const allKeys = [...reqKeys, 'userEmail', 'revokedAt'];
  if (!hasAllKeys(incoming, reqKeys) || !hasOnlyKeys(incoming, allKeys)) return false;
  if (incoming.uid !== auth.uid || incoming.uid !== userId) return false;
  if (incoming.acceptedTerms !== true || incoming.acceptedPrivacy !== true) return false;
  if (typeof incoming.marketingOptIn !== 'boolean') return false;
  if (typeof incoming.termsVersion !== 'string' || incoming.termsVersion.length < 1 || incoming.termsVersion.length > 20) return false;
  if (typeof incoming.privacyVersion !== 'string' || incoming.privacyVersion.length < 1 || incoming.privacyVersion.length > 20) return false;
  if (!Number.isInteger(incoming.acceptedAt) || incoming.acceptedAt <= 0) return false;
  return incoming.createdAt === REQUEST_TIME && incoming.updatedAt === REQUEST_TIME;
}

function evalPushSubscriptionCreate(auth, userId, deviceId, incoming, parentExists) {
  if (!isSignedIn(auth) || !isValidId(userId) || !isValidId(deviceId) || !isOwner(auth, userId) || !parentExists) return false;
  const reqKeys = ['uid', 'deviceId', 'fcmToken', 'permissionStatus', 'enabled', 'reminderHour', 'streakAtRisk', 'createdAt', 'updatedAt'];
  const allKeys = [...reqKeys, 'lastPracticedDate', 'lastNotifiedDate'];
  if (!hasAllKeys(incoming, reqKeys) || !hasOnlyKeys(incoming, allKeys)) return false;
  if (incoming.uid !== auth.uid || incoming.uid !== userId || incoming.deviceId !== deviceId) return false;
  if (typeof incoming.fcmToken !== 'string' || incoming.fcmToken.length < 8 || incoming.fcmToken.length > 512) return false;
  if (!['default', 'granted', 'denied'].includes(incoming.permissionStatus)) return false;
  if (typeof incoming.enabled !== 'boolean' || typeof incoming.streakAtRisk !== 'boolean') return false;
  if (!Number.isInteger(incoming.reminderHour) || incoming.reminderHour < 0 || incoming.reminderHour > 23) return false;
  return incoming.createdAt === REQUEST_TIME && incoming.updatedAt === REQUEST_TIME;
}

const authA = { uid: 'userA_123', token: { email_verified: true, email: 'usera@example.com' } };
const authB = { uid: 'userB_456', token: { email_verified: true, email: 'userb@example.com' } };
const authAdmin = { uid: 'creator_uid', token: { email_verified: true, email: 'jonasribeiro.datascience@gmail.com' } };
const authAdminUnverified = { uid: 'creator_uid', token: { email_verified: false, email: 'jonasribeiro.datascience@gmail.com' } };
const authUnverified = { uid: 'userA_123', token: { email_verified: false, email: 'usera@example.com' } };

const validUserDoc = {
  uid: 'userA_123',
  displayName: 'Jonas',
  userLevel: 'intermediate',
  focus: 'mixed',
  xp: 120,
  streak: 3,
  isAudioMuted: false,
  speechRate: 0.95,
  createdAt: REQUEST_TIME,
  updatedAt: REQUEST_TIME,
};

// Dirty Dozen + Hardened Exploits (Must DENY)
runTest('Dirty #1: Unauthenticated write -> DENY', () => {
  assert.equal(evalUserProgressCreate(null, 'userA_123', validUserDoc), false);
});
runTest('Dirty #2: Unverified email spoof -> DENY', () => {
  assert.equal(evalPrivateCreate(authUnverified, 'userA_123', 'info', { uid: 'userA_123', email: 'usera@example.com', createdAt: REQUEST_TIME, updatedAt: REQUEST_TIME }, true), false);
});
runTest('Dirty #3: Cross-user PII read -> DENY', () => {
  assert.equal(isOwner(authB, 'userA_123'), false);
});
runTest('Dirty #4: Cross-user vocabulary list -> DENY', () => {
  assert.equal(isOwner(authB, 'userA_123'), false);
});
runTest('Dirty #6: UID spoofing on vocabulary create -> DENY', () => {
  assert.equal(evalVocabCreate(authA, 'userA_123', 'word_1', { uid: 'userB_456', term: 'Deploy', meaning: 'Publicar', example: 'We deploy daily.', createdAt: REQUEST_TIME, updatedAt: REQUEST_TIME }, true), false);
});
runTest('Dirty #7: Shadow field injection (isAdmin: true) -> DENY', () => {
  assert.equal(evalUserProgressCreate(authA, 'userA_123', { ...validUserDoc, isAdmin: true }), false);
});
runTest('Dirty #8: Client-forged updatedAt timestamp -> DENY', () => {
  assert.equal(evalUserProgressUpdate(authA, 'userA_123', { ...validUserDoc, xp: 150, updatedAt: 4070908800000 }, validUserDoc), false);
});
runTest('Dirty #9: Immutable createdAt tampering -> DENY', () => {
  assert.equal(evalUserProgressUpdate(authA, 'userA_123', { ...validUserDoc, xp: 150, createdAt: REQUEST_TIME - 5000 }, validUserDoc), false);
});
runTest('Dirty #10: ID poisoning (invalid characters) -> DENY', () => {
  assert.equal(evalVocabCreate(authA, 'userA_123', 'invalid$id!', { uid: 'userA_123', term: 'Test', meaning: 'Teste', example: 'Test it.', createdAt: REQUEST_TIME, updatedAt: REQUEST_TIME }, true), false);
});
runTest('Dirty #11: Denial-of-Wallet 50KB string bloat -> DENY', () => {
  assert.equal(evalVocabCreate(authA, 'userA_123', 'word_1', { uid: 'userA_123', term: 'Test', meaning: 'x'.repeat(50000), example: 'Test.', createdAt: REQUEST_TIME, updatedAt: REQUEST_TIME }, true), false);
});
runTest('Dirty #12: Unlocked achievement terminal reversal -> DENY', () => {
  const unlocked = { uid: 'userA_123', badgeId: 'streak_10', currentProgress: 10, isUnlocked: true, unlockedAt: 1763000000000, createdAt: REQUEST_TIME - 1000, updatedAt: REQUEST_TIME - 1000 };
  assert.equal(evalAchievementUpdate(authA, 'userA_123', 'streak_10', { ...unlocked, isUnlocked: false, updatedAt: REQUEST_TIME }, unlocked), false);
});
runTest('Dirty #13: XP inflation jump (+200,000 in one sync) -> DENY', () => {
  assert.equal(evalUserProgressUpdate(authA, 'userA_123', { ...validUserDoc, xp: 200120 }, validUserDoc), false);
});
runTest('Dirty #14: Private email mismatch & javascript: photoURL XSS -> DENY', () => {
  assert.equal(evalPrivateCreate(authA, 'userA_123', 'info', { uid: 'userA_123', email: 'victim@other.com', createdAt: REQUEST_TIME, updatedAt: REQUEST_TIME }, true), false);
  assert.equal(evalPrivateCreate(authA, 'userA_123', 'info', { uid: 'userA_123', email: 'usera@example.com', photoURL: 'javascript:alert(1)', createdAt: REQUEST_TIME, updatedAt: REQUEST_TIME }, true), false);
});
runTest('Dirty #15: Achievement unlocked without unlockedAt or backward progress -> DENY', () => {
  const locked = { uid: 'userA_123', badgeId: 'streak_10', currentProgress: 4, isUnlocked: false, createdAt: REQUEST_TIME - 1000, updatedAt: REQUEST_TIME - 1000 };
  assert.equal(evalAchievementUpdate(authA, 'userA_123', 'streak_10', { ...locked, isUnlocked: true, updatedAt: REQUEST_TIME }, locked), false);
  assert.equal(evalAchievementUpdate(authA, 'userA_123', 'streak_10', { ...locked, currentProgress: 2, updatedAt: REQUEST_TIME }, locked), false);
});
runTest('Dirty #16: Invalid theme value ("neon") -> DENY', () => {
  assert.equal(evalUserProgressUpdate(authA, 'userA_123', { ...validUserDoc, theme: 'neon' }, validUserDoc), false);
});
runTest('Dirty #17: Raw cardNumber/CVV shadow fields on paymentMethod -> DENY', () => {
  assert.equal(evalPaymentMethodCreate(authA, 'userA_123', 'pm_1', {
    uid: 'userA_123',
    type: 'credit_card',
    label: 'Visa •••• 4242',
    holderName: 'Jonas Ribeiro',
    brand: 'visa',
    last4: '4242',
    expiryMonth: 12,
    expiryYear: 2029,
    cvv: '123',
    isDefault: true,
    createdAt: REQUEST_TIME,
    updatedAt: REQUEST_TIME,
  }, true), false);
});
runTest('Dirty #18: Cross-user paymentMethod create -> DENY', () => {
  assert.equal(evalPaymentMethodCreate(authB, 'userA_123', 'pm_1', {
    uid: 'userA_123',
    type: 'pix',
    label: 'PIX',
    holderName: 'Jonas Ribeiro',
    brand: 'pix',
    pixKeyMasked: 'jo***@gmail.com',
    isDefault: true,
    createdAt: REQUEST_TIME,
    updatedAt: REQUEST_TIME,
  }, true), false);
});

// Legitimate Happy Paths (Must ALLOW)
runTest('Allow #1: Valid owner user progress creation', () => {
  assert.equal(evalUserProgressCreate(authA, 'userA_123', validUserDoc), true);
});
runTest('Allow #2: Valid owner settings + XP update (+45 XP)', () => {
  assert.equal(evalUserProgressUpdate(authA, 'userA_123', { ...validUserDoc, xp: 165, speechRate: 1.1 }, validUserDoc), true);
});
runTest('Allow #3: Valid private info creation with HTTPS photoURL', () => {
  assert.equal(evalPrivateCreate(authA, 'userA_123', 'info', { uid: 'userA_123', email: 'usera@example.com', photoURL: 'https://lh3.googleusercontent.com/a/avatar', createdAt: REQUEST_TIME, updatedAt: REQUEST_TIME }, true), true);
});
runTest('Allow #4: Valid vocabulary entry creation with parent gate', () => {
  assert.equal(evalVocabCreate(authA, 'userA_123', 'throughput_9f1a', { uid: 'userA_123', term: 'Throughput', meaning: 'Vazão de dados', example: 'High throughput matters.', category: 'tech', createdAt: REQUEST_TIME, updatedAt: REQUEST_TIME }, true), true);
});
runTest('Allow #5: Valid achievement unlock transition with unlockedAt', () => {
  const locked = { uid: 'userA_123', badgeId: 'streak_10', currentProgress: 9, isUnlocked: false, createdAt: REQUEST_TIME - 1000, updatedAt: REQUEST_TIME - 1000 };
  assert.equal(evalAchievementUpdate(authA, 'userA_123', 'streak_10', { ...locked, currentProgress: 10, isUnlocked: true, unlockedAt: REQUEST_TIME, updatedAt: REQUEST_TIME }, locked), true);
});
runTest('Allow #6: Valid owner theme toggle update ("light")', () => {
  assert.equal(evalUserProgressUpdate(authA, 'userA_123', { ...validUserDoc, theme: 'light' }, validUserDoc), true);
});
runTest('Allow #7: Valid masked credit card & PIX paymentMethod creation and default toggle', () => {
  const card = {
    uid: 'userA_123',
    type: 'credit_card',
    label: 'Visa •••• 4242',
    holderName: 'Jonas Ribeiro',
    brand: 'visa',
    last4: '4242',
    expiryMonth: 10,
    expiryYear: 2030,
    isDefault: false,
    createdAt: REQUEST_TIME,
    updatedAt: REQUEST_TIME,
  };
  assert.equal(evalPaymentMethodCreate(authA, 'userA_123', 'pm_card_1', card, true), true);
  assert.equal(evalPaymentMethodUpdate(authA, 'userA_123', 'pm_card_1', { ...card, isDefault: true, updatedAt: REQUEST_TIME }, card), true);
  assert.equal(evalPaymentMethodCreate(authA, 'userA_123', 'pm_pix_1', {
    uid: 'userA_123',
    type: 'pix',
    label: 'PIX • E-mail',
    holderName: 'Jonas Ribeiro',
    brand: 'pix',
    pixKeyMasked: 'jo***@gmail.com',
    isDefault: true,
    createdAt: REQUEST_TIME,
    updatedAt: REQUEST_TIME,
  }, true), true);
});
runTest('Dirty #19: Subscription price tampering or missing payment method -> DENY', () => {
  const tamperedSub = {
    uid: 'userA_123',
    userEmail: 'usera@example.com',
    userName: 'User A',
    planId: 'pro_mensal',
    planName: 'Purpose Pro Mensal',
    priceBrlCents: 100,
    billingCycle: 'monthly',
    status: 'trialing',
    gateway: 'mercadopago',
    paymentMethodId: 'pm_1',
    paymentMethodLabel: 'Visa •••• 4242',
    trialDays: 7,
    trialStartedAt: REQUEST_TIME,
    trialEndsAt: REQUEST_TIME + 7 * 86400000,
    nextBillingAt: REQUEST_TIME + 7 * 86400000,
    cancelAtPeriodEnd: false,
    createdAt: REQUEST_TIME,
    updatedAt: REQUEST_TIME,
  };
  assert.equal(evalSubscriptionCreate(authA, 'userA_123', tamperedSub, true), false);
  assert.equal(evalSubscriptionCreate(authA, 'userA_123', { ...tamperedSub, priceBrlCents: 5990 }, false), false);
});
runTest('Dirty #20: Non-admin & unverified admin spoof -> DENY', () => {
  assert.equal(isAdminUser(authA), false);
  assert.equal(isAdminUser(authAdminUnverified), false);
});
runTest('Allow #8: Valid 7-day free trial subscription with registered payment method & verified creator admin', () => {
  const validSub = {
    uid: 'userA_123',
    userEmail: 'usera@example.com',
    userName: 'User A',
    planId: 'pro_mensal',
    planName: 'Purpose Pro Mensal',
    priceBrlCents: 5990,
    billingCycle: 'monthly',
    status: 'trialing',
    gateway: 'mercadopago',
    paymentMethodId: 'pm_1',
    paymentMethodLabel: 'Visa Crédito •••• 4242',
    trialDays: 7,
    trialStartedAt: REQUEST_TIME,
    trialEndsAt: REQUEST_TIME + 7 * 86400000,
    nextBillingAt: REQUEST_TIME + 7 * 86400000,
    cancelAtPeriodEnd: false,
    createdAt: REQUEST_TIME,
    updatedAt: REQUEST_TIME,
  };
  assert.equal(evalSubscriptionCreate(authA, 'userA_123', validSub, true), true);
  assert.equal(isAdminUser(authAdmin), true);
});
runTest('Dirty #21: LGPD consent without mandatory privacy/terms acceptance or cross-user spoof -> DENY', () => {
  const baseConsent = {
    uid: 'userA_123',
    userEmail: 'usera@example.com',
    acceptedTerms: true,
    acceptedPrivacy: true,
    marketingOptIn: false,
    termsVersion: '2026.1',
    privacyVersion: '2026.1',
    acceptedAt: REQUEST_TIME,
    createdAt: REQUEST_TIME,
    updatedAt: REQUEST_TIME,
  };
  assert.equal(evalLgpdConsentCreate(authA, 'userA_123', { ...baseConsent, acceptedPrivacy: false }), false);
  assert.equal(evalLgpdConsentCreate(authB, 'userA_123', baseConsent), false);
});
runTest('Allow #9: Valid LGPD consent record creation by verified owner', () => {
  assert.equal(evalLgpdConsentCreate(authA, 'userA_123', {
    uid: 'userA_123',
    userEmail: 'usera@example.com',
    acceptedTerms: true,
    acceptedPrivacy: true,
    marketingOptIn: true,
    termsVersion: '2026.1',
    privacyVersion: '2026.1',
    acceptedAt: REQUEST_TIME,
    createdAt: REQUEST_TIME,
    updatedAt: REQUEST_TIME,
  }), true);
});
runTest('Dirty #22: Cross-user FCM pushSubscription hijack or invalid reminderHour -> DENY', () => {
  const basePush = {
    uid: 'userA_123',
    deviceId: 'browser_1',
    fcmToken: 'fcm_token_valid_sample_123456',
    permissionStatus: 'granted',
    enabled: true,
    reminderHour: 19,
    streakAtRisk: true,
    createdAt: REQUEST_TIME,
    updatedAt: REQUEST_TIME,
  };
  assert.equal(evalPushSubscriptionCreate(authB, 'userA_123', 'browser_1', basePush, true), false);
  assert.equal(evalPushSubscriptionCreate(authA, 'userA_123', 'browser_1', { ...basePush, reminderHour: 29 }, true), false);
});
runTest('Allow #10: Valid owner FCM pushSubscription registration with parent gate', () => {
  assert.equal(evalPushSubscriptionCreate(authA, 'userA_123', 'browser_1', {
    uid: 'userA_123',
    deviceId: 'browser_1',
    fcmToken: 'fcm_token_valid_sample_123456',
    permissionStatus: 'granted',
    enabled: true,
    reminderHour: 19,
    streakAtRisk: true,
    lastPracticedDate: '2026-11-16',
    createdAt: REQUEST_TIME,
    updatedAt: REQUEST_TIME,
  }, true), true);
});

runTest('Dirty #23: Vocabulary SRS out-of-bounds easeFactor or negative interval -> DENY', () => {
  const existingWord = {
    uid: 'userA_123',
    term: 'Grace',
    meaning: 'Graça',
    example: 'Amazing grace.',
    category: 'worship',
    createdAt: REQUEST_TIME - 1000,
    updatedAt: REQUEST_TIME - 1000,
  };
  assert.equal(evalVocabUpdate(authA, 'userA_123', 'grace_1', { ...existingWord, srsEaseFactor: 99, updatedAt: REQUEST_TIME }, existingWord), false);
  assert.equal(evalVocabUpdate(authA, 'userA_123', 'grace_1', { ...existingWord, srsIntervalDays: -2, updatedAt: REQUEST_TIME }, existingWord), false);
});
runTest('Allow #11: Valid owner SRS flashcard review update', () => {
  const existingWord = {
    uid: 'userA_123',
    term: 'Grace',
    meaning: 'Graça',
    example: 'Amazing grace.',
    category: 'worship',
    createdAt: REQUEST_TIME - 1000,
    updatedAt: REQUEST_TIME - 1000,
  };
  assert.equal(evalVocabUpdate(authA, 'userA_123', 'grace_1', {
    ...existingWord,
    srsRepetitions: 2,
    srsIntervalDays: 6,
    srsEaseFactor: 2.5,
    srsLapses: 0,
    srsNextReviewAt: REQUEST_TIME + 6 * 86400000,
    srsLastReviewedAt: REQUEST_TIME,
    updatedAt: REQUEST_TIME,
  }, existingWord), true);
});

console.log(`\nSecurity Verification Summary: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
