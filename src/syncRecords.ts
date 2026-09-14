// SafeSpend — record-level cloud sync (Phase 7).
//
// Replaces the whole-blob sync that lost data on 14 Sep 2026. The design,
// the post-mortem, and the two-reviewer findings that shaped this version
// live in the "الخبراء" project:
//   claude/safespend_phase7_record_sync_design.md
//   claude/safespend_sync_open_bug_data_loss.md
//   claude/safespend_phase7_review_findings.md
//
// Why this exists at all: the old engine pushed the ENTIRE app state on every
// local save. A device holding stale data would overwrite the account with it
// the moment it opened, and the other device would then faithfully pull that
// older copy down — one wrong push destroyed everything. Here each record is
// its own row, so an expense added on one device and another added on a second
// device are simply two different rows. They both survive; there is no
// conflict to resolve, because they were never competing for the same slot.
//
// Rules that hold this together:
//
//   1. DELETES ARE TOMBSTONES. A deleted record is marked `deleted = true` in
//      the cloud, never removed. Without that, a device that hasn't heard
//      about the deletion would treat the record as "missing locally, present
//      in the cloud" and resurrect it on the next merge.
//
//   2. A TOMBSTONE CAN NEVER BE REVERSED, BY DESIGN, ENFORCED SERVER-SIDE.
//      A pre-launch review found that an offline device editing a record
//      someone else already deleted would push a plain upsert that could
//      land after the tombstone and silently undelete it. SafeSpend never
//      lets a user "undelete" an id (recreating something always gets a new
//      id), so a Postgres trigger (`trg_app_records_prevent_undelete`,
//      applied directly to the live project) now refuses any write that
//      flips `deleted: true` back to `false`. This is enforced in the
//      database, not trusted to client code.
//
//   3. LOCAL CHANGES ARE FOUND BY COMPARING TO A SNAPSHOT of what this device
//      held at its last successful sync — not by watching for save events.
//      Watching saves is what broke the previous attempt: applying a pull is
//      itself a save, so a device marked itself "changed" the instant it
//      accepted cloud data.
//
//   4. NOTHING IS PUSHED BEFORE A SUCCESSFUL SYNC. Until this session has
//      completed one full cycle, pushes are refused (and the state kept
//      pending, not dropped). This gate is precisely what was missing when
//      data was lost.
//
//   5. SETTINGS SYNC THROUGH THIS SAME GATED ENGINE, AS ONE PSEUDO-RECORD
//      (collection 'settings', record_id 'prefs'). The first version of this
//      file left settings on the OLD engine's unconditional `schedulePush` —
//      which has no gate at all — reintroducing the exact 14-Sep bug class
//      for `userSalary`, `currency`, `isPremium`, etc. the moment 7c wired
//      this in. Folding settings into the same snapshot/gate/cursor
//      machinery closes that hole and lets the old engine be retired
//      entirely from the live save path.
//
// KNOWN RESIDUAL RISK — same-device, multiple browser tabs open at once:
// each tab holds its own in-memory React state, and `storage.ts`'s plain
// localStorage write already overwrites the WHOLE local blob with whatever
// that one tab currently holds — a pre-existing characteristic of this app
// since Phase 1, not something this file introduces. Two tabs editing
// different records within the same debounce window can still clobber each
// other locally before sync ever runs. What Phase 7 changes is the blast
// radius: that local clobber can now also propagate to the cloud and from
// there to the user's OTHER device, where before it stayed on one device.
// `scheduleSync` below takes a `getState` FUNCTION rather than a captured
// value specifically so the debounced push always reads the freshest
// on-disk state at send time rather than a stale closure — this closes the
// narrower "captured-then-stale" version of the race, but not the deeper
// one rooted in storage.ts's whole-blob overwrite. Given this app's real
// usage (one person, switching between an iPad and an iPhone, not routinely
// running two tabs of the same PWA at once) this is treated as a documented,
// monitored risk rather than a blocker — see the design doc for the fuller
// writeup and possible future mitigations (e.g. a second-tab warning).

import { supabase } from './supabaseClient';

// ---------------------------------------------------------------------------
// What is a record, and what is a setting
// ---------------------------------------------------------------------------

