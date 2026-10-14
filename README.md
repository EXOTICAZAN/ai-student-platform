# EduForge AI

## Pakistan Student Hub MVP

Authenticated dashboard routes `/dashboard/admissions`, `/dashboard/exam-prep`, `/dashboard/pakistan-guidance`, and `/dashboard/budget` provide a source-attributed planning experience for Pakistani students. The admissions page intentionally ships a small reference set and labels deadlines/eligibility as requiring verification; it is not an exhaustive or live directory. Scholarship browsing remains backward-compatible and now includes a Pakistan/HEC verification guide.

Before enabling per-user admissions tracking in a deployed environment, apply `supabase/migrations/012_pakistan_student_hub.sql`. The migration creates a curated reference table, owner-scoped application statuses, and RLS policies. No secrets or external API calls are required. Reference rows should be human-curated and verified against official university/regulator sources before adding them.


## Language support

The authenticated dashboard supports English and Urdu. Use the `English` / `اردو` toggle in the top navigation; the choice is applied immediately, persisted locally, and saved to the existing profile. Urdu uses RTL layout and the AI tutor responds in Urdu while preserving code, formulas, URLs, and citations. See [INTERNATIONALIZATION.md](./INTERNATIONALIZATION.md) for details.

An AI study companion for students: a RAG-powered tutor you can chat with about
your own PDFs, plus notes, flashcards, quizzes, a study planner, scholarship
matching and progress analytics — backed by Supabase, with generation on Groq
and embeddings run locally.

## Features

| Area | What it does |
| --- | --- |
| **AI Tutor** | Streaming chat with optional PDF upload. Documents are chunked, embedded and stored so answers about your file are grounded and cited, while general questions are answered normally. |
| **Notes** | Markdown notes with autosave, AI-powered generation and summarisation. |
| **Flashcards** | Generate decks from a topic or your notes, then review them in an SM-2 spaced-repetition queue with intervals, lapses and due dates. |
| **Quizzes** | Generate multiple-choice quizzes, take them, and keep accuracy history per subject. |
| **Planner** | Study tasks with priority, subject, duration and due dates; AI can draft a plan from your goals. |
| **Scholarships** | Search and filter, match against your student profile, save, track applications and ask an AI advisor about a specific award. |
| **Analytics** | 90-day view of XP, study minutes, quiz accuracy and flashcard retention. |
| **Courses** | Build a personalized AI course from your interests, complete YouTube lessons and knowledge checks, and earn a printable certificate. |
| **Dashboard** | Streak, XP, level, recent activity and upcoming tasks, with global search (`⌘K`) and notifications. |

XP, streaks and levels are derived from a single `activity_log` table through SQL
functions, so the numbers shown on the dashboard and in analytics can never
disagree with each other.

## Tech stack

- **Next.js 16** (App Router, Server Components, Server Actions) + **React 19**
- **TypeScript** in strict mode
- **Tailwind CSS v4**
- **Supabase** — Postgres, Row Level Security, storage, auth (`@supabase/ssr`)
- **Groq** (via the `openai` client, OpenAI-compatible) — chat streaming and structured JSON generation
- **transformers.js** (`@huggingface/transformers`) — embeddings, run in-process; Groq has no embeddings endpoint
- **pgvector** — similarity search over document chunks
- **Framer Motion**, **lucide-react**, **sonner**

## Getting started

### 1. Install

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`. The required runtime values are `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `GROQ_API_KEY`. Production deployments also
need `NEXT_PUBLIC_SITE_URL` set to the public HTTPS origin. Server-only features
such as account deletion and `npm run reembed` additionally require
`SUPABASE_SERVICE_ROLE_KEY`; do not expose it to the browser. The app does not
silently substitute missing credentials: check the server logs and the health
endpoint after startup if a feature is unavailable. See `.env.example` for every
variable and its scope.

`SUPABASE_SERVICE_ROLE_KEY` is server-only and bypasses Row Level Security. Never
prefix it with `NEXT_PUBLIC_` and never import it into a client component.

