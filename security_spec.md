# Security Specification — Purpose Talk Firestore (Hardened)

## 1. Data Invariants
1. **Strict Ownership & Email Verification**: All user progress, private info, vocabulary entries, achievement milestones, and pronunciation logs belong to a single authenticated, email-verified user (`request.auth.uid == userId && request.auth.token.email_verified == true`).
2. **PII Isolation & Email Integrity**: User PII (`email`, `photoURL`) is stored exclusively under `/users/{userId}/private/info`, never exposed in list queries or cross-user reads, requires `email` to match `request.auth.token.email`, and restricts `photoURL` to `https://` URLs.
3. **Master Gate**: Subcollection documents (`/vocabulary`, `/achievements`, `/pronunciationLogs`, `/private/info`) cannot be orphaned; creation requires the parent `/users/{userId}` document to exist.
4. **Immutable Ownership & Temporal Integrity**: `uid` and `createdAt` cannot be modified after creation. Server timestamps (`request.time`) are strictly enforced on `createdAt` (create) and `updatedAt` (create/update).
5. **Anti-Inflation Progress Guards**: `xp` is bounded (`0..500,000` total, max `50,000` on account creation, max `+10,000` delta per update, monotonic non-decreasing); `streak` is bounded (`0..3,650`, max `+30` per update).
6. **Terminal Achievement Unlock Lock**: Once an achievement badge reaches `isUnlocked == true`, neither `isUnlocked` nor `unlockedAt` may be reverted or altered; while locked, `unlockedAt` must be absent, and `currentProgress` cannot regress.
7. **Strict Schema & Boundary Enforcement**: Every string has explicit `.size()` bounds, enums are allowlisted, unknown shadow keys are rejected via `hasAll` + `hasOnly` + `affectedKeys().hasOnly(...)`, and document IDs match `^[a-zA-Z0-9_\-]+$`.

8. **PCI-Safe Masked Payment Metadata**: `/users/{userId}/paymentMethods/{methodId}` stores strictly masked metadata (`last4` 4 digits + `expiryMonth`/`expiryYear` for cards, or `pixKeyMasked` for PIX) and rejects any extra/shadow fields such as full card numbers or CVV codes via `hasOnly()`.
9. **Creator Admin RBAC & 7-Day Trial Billing Integrity**: Only verified creator admin (`jonasribeiro.datascience@gmail.com` or `/admins/{uid}`) may list all `/users` and `/subscriptions`. Self-service `/subscriptions/{userId}` creation requires `trialDays == 7`, server-locked BRL pricing (`3990`, `5990`, `47880`), `status == 'trialing'`, and an existing registered payment method (`exists(.../paymentMethods/...)`).
10. **LGPD Consent Audit Integrity**: `/lgpdConsents/{userId}` enforces strict owner creation (`acceptedTerms == true && acceptedPrivacy == true`), immutable audit log (`allow delete: if false`), server timestamps, and admin-only global audit listing.
11. **Owner-Scoped FCM Push Tokens**: `/users/{userId}/pushSubscriptions/{deviceId}` restricts FCM tokens and streak-reminder preferences exclusively to the authenticated owner (`isOwner(userId)`), enforcing `deviceId` regex/length bounds, hour bounds (`0..23`), and parent existence.
12. **Bounded Spaced Repetition (SRS) Metadata**: `/users/{userId}/vocabulary/{wordId}` enforces strict numeric bounds on SM-2 fields (`srsRepetitions <= 10000`, `srsIntervalDays <= 3650`, `1.3 <= srsEaseFactor <= 4.0`, `srsLapses <= 10000`) and isolates SRS updates via `affectedKeys().hasOnly(...)`.

## 2. Adversarial Payloads Tested (Must Return PERMISSION_DENIED)
1. **Unauthenticated Write**: Writing `/users/userA` with `request.auth == null`.
2. **Unverified Email Spoof**: Writing `/users/userA/private/info` with `request.auth.uid == 'userA'` and `request.auth.token.email_verified == false`.
3. **Cross-User Read (PII Leak)**: `userB` attempting `get` on `/users/userA/private/info`.
4. **Cross-User List**: `userB` attempting `list` on `/users/userA/vocabulary`.
5. **Blanket Users Scrape**: Authenticated `userA` attempting `list` on `/users`.
6. **UID Spoofing on Create**: `userA` creating `/users/userA/vocabulary/w1` with `uid: "userB"`.
7. **Shadow Field Injection**: `userA` creating `/users/userA` with an unexpected `isAdmin: true` or `role: "admin"` field.
8. **Client-Forged Timestamp**: `userA` updating `/users/userA` with `updatedAt: Timestamp(2099-01-01)` instead of `request.time`.
9. **Immutable Field Tampering**: `userA` updating `/users/userA` with a modified `createdAt` or `uid`.
10. **ID Poisoning**: `userA` creating `/users/userA/vocabulary/invalid$id!with/slashes` or >128 char ID.
11. **Denial-of-Wallet String Bloat**: `userA` writing a 50,000-character `meaning` or `example` in `/users/userA/vocabulary/w1`.
12. **Achievement Terminal Reversal**: `userA` updating an already unlocked `/users/userA/achievements/streak_10` back to `isUnlocked: false`.
13. **XP Inflation Exploit**: `userA` updating `/users/userA` from `xp: 120` directly to `xp: 500000` in one sync.
14. **Private Email Spoofing / XSS Photo URL**: `userA` writing a mismatched `email` or `javascript:alert(1)` in `photoURL`.
15. **Achievement State Desync**: `userA` writing `isUnlocked: true` without `unlockedAt`, or decreasing `currentProgress`.
16. **Raw Card/CVV Field Injection**: `userA` creating `/users/userA/paymentMethods/pm_1` with `cvv` or full `cardNumber` shadow fields.
17. **Subscription Price / Trial Tampering**: `userA` creating `/subscriptions/userA` with `priceBrlCents: 100` or without a registered payment method.
18. **Non-Admin Creator Dashboard Scrape**: Regular user attempting `list` on `/subscriptions` or `/users`, or unverified email admin spoof.
19. **LGPD Consent Spoofing / Missing Mandatory Acceptance**: `userB` writing `/lgpdConsents/userA` or `userA` creating `/lgpdConsents/userA` with `acceptedPrivacy: false`.
20. **Cross-User FCM Push Token Hijack / Invalid Hour**: `userB` creating `/users/userA/pushSubscriptions/dev1` or setting `reminderHour: 99`.
21. **Vocabulary SRS Out-of-Bounds Tampering**: `userA` updating `/users/userA/vocabulary/w1` with `srsEaseFactor: 99` or negative `srsIntervalDays: -5`.