// Collections whose items sync individually. Every one of these holds objects
// with a stable `id` (verified against types.ts).
export const RECORD_COLLECTIONS = [
  'transactions',
  'commitments',
  'installments',
  'goals',
  'billSplits',
  'familyMembers',
  'savingBoxes',
  'linkedBankAccounts',
  'kidsCards',
] as const;

export type RecordCollection = typeof RECORD_COLLECTIONS[number];

// Everything else in the app state is a single-valued preference. These all
// travel together as ONE pseudo-record (see SETTINGS_COLLECTION below) so
// they go through the exact same gated push/pull machinery as real records.
const SETTINGS_KEYS = [
  'lang', 'currency', 'showBalances', 'userName', 'userEmail',
  'isNameCustomized', 'userSalary', 'salaryDay', 'userIncomeSource',
  'selectedPersona', 'isPremium', 'zakatFeatureEnabled', 'microThresholdPct',
  'lastResetCycleKey', 'lastSeenAlertState', 'lastDailyCalcDate',
  'todaysSafeAmount', 'frozenWithSalary', 'freezeMethodVersion',
] as const;

const SETTINGS_COLLECTION = 'settings';
const SETTINGS_RECORD_ID = 'prefs';

export interface CloudChange {
  collection: string;
  record_id: string;
  data: any;
  deleted: boolean;
  updated_at: string;
}

/** id -> signature of that record, per collection (settings included, under one fixed id). */
export type Snapshot = Record<string, Record<string, string>>;

export interface RecordDelta {
  upserts: { collection: string; record_id: string; data: any }[];
  deletes: { collection: string; record_id: string }[];
}

// ---------------------------------------------------------------------------
// Pure helpers — no network, no storage. These carry the logic worth testing.
// ---------------------------------------------------------------------------

// Sorted-key stringify: the cloud copy round-trips through Postgres `jsonb`,
// which does not preserve key order, so plain JSON.stringify would report two
// identical records as different.
//
// Two fixes from the pre-launch review are folded in here:
//  - keys whose value is `undefined` are DROPPED, matching what actually
//    survives the real network round-trip (JSON.stringify over the wire also
//    drops them) — previously they signed as `"key":null`, which could
//    permanently disagree with the post-round-trip cloud shape and leave a
//    record "changed forever" relative to what the cloud actually holds.
//  - NaN / +Infinity / -Infinity get distinct sentinel signatures instead of
//    all collapsing to the same `null` as a genuine `null` value, which could
//    let a real change (e.g. a corrupted NaN becoming a legitimate 0) go
//    undetected and never sync.
export function canonical(value: any): string {
  if (value === undefined) return '"__undefined__"';
  if (typeof value === 'number') {
    if (Number.isNaN(value)) return '"__NaN__"';
    if (value === Infinity) return '"__Infinity__"';
    if (value === -Infinity) return '"__-Infinity__"';
    return JSON.stringify(value);
  }
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  const keys = Object.keys(value).filter((k) => value[k] !== undefined).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
}

// Only these four collections start EMPTY on a brand-new install (matches
// syncEngine.ts's old ACTIVITY_KEYS exactly, carried over for the Settings
// screen's "records on this device / in the cloud" display). Commitments,
// goals and saving boxes ship pre-filled with defaults, so counting those
// would mark every fresh device as "already has data".
const ACTIVITY_KEYS = ['transactions', 'installments', 'familyMembers', 'billSplits'] as const;

export function countActivity(state: any): number {
  if (!state || typeof state !== 'object') return 0;
  return ACTIVITY_KEYS.reduce(
    (total, key) => total + (Array.isArray(state[key]) ? state[key].length : 0),
    0,
  );
}

/** The preference-only slice that travels as the 'settings' pseudo-record. */
export function settingsOf(state: any): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!state) return out;
  for (const key of SETTINGS_KEYS) {
    if (state[key] !== undefined) out[key] = state[key];
  }
  return out;
}

/** Signature of every record currently in a state object, settings included. */
export function snapshotOf(state: any): Snapshot {
  const snap: Snapshot = {};
  for (const collection of RECORD_COLLECTIONS) {
    const out: Record<string, string> = {};
    const list = state?.[collection];
    if (Array.isArray(list)) {
      for (const item of list) {
        if (item && typeof item.id === 'string') out[item.id] = canonical(item);
      }
    }
    snap[collection] = out;
  }
  snap[SETTINGS_COLLECTION] = { [SETTINGS_RECORD_ID]: canonical(settingsOf(state)) };
  return snap;
}

