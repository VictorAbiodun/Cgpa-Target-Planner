import { app } from './firebase.js';

const FCM_TOKEN_KEY = 'cgpa_fcm_token';

/**
 * Check if the browser supports notifications and service worker
 */
export function isNotificationSupported() {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator
  );
}

/**
 * Get current permission state: 'granted' | 'denied' | 'default'
 */
export function getNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Request notification permission and get FCM device token
 */
export async function requestNotificationPermission() {
  if (!isNotificationSupported()) {
    return { status: 'unsupported' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { status: permission };
    }

    if (!app) {
      return { status: 'granted' };
    }

    // Dynamically load firebase/messaging only when permission is granted
    const { isSupported, getMessaging, getToken } = await import('firebase/messaging');
    const supported = await isSupported();
    if (!supported) {
      return { status: 'granted' };
    }

    const messaging = getMessaging(app);
    const env = (typeof import.meta !== 'undefined' && import.meta.env)
      ? import.meta.env
      : (typeof process !== 'undefined' && process.env)
      ? process.env
      : {};
    const vapidKey = env.VITE_FIREBASE_VAPID_KEY;

    let token = null;
    try {
      token = await getToken(messaging, vapidKey ? { vapidKey } : undefined);
    } catch (err) {
      console.warn('Could not retrieve FCM token with VAPID key:', err);
    }

    if (token && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(FCM_TOKEN_KEY, token);
    }

    return { status: 'granted', token };
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return { status: 'error', error: err.message };
  }
}

/**
 * Check if the user already has notifications enabled
 */
export function hasNotificationToken() {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  return Boolean(window.localStorage.getItem(FCM_TOKEN_KEY));
}
