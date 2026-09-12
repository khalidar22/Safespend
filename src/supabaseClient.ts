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
//   2. This is a Supabase "anon" key (the traditional/legacy public key —
//      long JWT starting with eyJ...), which Supabase's own docs say is safe
//      to embed in client-side code — it is protected by Row Level Security
//      (RLS) policies on the database side, not by being secret. Never put
//      the "service_role" key here or anywhere else client-side.
//
// Note (12 Sep 2026): we tried the newer "publishable" key format
// (sb_publishable_...) first, but hit a documented, unresolved Supabase
// platform issue where Auth endpoints (signInWithOtp, signup, etc.) reject
// valid publishable keys with "Invalid API key" — see
// github.com/orgs/supabase/discussions/39719. The legacy anon JWT key below
// works correctly with Auth and has the exact same security model (public
// by design, enforced by RLS), so it's the practical choice until Supabase
// fixes Auth support for publishable keys.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lwhgxqxfsgeudouqcuvr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3aGd4cXhmc2dldWRvdXFjdXZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5OTY4MzksImV4cCI6MjA3ODU3MjgzOX0.LtN7TjHEmFk5d94vD0KXTROA7T-zt-sUygK9p4JiECw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
