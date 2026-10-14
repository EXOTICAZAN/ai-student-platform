# EduForge AI — Review Report

## Verification (final state)

| Check | Result |
| --- | --- |
| `tsc --noEmit` | Pass |
| `eslint` | Pass |
| `vitest run` | 40/40 pass (vitest 4) |
| `next build` | Pass |
| `npm audit --omit=dev` | 4 low (KaTeX, no upstream fix — see README) |
| `npm audit` (dev tooling) | 5 high in eslint-config-next chain, no patched release |

Not verified: the SQL migrations (no Postgres in the review environment). Run 001–007 in
order against a Supabase project before relying on them.

## Round 2 — fixes

### Cross-user read of dashboard stats (security, high) — migration 007
`get_user_dashboard_stats` and `get_weekly_study_minutes` are `SECURITY DEFINER`,
accept any `target_user_id`, and were executable by `anon`. Anyone with the public
anon key who knew a user's UUID could read that user's XP, streak and activity counts.

**Fix:** `supabase/migrations/007_dashboard_stats_auth.sql` raises unless
`target_user_id = auth.uid()`, and revokes EXECUTE from `PUBLIC` and `anon`.
`get_weekly_study_minutes` was rewritten from SQL to PL/pgSQL so it can run the check.
`seed_demo_data` already had the correct grants and was left as is.

### Scholarship deadlines all in the past (demo-breaking)
All nine seeded deadlines fell between 2025 and May 2026, so every scholarship showed
as closed. The nine open/deadline pairs were rolled forward to the 2026–27 cycle (one
year later, and one more for Schwarzman so it stays in the future). Every deadline is
now after 13 Oct 2026.

**These dates are estimates, not verified.** Check each one on its official site before
relying on the list.

### Server actions had no rate limit
The 29 exported server actions in notes, planner, quiz, flashcards, tutor and settings
now call `actionAllowed()` (`lib/api/actionLimit.ts`) after the sign-in check.

### Unused dependencies removed
`react-hook-form`, `@hookform/resolvers`, `@langchain/core`, `@base-ui/react`,
`class-variance-authority`, `@types/ms`. None was imported.

### Dependency audit
- `vitest` upgraded 3.2.7 → 4.1.11. This clears the critical `tinypool` RCE and the
  moderate `@vitest/mocker` advisory. Tests still pass.
- Pinning `braces`, `micromatch` and `fast-glob` via `overrides` does not help: every
  published version is flagged. The remaining 5 high findings sit in the lint toolchain
  (`eslint-config-next`) and are dev-only. Documented in the README.
- Production dependencies still carry the 4 low KaTeX advisories. No upstream fix exists.

### Stray `.gitignore` line removed
`educational-web-app/` (no trailing newline) was deleted; the file now ends with a newline.

### Placeholder emails replaced
`hello@eduforge.ai` and `security@eduforge.ai` are not known to be monitored. Every
occurrence (contact page, forms, legal pages, FAQ, security page, careers) now points to
`azanalikhadim02@gmail.com`. Change it to the team's real addresses when they exist.

## Round 1 — fixes (earlier)
- Open redirect after sign-in (`/\evil.com`) fixed in `lib/auth/redirect.ts`, with tests.
- Notification mark-as-read validates the id as a UUID.
- Security headers (nosniff, frame-deny, referrer, permissions, HSTS) in `next.config.ts`.

## Known weaknesses (not changed)
- **Contact form rate limit can be bypassed** by spoofing `x-forwarded-for`. Enforce this
  at the proxy, or read the platform's trusted client-IP header.
- **Re-processing a PDF can drop its chunks.** Old chunks are deleted before the new ones
  are inserted. Fix with a single transactional RPC.
- **Rate limits are per instance** unless the Upstash variables are set.
- **No strict CSP** yet. It needs nonces, and the Markdown/KaTeX renderers must be tested.
- **Four scholarships have no deadline** (Fulbright, Erasmus Mundus, Rhodes, ADB-Japan).
  Their stored status stays "open" permanently, so they never show as closed.
- **`last_verified_at` still says 2026-01-01** on the seed rows, which no longer matches
  the rolled-forward dates.
