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

// ---------------------------------------------------------------------------
// Phase 5 — conflict backup ("keep the losing copy")
//
// When a device and the cloud both hold real data, the user picks one and the
// other is replaced. Replacing without a trace is how budgeting apps lose
// people's records for good — Wallet by BudgetBakers, for instance, documents
// that its cloud backups "cannot be used to restore data that you have
// personally deleted", leaving manual CSV export as the only safety net.
//
// So before either side is overwritten we snapshot the LOSING copy here,
// under its own key. That mirrors how Dropbox and Obsidian handle an
// unmergeable conflict: keep both, destroy nothing, let the person sort it
// out afterwards. This key is completely separate from STORAGE_KEY — it is
// never synced, never pushed, and never touched by saveAppState().
// ---------------------------------------------------------------------------

const CONFLICT_BACKUP_KEY = 'safespend-conflict-backup-v1';

export interface ConflictBackup {
  state: any;
  /** Which copy was discarded: the one on this device, or the cloud's. */
  source: 'device' | 'cloud';
  /** ISO timestamp of when the user made the choice. */
  savedAt: string;
}

export function saveConflictBackup(backup: ConflictBackup): boolean {
  try {
    localStorage.setItem(CONFLICT_BACKUP_KEY, JSON.stringify(backup));
    return true;
  } catch (e) {
    console.error('Error saving conflict backup', e);
    return false;
  }
}

export function loadConflictBackup(): ConflictBackup | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(CONFLICT_BACKUP_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data);
    if (!parsed || typeof parsed !== 'object' || !parsed.state) return null;
    return parsed as ConflictBackup;
  } catch (e) {
    console.error('Error reading conflict backup', e);
    return null;
  }
}

export function clearConflictBackup(): void {
  try {
    localStorage.removeItem(CONFLICT_BACKUP_KEY);
  } catch (e) {
    console.error('Error clearing conflict backup', e);
  }
}
