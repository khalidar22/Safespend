// SafeSpend — Supabase client (optional cloud sync groundwork).
//
// This file only creates a Supabase client; nothing in the app calls it yet.
// It's Phase 3 groundwork (claude/safespend_sync_implementation_plan.md in
// the "الخبراء" project) — the actual "enable sync" UI and the sync engine
// come in later phases. Creating this client has zero effect on anyone who
// never opts in to cloud sync: localStorage (via storage.ts) stays the only
// thing the app touches until a user explicitly turns sync on.
//
// The values below are intentionally hardcoded as plain constants, not
// environment variables. Two reasons:
//   1. SafeSpend's GitHub Pages deploy pipeline (.github/workflows/*.yml) has
//      no secrets-injection step — it's just `npm run build` on a static
//      site, so an env-var approach would need new infrastructure for no
//      benefit here.
//   2. This is a Supabase "publishable" key (prefixed sb_publishable_), which
//      Supabase's own docs say is safe to embed in client-side code — it is
//      protected by Row Level Security (RLS) policies on the database side,
//      not by being secret. Never put a "secret" key (sb_secret_...) here or
//      anywhere else client-side.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lwhgxqxfsgeudouqcuvr.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_ltaNA7nnVozoSCOcZIjg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
