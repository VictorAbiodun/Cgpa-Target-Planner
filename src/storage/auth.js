import {
  GoogleAuthProvider,
  signInWithPopup,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase.js';
import { clearLocalData } from './storage.js';

const EMAIL_LINK_KEY = 'cgpa_email_link_for_signin';

/**
 * Friendly student-level error messages with typographic apostrophe ’
 */
export function getAuthErrorMessage(error) {
  if (!error) return '';
  const code = error.code || '';
  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/user-not-found':
      return 'No account found with this email. Try creating an account instead.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please try again or reset your password.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email. Sign in instead.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed before completing. Please try again.';
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled.';
    case 'auth/popup-blocked':
      return 'The sign-in popup was blocked by your browser. Please allow popups for this site.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes before trying again.';
    default:
      return error.message || 'Something went wrong while signing in. Please try again.';
  }
}

/**
 * 1. Google Sign-in with popup
 */
export async function signInWithGoogle() {
  if (!auth) throw new Error('Firebase Auth is not configured.');
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

/**
 * 2. Passwordless Email Link: Send sign-in link to student email
 */
export async function sendMagicSignInLink(email) {
  if (!auth) throw new Error('Firebase Auth is not configured.');
  const actionCodeSettings = {
    url: typeof window !== 'undefined' ? window.location.href : 'http://localhost:5173/',
    handleCodeInApp: true,
  };
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(EMAIL_LINK_KEY, email);
  }
}

/**
 * 2b. Passwordless Email Link: Check if current URL is a sign-in email link
 */
export function checkIsSignInWithEmailLink(url) {
  if (!auth) return false;
  return isSignInWithEmailLink(auth, url || (typeof window !== 'undefined' ? window.location.href : ''));
}

/**
 * 2c. Passwordless Email Link: Complete sign-in
 */
export async function completeMagicSignIn(email, url) {
  if (!auth) throw new Error('Firebase Auth is not configured.');
  const targetUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const storedEmail =
    email ||
    (typeof window !== 'undefined' && window.localStorage
      ? window.localStorage.getItem(EMAIL_LINK_KEY)
      : null);

  if (!storedEmail) {
    throw new Error('Please enter your email address to complete sign-in.');
  }

  const result = await signInWithEmailLink(auth, storedEmail, targetUrl);
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(EMAIL_LINK_KEY);
    window.history.replaceState({}, document.title, window.location.pathname);
  }
  return result.user;
}

/**
 * 3a. Email + Password Sign-in
 */
export async function signInWithEmailPassword(email, password) {
  if (!auth) throw new Error('Firebase Auth is not configured.');
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

/**
 * 3b. Email + Password Sign-up (Account creation)
 */
export async function signUpWithEmailPassword(email, password) {
  if (!auth) throw new Error('Firebase Auth is not configured.');
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user;
}

/**
 * 3c. Send password reset email
 */
export async function sendPasswordReset(email) {
  if (!auth) throw new Error('Firebase Auth is not configured.');
  await sendPasswordResetEmail(auth, email);
}

/**
 * Sign out and wipe device cache for privacy
 */
export async function signOutStudent(uid) {
  if (uid) {
    await clearLocalData(uid);
  }
  if (!auth) return;
  await signOut(auth);
}

/**
 * Subscribe to Auth state changes
 */
export function subscribeToAuth(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export { isFirebaseConfigured };
