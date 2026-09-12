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

async function doPush(state: Record<string, unknown>): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    // Not signed in -> sync not enabled for this user. Silent no-op.
    pendingState = null;
    return;
  }

  pushInFlight = true;
  try {
    const { error } = await supabase
      .from('app_state')
      .upsert({ user_id: session.user.id, state }, { onConflict: 'user_id' });

    if (error) {
      console.error('SafeSpend cloud sync: push failed, will retry', error);
      pendingState = state; // keep the latest state around for the next retry
    } else {
      pendingState = null;
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
    const { error } = await supabase
      .from('app_state')
      .upsert({ user_id: session.user.id, state }, { onConflict: 'user_id' });
    if (error) {
      pendingState = state;
      return { ok: false, error: error.message };
    }
    pendingState = null;
    return { ok: true };
  } catch (e: any) {
    pendingState = state;
    return { ok: false, error: e?.message || 'network-error' };
  }
}
