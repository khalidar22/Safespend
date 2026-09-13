// SafeSpend — cloud sync engine (Phase 4).
//
// Push-only for now: whenever a user has opted in to cloud sync (see
// supabaseClient.ts + ManagementScreens.tsx "Cloud Sync" card) and is
// signed in, every local save also gets pushed to Supabase in the
// background via upsert on public.app_state. This is intentionally
// one-way (local -> cloud) in this phase — pulling state down onto a
// second device is Phase 5
// (claude/safespend_sync_implementation_plan.md in the "الخبراء" project).
//
// Nothing here changes behavior for anyone who hasn't signed in:
// schedulePush()/pushNow() check for an active Supabase Auth session first
// and are silent no-ops without one.
//
// Debouncing: storage.ts's saveAppState() calls schedulePush() on every
// local save, which can happen many times per second while a user is
// editing. schedulePush() waits DEBOUNCE_MS of quiet before actually
// sending, and always sends only the LATEST state, so a burst of edits
// produces one network request, not dozens.
//
// Offline handling: if a push fails (including "no network"), the failed
// state is kept as pendingState and retried automatically — immediately
// when the browser fires an 'online' event, and passively the next time
// schedulePush() runs (e.g. the next local save). Nothing is lost: the
// freshest state is always what gets sent next.
//
// Conflict handling: `updated_at` on public.app_state is kept current by a
// database trigger (set_app_state_updated_at, added in the Phase 4 SQL
// step), not by client code — so "last write wins" always compares a
// server-assigned timestamp, immune to a device's clock being wrong.

import { supabase } from './supabaseClient';

const DEBOUNCE_MS = 2000;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingState: Record<string, unknown> | null = null;
let pushInFlight = false;

// ---------------------------------------------------------------------------
// Phase 5c — sync base point ("which cloud version was I last in step with?")
//
// Without this, a device can see that the cloud differs from itself but cannot
// tell WHY, and the two cases need opposite handling:
//   • the cloud is simply a NEWER version of this same data (another device
//     saved after me) -> pull it down, silently. No question belongs here.
//   • the cloud DIVERGED (it changed, and I also changed, independently)
//     -> genuinely ambiguous, ask the user.
// Both look identical without a base point, so every ordinary update turned
// into a conflict prompt. Remembering the cloud's `updated_at` as of the last
// successful sync — the same idea as a merge base in git — separates them.
//
// `dirty` marks that a local save happened after that point. storage.ts sets
// it, but only when the saved content actually changed: the app re-saves
// identical state on every launch, and treating that as a local edit would
// make a freshly-opened device look like it had diverged.
// ---------------------------------------------------------------------------

const SYNC_META_KEY = 'safespend-sync-meta-v1';

export interface SyncMeta {
  baseUpdatedAt: string | null;
  dirty: boolean;
}

const DEFAULT_META: SyncMeta = { baseUpdatedAt: null, dirty: false };

export function loadSyncMeta(): SyncMeta {
  if (typeof window === 'undefined') return { ...DEFAULT_META };
  try {
    const raw = localStorage.getItem(SYNC_META_KEY);
    if (!raw) return { ...DEFAULT_META };
    const parsed = JSON.parse(raw);
    return {
      baseUpdatedAt: typeof parsed?.baseUpdatedAt === 'string' ? parsed.baseUpdatedAt : null,
      dirty: parsed?.dirty === true,
    };
  } catch {
    return { ...DEFAULT_META };
  }
}

function saveSyncMeta(meta: SyncMeta): void {
  try {
    localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta));
  } catch (e) {
    console.error('SafeSpend cloud sync: could not save sync meta', e);
  }
}

/** Called by storage.ts when a local save genuinely changed the stored state. */
export function markLocalDirty(): void {
  const meta = loadSyncMeta();
  if (!meta.dirty) saveSyncMeta({ ...meta, dirty: true });
}

/** Records that this device is now exactly in step with the given cloud version. */
export function markSynced(cloudUpdatedAt: string | null): void {
  saveSyncMeta({ baseUpdatedAt: cloudUpdatedAt, dirty: false });
}

