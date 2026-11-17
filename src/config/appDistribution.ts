export const ANDROID_PACKAGE_NAME =
  (import.meta.env.VITE_ANDROID_PACKAGE_NAME as string | undefined)?.trim() ||
  'app.purposetalk.twa';

export const GOOGLE_PLAY_STORE_URL =
  (import.meta.env.VITE_GOOGLE_PLAY_URL as string | undefined)?.trim() ||
  `https://play.google.com/store/apps/details?id=${encodeURIComponent(ANDROID_PACKAGE_NAME)}`;
