// SafeSpend — local storage access layer.
//
// This is the single place the app reads and writes its persisted state.
// Today it only talks to localStorage, and behavior is byte-for-byte
// identical to the inline code in App.tsx it replaced. It exists as a
// deliberate seam: Phase 1 of the optional cloud-sync groundwork
// (claude/safespend_sync_implementation_plan.md in the "الخبراء" project).
// A later phase will extend saveAppState() to also push changes to Supabase
// in the background ONLY when a user has explicitly opted in to cloud sync
// — nothing here changes that opt-in default, and localStorage stays the
// source of truth for anyone who never turns sync on.
//
// Do not add new localStorage.getItem/setItem('safespend-v1', ...) calls
// elsewhere in the app — always go through loadAppState()/saveAppState() so
// there is exactly one place to extend later.

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
}