export function clearSyncMeta(): void {
  try {
    localStorage.removeItem(SYNC_META_KEY);
  } catch { /* nothing we can do */ }
}

// ---------------------------------------------------------------------------
// Comparison helpers (shared by the app-level auto-sync and the Settings UI)
// ---------------------------------------------------------------------------

// Only these four collections start EMPTY on a brand-new install. Commitments,
// goals and saving boxes ship pre-filled with defaults, so counting those would
// mark every fresh device as "already has data".
const ACTIVITY_KEYS = ['transactions', 'installments', 'familyMembers', 'billSplits'] as const;

export function countActivity(state: any): number {
  if (!state || typeof state !== 'object') return 0;
  return ACTIVITY_KEYS.reduce(
    (total, key) => total + (Array.isArray(state[key]) ? state[key].length : 0),
    0,
  );
}

export function hasRecordedActivity(state: any): boolean {
  return countActivity(state) > 0;
}

// Stable stringify with sorted object keys. Plain JSON.stringify is not usable
// here: the cloud copy round-trips through Postgres `jsonb`, which does NOT
// preserve key order, so two identical states would serialize differently and
// look like a conflict. Array order IS preserved on purpose — the order of
// transactions is real information.
function canonicalJson(value: any): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']';
  return '{' + Object.keys(value).sort()
    .map((k) => JSON.stringify(k) + ':' + canonicalJson(value[k]))
    .join(',') + '}';
}

// The collections holding the user's actual records. Interface preferences
// (language, hidden balances, premium flag…) are deliberately excluded: a
// different toggle is not a data conflict.
const DATA_KEYS = [
  'transactions', 'installments', 'familyMembers', 'billSplits',
  'commitments', 'goals', 'savingBoxes', 'linkedBankAccounts', 'kidsCards',
] as const;

export function sameUserData(a: any, b: any): boolean {
  if (!a || !b) return false;
  return DATA_KEYS.every((key) => canonicalJson(a[key]) === canonicalJson(b[key]));
}

// Phase 5 safety gate. While a second device is deciding which copy to keep
// (its own or the cloud's), pushing MUST stop: any stray background save —
// even just opening a screen — would overwrite the very cloud copy the user
// is still looking at and choosing between. Pauses hold the state in
// pendingState, so nothing is lost; it goes out as soon as sync resumes.
let syncPaused = false;

export function pauseSync(): void {
  syncPaused = true;
}

export function resumeSync(): void {
  syncPaused = false;
  if (pendingState && !pushInFlight) doPush(pendingState);
}

// Phase 5: read this user's cloud copy. Returns ok:true with state:null when
// the account simply has no row yet (a first-ever sign-in) — that is a normal
// result, not an error.
export async function pullState(): Promise<{ ok: boolean; state: any | null; updatedAt: string | null; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { ok: false, state: null, updatedAt: null, error: 'not-signed-in' };

    const { data, error } = await supabase
      .from('app_state')
      .select('state, updated_at')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (error) return { ok: false, state: null, updatedAt: null, error: error.message };
    return { ok: true, state: data?.state ?? null, updatedAt: data?.updated_at ?? null };
  } catch (e: any) {
    return { ok: false, state: null, updatedAt: null, error: e?.message || 'network-error' };
  }
}

async function doPush(state: Record<string, unknown>): Promise<void> {
  if (syncPaused) {
    // Hold it — resumeSync() will send the latest state.
    pendingState = state;
    return;
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    // Not signed in -> sync not enabled for this user. Silent no-op.
    pendingState = null;
    return;
  }

  pushInFlight = true;
  try {
    // `.select()` so the row's server-assigned updated_at comes back — that
    // value becomes this device's new base point.
    const { data, error } = await supabase
      .from('app_state')
      .upsert({ user_id: session.user.id, state }, { onConflict: 'user_id' })
      .select('updated_at')
      .single();

    if (error) {
      console.error('SafeSpend cloud sync: push failed, will retry', error);
      pendingState = state; // keep the latest state around for the next retry
    } else {
      pendingState = null;
      markSynced(data?.updated_at ?? null);
    }
  } catch (e) {
    console.error('SafeSpend cloud sync: push failed (network?), will retry', e);
    pendingState = state;
  } finally {
    pushInFlight = false;
  }
}