/**
 * What changed on this device since `snapshot` was taken.
 *
 * Present now but not in the snapshot -> added.
 * Present in both but different       -> edited.
 * In the snapshot but gone now        -> deleted (becomes a tombstone).
 *
 * Settings never delete — there is always exactly one 'prefs' record; it
 * only ever upserts when its signature changes.
 */
export function diffAgainstSnapshot(state: any, snapshot: Snapshot): RecordDelta {
  const delta: RecordDelta = { upserts: [], deletes: [] };

  for (const collection of RECORD_COLLECTIONS) {
    const before = snapshot?.[collection] ?? {};
    const list = Array.isArray(state?.[collection]) ? state[collection] : [];
    const seen = new Set<string>();

    for (const item of list) {
      if (!item || typeof item.id !== 'string') continue;
      seen.add(item.id);
      const sig = canonical(item);
      if (before[item.id] !== sig) {
        delta.upserts.push({ collection, record_id: item.id, data: item });
      }
    }

    for (const id of Object.keys(before)) {
      if (!seen.has(id)) delta.deletes.push({ collection, record_id: id });
    }
  }

  const settingsBefore = snapshot?.[SETTINGS_COLLECTION]?.[SETTINGS_RECORD_ID];
  const settingsNow = settingsOf(state);
  const settingsSig = canonical(settingsNow);
  if (settingsBefore !== settingsSig) {
    delta.upserts.push({ collection: SETTINGS_COLLECTION, record_id: SETTINGS_RECORD_ID, data: settingsNow });
  }

  return delta;
}

/**
 * Fold cloud changes into local state.
 *
 * Record collections: local order is preserved (an updated record stays
 * where it was, only genuinely new records are appended), transactions get
 * re-sorted newest-first afterward.
 *
 * Settings: the single 'prefs' record's fields are spread directly onto the
 * top-level state object (last one wins if, oddly, more than one settings
 * row came back in one pull — there is only ever one in practice).
 */
export function applyCloudChanges(state: any, changes: CloudChange[]): any {
  if (!changes.length) return state;

  const settingsChanges = changes.filter((c) => c.collection === SETTINGS_COLLECTION && !c.deleted && c.data);
  const recordChanges = changes.filter((c) => (RECORD_COLLECTIONS as readonly string[]).includes(c.collection));

  let next = state;

  if (settingsChanges.length) {
    const latest = settingsChanges[settingsChanges.length - 1];
    next = { ...next, ...latest.data };
  }

  if (recordChanges.length) {
    const byCollection = new Map<string, CloudChange[]>();
    for (const change of recordChanges) {
      const list = byCollection.get(change.collection) ?? [];
      list.push(change);
      byCollection.set(change.collection, list);
    }

    next = { ...next };

    for (const [collection, list] of byCollection) {
      const current = Array.isArray(next?.[collection]) ? [...next[collection]] : [];
      const indexById = new Map<string, number>();
      current.forEach((item: any, i: number) => {
        if (item && typeof item.id === 'string') indexById.set(item.id, i);
      });

      const removed = new Set<string>();

      for (const change of list) {
        const at = indexById.get(change.record_id);
        if (change.deleted) {
          if (at !== undefined) removed.add(change.record_id);
          continue;
        }
        if (!change.data) continue;
        if (at !== undefined) {
          current[at] = change.data;   // in place — order is preserved
        } else {
          current.push(change.data);
          indexById.set(change.record_id, current.length - 1);
        }
      }

      let merged = removed.size
        ? current.filter((item: any) => !(item && removed.has(item.id)))
        : current;

      if (collection === 'transactions') {
        merged = [...merged].sort((a: any, b: any) => {
          const byDate = String(b?.date ?? '').localeCompare(String(a?.date ?? ''));
          return byDate !== 0 ? byDate : String(b?.id ?? '').localeCompare(String(a?.id ?? ''));
        });
      }

      next[collection] = merged;
    }
  }

  return next;
}

// ---------------------------------------------------------------------------
// Local sync bookkeeping
// ---------------------------------------------------------------------------

const SNAPSHOT_KEY = 'safespend-records-snapshot-v1';
const CURSOR_KEY = 'safespend-records-cursor-v2';

