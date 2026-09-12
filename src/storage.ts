// SafeSpend — local storage access layer.
//
// This is the single place the app reads and writes its persisted state.
// localStorage remains the source of truth for every user, including
// those who opt in to cloud sync — saveAppState() below still writes to
// localStorage FIRST, unconditionally, exactly as before.
//
// Phase 4 (claude/safespend_sync_implementation_plan.md in the "الخبراء"
// project) added one addition: after the local write, saveAppState() also
// tells syncEngine.ts about the new state via schedulePush(). That call is
// a silent no-op unless the user has an active Supabase Auth session (see
// ManagementScreens.tsx's "Cloud Sync" card) — someone who never opens
// that card or never signs in sees zero behavior change here.
//
// Do not add new localStorage.getItem/setItem('safespend-v1', ...) calls
// elsewhere in the app — always go through loadAppState()/saveAppState() so
// there is exactly one place this is wired to cloud sync.

import { schedulePush } from './syncEngine';

const STORAGE_KEY = 'safespend-v1';

// C10 fix (carried over from App.tsx): localStorage.getItem itself can throw
// (private/incognito browsing, an iframe with storage blocked, or strict
// privacy settings that disable Storage entirely) — not just JSON.parse. The
// access itself must be inside the try, not just the parse step, or a
// throwing getItem crashes the whole app to a blank white screen on first
// load (there is no Error Boundary — see C12).
export function loadAppState(): any | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch (e) {
    console.error("Error reading saved state", e);
    return null;
  }
}

// C11 fix (carried over from App.tsx): a full localStorage (QuotaExceededError
// after years of transaction history, or a private-browsing quota of 0) used
// to throw here uncaught and crash the whole app on the next user action.
export function saveAppState(state: Record<string, unknown>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Error auto-saving state", e);
  }
  // Phase 4: background cloud push (no-op unless sync is enabled — see
  // syncEngine.ts's file header for the full behavior).
  schedulePush(state);
}
