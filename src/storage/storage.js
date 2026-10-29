import {
  getLocalProfile,
  setLocalProfile,
  clearLocalProfile,
  requestPersistentStorage,
} from './db.js';

let syncListeners = new Set();
let currentSyncStatus = 'idle'; // 'idle' | 'saving' | 'synced' | 'error'

export function subscribeSyncStatus(fn) {
  syncListeners.add(fn);
  fn(currentSyncStatus);
  return () => syncListeners.delete(fn);
}

function notifySyncStatus(status) {
  currentSyncStatus = status;
  syncListeners.forEach((fn) => fn(status));
}

/**
 * Compact profile representation per AGENTS.md (1 to 3 KB)
 * Only student results and target parameters are stored; no calculated verdicts or plans.
 */
export function sanitizeProfile(state) {
  return {
    schemaVersion: 1,
    updatedAt: Date.now(),
    maxLoad: state.maxLoad ?? 24,
    stage: state.stage ?? null,
    method: state.method ?? 'courses',
    summary: state.summary ?? { units: '', cgpa: '' },
    points: state.points ?? { units: '', points: '' },
    entries: state.entries ?? [],
    semesterNo: state.semesterNo ?? 1,
    counts: state.counts ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    courseOptions: state.courseOptions ?? {},
    target: state.target ?? { mode: 'class', className: 'First Class', cgpa: '4.50' },
  };
}

/**
 * Write to student's device immediately (IndexedDB + localStorage backup)
 */
export async function saveProfileLocally(uid, state) {
  if (!uid) return;
  notifySyncStatus('saving');
  try {
    const profile = sanitizeProfile(state);
    // 1. Primary device cache: IndexedDB
    await setLocalProfile(uid, profile);
    // 2. Secondary device cache: localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('cgpa_profile_' + uid, JSON.stringify(profile));
    }
    notifySyncStatus('synced');
  } catch (err) {
    console.error('Failed to save profile to device cache:', err);
    notifySyncStatus('error');
  }
}

let debounceTimer = null;

/**
 * Debounced device save (batches rapid updates like typing or stepper clicks)
 */
export function debouncedSaveProfile(uid, state, delayMs = 600) {
  if (!uid) return;
  notifySyncStatus('saving');
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    saveProfileLocally(uid, state);
  }, delayMs);
}

/**
 * Load student profile from device cache (IndexedDB first, localStorage fallback)
 */
export async function loadProfileLocally(uid) {
  if (!uid) return null;
  try {
    // 1. Check IndexedDB
    const idbProfile = await getLocalProfile(uid);
    if (idbProfile) return idbProfile;

    // 2. Fallback to localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem('cgpa_profile_' + uid);
      if (raw) return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to load profile from device cache:', err);
  }
  return null;
}

/**
 * Wipe all cached student data upon sign-out or account deletion
 */
export async function clearLocalData(uid) {
  try {
    await clearLocalProfile(uid);
    if (typeof window !== 'undefined' && window.localStorage) {
      if (uid) {
        window.localStorage.removeItem('cgpa_profile_' + uid);
      } else {
        Object.keys(window.localStorage)
          .filter((k) => k.startsWith('cgpa_profile_'))
          .forEach((k) => window.localStorage.removeItem(k));
      }
    }
  } catch (err) {
    console.error('Failed to clear device cache:', err);
  }
}

export { requestPersistentStorage };