export function loadSnapshot(): Snapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSnapshot(snap: Snapshot): void {
  try {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snap));
  } catch (e) {
    console.error('SafeSpend sync: could not save snapshot', e);
  }
}

/** Resume point for the pull: (updated_at, record_id) — a compound cursor.
 *  A bare timestamp cursor is NOT enough: Postgres's `now()` is the
 *  TRANSACTION start time, so every row updated in the same push batch gets
 *  an IDENTICAL updated_at. A plain `gt(updated_at, cursor)` resume point can
 *  then permanently skip whichever tied rows land on the far side of a page
 *  boundary. Ordering and resuming by (updated_at, record_id) together makes
 *  the pull deterministic even when timestamps collide. */
interface Cursor {
  updatedAt: string;
  recordId: string;
}

function loadCursor(): Cursor | null {
  try {
    const raw = localStorage.getItem(CURSOR_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.updatedAt === 'string' && typeof parsed.recordId === 'string') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function saveCursor(value: Cursor | null): void {
  try {
    if (value) localStorage.setItem(CURSOR_KEY, JSON.stringify(value));
  } catch { /* nothing we can do */ }
}

export function clearSyncState(): void {
  try {
    localStorage.removeItem(SNAPSHOT_KEY);
    localStorage.removeItem(CURSOR_KEY);
  } catch { /* nothing we can do */ }
  hasSyncedThisSession = false;
}

// ---------------------------------------------------------------------------
// The safety gate
//
// A device may not push until it has completed one full sync cycle. This is
// the single guard whose absence caused the 14 Sep data loss: a stale device
// pushed its old state on launch, before it had any idea what the cloud held.
// ---------------------------------------------------------------------------

let hasSyncedThisSession = false;
let syncInFlight = false;

export function isSyncReady(): boolean {
  return hasSyncedThisSession;
}

// ---------------------------------------------------------------------------
// The sync cycle
// ---------------------------------------------------------------------------

export interface SyncResult {
  ok: boolean;
  /** Present only when cloud changes arrived and the app should adopt them. */
  mergedState?: any;
  pushed: number;
  pulled: number;
  error?: string;
}

const PULL_PAGE_SIZE = 500;

/**
 * One full cycle: work out what changed here, send it, take what changed
 * there, and record the new baseline.
 *
 * Push happens before pull so this device's own work is never overwritten by
 * the merge that follows it. Pull pages through the full remaining backlog
 * (not just one page) so an account with a long history never gets stuck
 * with a cursor that silently stops advancing.
 */
export async function syncCycle(getState: () => any): Promise<SyncResult> {
  if (syncInFlight) return { ok: false, pushed: 0, pulled: 0, error: 'busy' };
  syncInFlight = true;

  try {
    // 14 Sep field-test incident (claude/safespend_phase7d_false_delete_incident.md):
    // this read MUST happen here — synchronously, as the very first thing
    // inside this try block, before any `await` — not in the caller. A
    // caller that reads the state once and hands syncCycle the VALUE can be
    // suspended for a while before this call actually runs (iOS backgrounds
    // a tab mid-await for seconds at a time), during which another syncCycle
    // call can complete and move the snapshot's baseline forward. When the
    // stale call then finally diffs its old captured value against that
    // newer baseline, anything added in between looks like it "disappeared"
    // and gets pushed as a tombstone — which the anti-undelete trigger then
    // makes permanent. Reading via a getter, right after the lock and before
    // any yield point, guarantees no other syncCycle call can have run in
    // the gap (they all bail out on the busy check above while this lock is
    // held), so whatever is read here is always consistent with the
    // snapshot this call is about to compare it to.
    const localState = getState();
    if (!localState) return { ok: false, pushed: 0, pulled: 0, error: 'no-local-state' };

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;
    if (!session) return { ok: false, pushed: 0, pulled: 0, error: 'not-signed-in' };

    const userId = session.user.id;
    const snapshot = loadSnapshot();

    // --- 1. push what changed here -----------------------------------------
    // A device with no snapshot has never synced: everything it holds counts
    // as new, which is exactly right for a first run.
    const delta = diffAgainstSnapshot(localState, snapshot ?? {});
    let pushed = 0;

    if (delta.upserts.length || delta.deletes.length) {
      const rows = [
        ...delta.upserts.map((u) => ({
          user_id: userId,
          collection: u.collection,
          record_id: u.record_id,
          data: u.data,
          deleted: false,
          updated_at: new Date().toISOString(),
        })),
        // Tombstones: the row stays so other devices learn about the deletion.
        // A trigger on the live table (trg_app_records_prevent_undelete)
        // refuses to let any of these upserts flip an existing tombstone back
        // to deleted:false, so a stale device can push whatever it believes —
        // the account-level invariant holds regardless.
        ...delta.deletes.map((d) => ({
          user_id: userId,
          collection: d.collection,
          record_id: d.record_id,
          data: null,
          deleted: true,
          updated_at: new Date().toISOString(),
        })),
      ];

      const { error } = await supabase
        .from('app_records')
        .upsert(rows, { onConflict: 'user_id,collection,record_id' });

      if (error) {
        return { ok: false, pushed: 0, pulled: 0, error: error.message };
      }
      pushed = rows.length;
    }

    // --- 2. pull what changed there, paging through the full backlog -------
    const cursor = loadCursor();
    const allChanges: CloudChange[] = [];
    let offset = 0;

    for (;;) {
      let query = supabase
        .from('app_records')
        .select('collection, record_id, data, deleted, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: true })
        .order('record_id', { ascending: true })
        .range(offset, offset + PULL_PAGE_SIZE - 1);

      if (cursor) {
        // updated_at > cursor, OR (updated_at == cursor AND record_id > cursor's)
        query = query.or(
          `updated_at.gt.${cursor.updatedAt},and(updated_at.eq.${cursor.updatedAt},record_id.gt.${cursor.recordId})`
        );
      }

      const { data: page, error: pullError } = await query;
      if (pullError) {
        return { ok: false, pushed, pulled: allChanges.length, error: pullError.message };
      }

      const rows = (page ?? []) as CloudChange[];
      allChanges.push(...rows);
      if (rows.length < PULL_PAGE_SIZE) break;
      offset += PULL_PAGE_SIZE;
    }

    const mergedState = allChanges.length
      ? applyCloudChanges(localState, allChanges)
      : localState;

    // --- 3. record the new baseline ----------------------------------------
    saveSnapshot(snapshotOf(mergedState));
    if (allChanges.length) {
      const last = allChanges[allChanges.length - 1];
      saveCursor({ updatedAt: last.updated_at, recordId: last.record_id });
    } else if (!cursor) {
      // First cycle with nothing to pull — start the cursor from now so the
      // next run doesn't re-read the rows we just wrote.
      saveCursor({ updatedAt: new Date().toISOString(), recordId: '' });
    }

    hasSyncedThisSession = true;

    return {
      ok: true,
      mergedState: allChanges.length ? mergedState : undefined,
      pushed,
      pulled: allChanges.length,
    };
  } catch (e: any) {
    return { ok: false, pushed: 0, pulled: 0, error: e?.message || 'network-error' };
  } finally {
    syncInFlight = false;
  }
}

// ---------------------------------------------------------------------------
// Background push, debounced
//
// Called on every local save. Refuses to send anything until the gate above
// has opened, so a stale device can never publish its state on launch.
//
// Takes a GETTER, not a snapshot value: the debounce fires up to 2s after the
// triggering save, and by then a fresher on-disk state may exist (e.g. this
// same tab saved again, or — see the file header's residual-risk note —
// another tab wrote to the shared localStorage in between). Re-reading at
// send time via the getter means the push always reflects the freshest state
// this call site can see, not a value captured back when the timer started.
// Callers MUST pass a function (e.g. `() => loadAppState()`), not a plain
// object, or this protection does nothing.
// ---------------------------------------------------------------------------

const DEBOUNCE_MS = 2000;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingGetState: (() => any) | null = null;

export function scheduleSync(getState: () => any): void {
  pendingGetState = getState;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    if (!hasSyncedThisSession) return;   // the gate — stays pending
    const getter = pendingGetState;
    pendingGetState = null;
    // Pass the getter itself, not getter() — see syncCycle's own comment for
    // why the read must happen inside syncCycle, right after it takes the
    // lock, rather than here.
    if (getter) syncCycle(getter);
  }, DEBOUNCE_MS);
}

// Retry when connectivity returns.
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    if (hasSyncedThisSession && pendingGetState) syncCycle(pendingGetState);
  });
}