#### YouTube lesson videos

Course generation optionally uses the YouTube Data API v3 to replace AI-suggested
links with validated, embeddable video URLs (`https://www.youtube.com/watch?v=...`).
Create an API key in Google Cloud with YouTube Data API v3 enabled and set
`YOUTUBE_API_KEY` in `.env.local` (and in your deployment's server environment).
It is deliberately server-only: never use a `NEXT_PUBLIC_` prefix or read it from
a client component. Searches are bounded to 24 lessons per generated course to
protect quota. If the key is missing, quota is exhausted, or a response is
invalid, the app keeps the existing safe YouTube search URL and still creates the
course. The player and a direct Watch video link are shown for exact video URLs.

Embeddings need no key — the model is downloaded on first use into
`~/.cache/eduforge-embeddings` (about 85 MB) and cached from then on. It lives
outside the project on purpose: Turbopack traces every file under the project
root, and pulling a 90 MB `.onnx` into that trace panics the build. Override with
`EMBEDDING_CACHE_DIR` if you need it somewhere else.

### 3. Set up the database

Run these **in order** in the Supabase SQL editor
(Dashboard → your project → SQL Editor). All of them are idempotent and safe to
re-run.

1. `supabase/migrations/001_scholarship_tables.sql` — scholarship schema
2. `supabase/migrations/002_study_features.sql` — notes, flashcards, quizzes,
   planner, activity log, notifications, settings, RLS policies, grants and the
   dashboard SQL functions
3. `supabase/migrations/003_local_embeddings.sql` — rebuilds
   `document_chunks.embedding` at 384 dimensions for the local model, recreates
   its similarity index and the `match_document_chunks` RPC
4. `supabase/migrations/004_chat_rag_rls.sql` — creates `chats`, `messages`,
   `documents` and `document_chunks` if they are missing, and enables Row Level
   Security on them. **Do not skip this one.** These four tables were originally
   created by hand in the dashboard, so 002 grants read/write on them without
   defining any policy. Until 004 runs, anyone holding the public anon key can
   read or delete every user's tutor transcripts straight from `/rest/v1`,
   bypassing the application entirely. It also creates the private `documents`
   storage bucket and its object policies.
5. `supabase/migrations/005_contact_and_demo.sql` — `contact_messages` table (insert-only
   RLS) behind the `/contact` form, plus the `seed_demo_data(user_id)` function
6. `supabase/migrations/006_hardening.sql` — drops the duplicate vector index,
   constrains `messages.role`, replaces `match_document_chunks` with a version
   that takes no user id (it relies on RLS and `auth.uid()`), and requires chunk
   inserts to reference a document the caller owns. **Run it last, and do not
   re-run 003 or 004 afterwards**: they recreate the old four-argument function,
   and the app calls the three-argument one.
7. `supabase/seed/scholarships.sql` — reference scholarship data
8. `supabase/migrations/007_dashboard_stats_auth.sql` — makes `get_user_dashboard_stats`
   and `get_weekly_study_minutes` refuse any user id other than the caller's, and
   revokes anonymous EXECUTE. Without it, anyone with the anon key who knows a
   user's UUID can read that user's XP and activity counts.
9. `supabase/migrations/008_courses.sql` — personalized courses, modules, videos, progress, checks, certificates and user-owned RLS policies. Required for `/dashboard/courses`.
10. `supabase/migrations/009_courses_check_sessions.sql` — short-lived, single-use server-side knowledge-check sessions. Answer keys are inaccessible to authenticated clients; the API uses the service role only for session storage.

### Demo data

To fill an account with realistic notes, decks, quizzes, tasks, a 12-day streak and
notifications, run this in the SQL editor (service role), using the user's id from
Authentication -> Users:

```sql
select seed_demo_data('00000000-0000-0000-0000-000000000000');
```

It is re-runnable and only executable by `service_role`.

Two things trip people up in the SQL editor: if any text is selected, only the
selection runs; and each file must be pasted and run in its own query tab.

Until step 2 has run, the dashboard features render empty/zero states rather than
erroring — every data helper falls back gracefully. Scholarships stays empty
until step 7 runs.

Each file ends with a `SELECT` that reports what it did. Read that output rather
than trusting the "Success. No rows returned" banner: on an existing database
several sections are deliberate no-ops, and the two most common reasons for a
file silently doing nothing are that some text was selected in the editor, or
that it was pasted into a tab that already had content.

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run reembed` | Regenerate chunk embeddings after an embedding-model change (requires service role; see below) |
| `npm test` | Unit tests (Vitest): SM-2, scholarship matching and status, JSON extraction, rate limiter, request guards |
| `npx tsc --noEmit` | Typecheck |

Note: `next lint` was removed in Next.js 16 — use `npm run lint` (plain ESLint).

### Changing the embedding model

The vector width is baked into `document_chunks.embedding`. Switching
`EMBEDDING_MODEL` to one with a different width needs a migration to re-type the
column, then a backfill:

```bash
npm run reembed -- --dry-run   # report what would be re-embedded
npm run reembed                # only chunks with a NULL embedding
npm run reembed -- --all       # every chunk
```

The script runs through `tsx` and imports `lib/ai/embeddings.ts` directly, so it
cannot drift from what the running app produces. It needs
`SUPABASE_SERVICE_ROLE_KEY`, because Row Level Security would otherwise hide
other users' chunks from the backfill. Use `npm run reembed -- --dry-run` first;
never run it against a production database until the matching vector migration
has been applied.

## Project structure

```
app/
  (auth)/          login, signup, forgot-password, verify-email
  (public)/        marketing, blog, guides, help, legal pages
  api/             route handlers for chat, search, notifications, AI generation
  dashboard/       authenticated app: notes, flashcards, quiz, planner,
                   tutor, scholarships, analytics, settings
components/        feature-grouped UI (chat, notes, quiz, dashboard, public, ...)
lib/
  ai/              Groq client (chat, structured JSON) and local embeddings
  api/             shared route guards: input clamping, UUID checks, error
                   sanitising, and the per-user rate limiter
  rag/             document ingestion and similarity search
  scholarships/    queries, matching logic, types
  study/           dashboard/activity queries and shared types
  supabase/        server and browser clients
supabase/
  migrations/      database schema
  seed/            reference data
```

## Conventions

- **Toasts, not dialogs.** Use `sonner` (`toast.success` / `toast.error`). Never
  `alert()` or `confirm()`.
- **Server Actions** return `ActionResult<T>` (`{ ok, data?, error? }`) and call
  `revalidatePath` for the routes they affect.
- **Dark theme only.** There is no light theme and no theme setting; `app/layout.tsx` pins
  `colorScheme: "dark"`.
- **Row Level Security** confines every user to their own rows. Any new table
  holding user data needs own-row policies plus table grants for `anon`,
  `authenticated` and `service_role`.
- **Migrations must be re-runnable.** Guard with `IF NOT EXISTS`,
  `DROP ... IF EXISTS`, and wrap enum creation so `duplicate_object` is swallowed.
- **Never return an upstream error message to the client.** Postgres and Groq
  messages name tables, columns, constraints and missing env vars. Log them with
  `console.error` and return a generic string — `serverError()` in
  `lib/api/guard.ts` does both.
- **Every route and server action is rate limited.** Route handlers use
  `await consume()` from `lib/api/rateLimit.ts` right after the auth check (it is
  async); cheap routes can use `limitOrNull()`. Server actions call
  `actionAllowed()` from `lib/api/actionLimit.ts` right after the sign-in check
  and return `ACTION_LIMIT_ERROR` when over the limit. The limiter counts in memory per instance by default;
  set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to share one global
  count across instances. If Redis is unreachable it falls back to memory.
- **Cap and validate request bodies.** Length caps on free-text fields, `clampInt`
  on pagination, `isUuid` on path params. A server action's TypeScript parameter
  types are not a runtime guarantee — callers can send anything.

## Scholarship data and deadlines

The seed deadlines were rolled forward one year to the 2026–27 cycle so that they
are in the future. They have **not** been re-checked against each official site,
so verify every date (and update the seed) before relying on the list. The
`open` filter is empty if every deadline has passed.

A scholarship's stored `status` is only as fresh as the seed. Status is derived
from `application_deadline` when rows are read (`lib/scholarships/status.ts`), so
a scholarship whose deadline has passed shows as closed and is excluded from the
"open" filter even if the row still says `open`. The deadlines in
`supabase/seed/scholarships.sql` are from the previous cycle; verify each on the
official site and update them before relying on the list.

## Account deletion

Settings -> Account has two actions. *Delete all my data* erases everything the
user owns (including the profile and uploaded PDFs) and keeps the login. *Delete
my account* does that and also removes the auth user, which needs
`SUPABASE_SERVICE_ROLE_KEY`; without it the action reports that deletion is not
enabled rather than silently doing nothing.

## Known advisories

- **Production dependencies (`npm audit --omit=dev`): 4 low.** All are the KaTeX
  prototype-pollution advisory (GHSA-238p-pmpm-9mq7) through `katex`, `rehype-katex`,
  `remark-math` and `micromark-extension-math`. No released KaTeX version fixes
  it. It concerns bypassing the `trust` option, which this app sets to `false`
  explicitly in both Markdown renderers.
- **Development tooling: 5 high.** These come from `eslint-config-next`
  (`@next/eslint-plugin-next`, `fast-glob`, `micromatch`, `braces`). Every
  published version is flagged, so there is no patch to apply. The advisories
  only affect the lint toolchain, not the shipped app. The fix is to replace or
  upgrade the linter once a patched release exists.

## Deployment

Set `NEXT_PUBLIC_SITE_URL` to your production origin. It drives `metadataBase`,
`sitemap.xml` and `robots.txt`; without it, Open Graph URLs resolve against
localhost.

`/dashboard`, `/profile`, `/api/` and `/auth/` are disallowed in `robots.txt`, and
the authenticated trees carry `noindex` from `app/dashboard/layout.tsx` and
`app/(auth)/layout.tsx`.

### Local embeddings on serverless

Embeddings run in-process, so the model (about 85 MB) must be present on the
filesystem. `EMBEDDING_CACHE_DIR` defaults to `~/.cache/eduforge-embeddings` —
never inside the project root, because Turbopack's file tracer would pull the
`.onnx` weights into the bundle and fail the build. `serverExternalPackages`
keeps `@huggingface/transformers` out of the bundle so its native runtime
resolves, and `outputFileTracingExcludes` keeps `.models/` out in case a local
override points back at it.

On platforms with an ephemeral or read-only filesystem the model is re-fetched
into a temporary directory on cold start, which costs roughly a minute the first
time and is not covered by the request timeout on the default tiers. Options:
pre-bake the model into the deployment image and point `EMBEDDING_CACHE_DIR` at
it, or run ingestion on a worker with a persistent volume. A long-running Node
server has neither problem — the model loads once in about a second and stays
resident.

## Personalized onboarding, admin and career roadmap

New and returning authenticated users complete `/onboarding` before entering the dashboard. The flow validates and saves country, education, goals, language, weekly study time, interests and career goal to `profiles` (and the daily equivalent to `user_settings`). Run `supabase/migrations/010_personalization.sql` after migration 009.

Set the server-only `ADMIN_EMAILS` environment variable to a comma-separated list of trusted email addresses to enable the protected `/dashboard/admin` overview. Authorization is checked on the server; an authenticated non-admin receives a clear 403 response, and the navigation link is only shown to admins.

`/dashboard/career-roadmap` generates a validated roadmap through the existing Groq helper, with rate limiting and a deterministic fallback when Groq is unavailable. The initial version keeps generated roadmaps in the client session and stores only the goal in `profiles`; add a dedicated roadmap table in a future migration before adding durable history or sharing.