// Called from storage.ts on every local save. Debounced — see file header.
export function schedulePush(state: Record<string, unknown>): void {
  pendingState = state;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    if (pendingState && !pushInFlight) {
      doPush(pendingState);
    }
  }, DEBOUNCE_MS);
}

// Retry immediately when the browser regains connectivity, instead of
// waiting for the next local save to trigger schedulePush() again.
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    if (pendingState && !pushInFlight) {
      doPush(pendingState);
    }
  });
}

// Phase 4 "first activation": called once right after a user successfully
// signs in (see ManagementScreens.tsx), to upload whatever is already
// saved locally on this device immediately, rather than waiting for the
// next edit to trigger the debounced push above.
export async function pushNow(state: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { ok: false, error: 'not-signed-in' };
  }
  try {
    const { data, error } = await supabase
      .from('app_state')
      .upsert({ user_id: session.user.id, state }, { onConflict: 'user_id' })
      .select('updated_at')
      .single();
    if (error) {
      pendingState = state;
      return { ok: false, error: error.message };
    }
    pendingState = null;
    markSynced(data?.updated_at ?? null);
    return { ok: true };
  } catch (e: any) {
    pendingState = state;
    return { ok: false, error: e?.message || 'network-error' };
  }
}

// ---------------------------------------------------------------------------
// Phase 5c — the decision engine, shared by App.tsx (runs on every app open
// and whenever the tab becomes visible again) and by the Settings screen.
//
// It only READS. Applying the outcome is the caller's job, because pulling
// means replacing app state and only the app can do that.
// ---------------------------------------------------------------------------

export type ReconcileOutcome =
  | { action: 'none' }                                   // already in step
  | { action: 'push' }                                   // this device is ahead
  | { action: 'pull'; state: any; updatedAt: string | null }   // cloud is ahead
  | { action: 'conflict'; state: any; updatedAt: string | null } // both moved
  | { action: 'error'; error: string };

export async function decideReconcile(localState: any): Promise<ReconcileOutcome> {
  const result = await pullState();
  if (!result.ok) return { action: 'error', error: result.error || 'unknown' };

  const cloudState = result.state;
  const cloudUpdatedAt = result.updatedAt;

  // No cloud row yet — this account's first ever sync.
  if (!cloudState) return { action: 'push' };

  // Identical records? Then there is nothing to do or ask, whatever the
  // bookkeeping says. Checking content first also absorbs a spurious `dirty`
  // flag (e.g. a derived field recomputed at launch).
  if (sameUserData(localState, cloudState)) {
    markSynced(cloudUpdatedAt);
    return { action: 'none' };
  }

  const meta = loadSyncMeta();
  const cloudMoved = meta.baseUpdatedAt === null || cloudUpdatedAt !== meta.baseUpdatedAt;
  const localMoved = meta.dirty;

  // Cloud is untouched since we last synced -> our changes are simply newer.
  if (!cloudMoved) return { action: 'push' };

  // Cloud moved and we did not -> the cloud is a newer version of our own
  // data. Take it; there is nothing of ours to lose.
  if (!localMoved) return { action: 'pull', state: cloudState, updatedAt: cloudUpdatedAt };

  // Both moved independently, OR this device has no base point yet and both
  // sides hold records. That is the genuinely ambiguous case — ask.
  if (hasRecordedActivity(localState) && hasRecordedActivity(cloudState)) {
    return { action: 'conflict', state: cloudState, updatedAt: cloudUpdatedAt };
  }

  // One side has no real records: prefer whichever actually holds data.
  if (hasRecordedActivity(cloudState)) {
    return { action: 'pull', state: cloudState, updatedAt: cloudUpdatedAt };
  }
  return { action: 'push' };
}
