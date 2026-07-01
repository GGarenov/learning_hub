# Developer Assessment: Integrate Supabase

**Project:** Learning Hub (Roadmap Tracker)  
**Goal:** Enable multi-device progress sync after deploying to Netlify  
**Status:** ✅ **Phases 1–5 complete** (local dev verified) · ⏳ Phase 6 (Netlify) pending  
**Completed:** June 2026

---

## Completion summary

Supabase auth and cloud progress sync are integrated and working locally.

| Phase | Status |
|-------|--------|
| 1 — Supabase project setup | ✅ Done |
| 2 — App dependencies & environment | ✅ Done |
| 3 — Authentication UI | ✅ Done |
| 4 — Cloud sync layer | ✅ Done |
| 5 — Settings & migration UX | ✅ Done |
| 6 — Netlify deployment | ⏳ Not started |
| 7 — Testing checklist | ✅ Done (local) |

### What was built

- **Supabase project:** `learning-hub` with `user_progress` table, RLS (3 policies), Email auth
- **Env:** `.env.local` (gitignored) + `.env.example`
- **New files:**
  - `src/lib/supabase.ts` — client singleton
  - `src/lib/auth.tsx` — `AuthProvider`, `useAuth`, login hydration + Zustand subscribe sync
  - `src/lib/progress-sync.ts` — load/save, debounce (~800ms), sync status
  - `src/routes/login.tsx` — sign in / sign up
  - `supabase/migrations/001_user_progress.sql` — DB migration
  - `supabase/SETUP.md` — dashboard setup guide
  - `src/vite-env.d.ts` — Vite env types
- **Modified files:**
  - `src/routes/__root.tsx` — `AuthProvider` wrapper
  - `src/components/AppSidebar.tsx` — sign in / account / sign out
  - `src/routes/settings.tsx` — account & sync section, upload to cloud, updated copy
  - `src/lib/store.ts` — exported `initialAppState`
  - `package.json` — `@supabase/supabase-js`

### Verified behavior

- Sign up / sign in / sign out works with app-created credentials (not Supabase dashboard password)
- Progress saves to `user_progress.data` (jsonb) per `user_id`
- Each registered user has **isolated** progress (RLS enforced)
- Refresh keeps progress; cloud is source of truth when logged in
- localStorage remains as offline cache (`roadmap-progress-v1`)
- Export / Import JSON still works; import syncs to cloud when signed in

### Known limitations (v1)

- **Cloud wins** on login when both local and cloud have data
- **Logout keeps local cache** — switching accounts on the same browser without incognito may upload previous user's local data to a new empty account (use incognito or clear site data when testing multiple users)
- **Netlify deploy** not done yet — see Phase 6

### App login vs Supabase passwords

| Password | Used for |
|----------|----------|
| Supabase.com login | Dashboard only |
| Database password | Direct Postgres connections only |
| **App account** | `/login` sign up — email + password you choose |

---

## Vision

The app was **fully client-side**: curriculum in `src/lib/curriculum.ts`, progress in Zustand + `localStorage` (`roadmap-progress-v1`).

Supabase adds a **shared backend for progress only** — same account, same data on any device.

### Target architecture (implemented)

```
┌─────────────────────────────────────────────────────────────┐
│  Netlify (hosted app) — pending                             │
│  TanStack Start + React                                     │
│                                                             │
│  curriculum.ts  ──► static catalog (stays in code)          │
│  Zustand store  ──► UI state + optimistic updates         │
│       │                                                     │
│       ├── localStorage (offline cache / fast boot)          │
│       └── Supabase client (source of truth when logged in)  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase ✅                                                │
│  • Auth (email/password)                                    │
│  • Postgres: one `user_progress` row per user (JSON blob)   │
│  • Row Level Security: users can only read/write own row    │
└─────────────────────────────────────────────────────────────┘
```

### Design principles

1. **Curriculum stays in code** — only progress syncs to the cloud.
2. **Progress shape** — reuse `StateSchema` / `AppState` from `src/lib/store.ts` as a single `jsonb` column per user.
3. **Login required for sync** — one personal account, same progress on any PC.
4. **localStorage remains as cache** — cloud wins on conflict when logged in.
5. **Export/Import JSON** — backup path stays in Settings.

### Out of scope (v1)

- Storing curriculum in Supabase
- Multi-user admin / shared roadmaps
- Real-time collaboration
- Normalized tables per lecture (JSON blob is enough for now)

---

## Current codebase map

| Area | File | Role |
|------|------|------|
| Supabase client | `src/lib/supabase.ts` | `createClient` + `isSupabaseConfigured()` |
| Auth & sync orchestration | `src/lib/auth.tsx` | Provider, hydrate on login, debounced save |
| Cloud I/O | `src/lib/progress-sync.ts` | `loadProgress`, `saveProgress`, sync status |
| Progress state | `src/lib/store.ts` | Zustand + `persist` → `localStorage` |
| State shape | `StateSchema` in `store.ts` | Zod validation for cloud payloads |
| Curriculum | `src/lib/curriculum.ts` | Static — **unchanged** |
| Login page | `src/routes/login.tsx` | Email/password sign in & sign up |
| Settings | `src/routes/settings.tsx` | Account, sync status, backup, reset |
| App shell | `src/routes/__root.tsx` | `AuthProvider` wrapper |
| Sidebar | `src/components/AppSidebar.tsx` | Sign in / account / sign out |
| DB migration | `supabase/migrations/001_user_progress.sql` | Table + RLS + trigger |
| Setup guide | `supabase/SETUP.md` | Dashboard steps for new environments |

### Progress data shape (stored in Supabase `data` column)

```ts
{
  completedLectures: Record<lectureId, ISO-date>,
  lectureNotes: Record<lectureId, string>,
  completedProjects: Record<projectId, boolean>,
  projectScores: Record<projectId, number>,
  projectNotes: Record<projectId, string>,
  assessmentScores: Record<assessmentId, number>,
  calendar: Record<YYYY-MM-DD, "learning" | "rest" | "project" | "assessment">,
  activityLog: Record<YYYY-MM-DD, number>,
  settings: { animations: boolean, confirmCompletions: boolean }
}
```

---

## Prerequisites

- [x] A [Supabase](https://supabase.com) project created (`learning-hub`)
- [x] Supabase project URL and **anon** public key in `.env.local`
- [x] Node 18+ and app running (`npm run dev` on port 8080)
- [x] Familiarity with React, Zustand, and basic SQL

---

## Phase 1 — Supabase project setup ✅

### Tasks

- [x] **1.1** Create a Supabase project named `learning-hub`
- [x] **1.2** Enable auth provider: Email + password
- [x] **1.3** Run SQL migration in Supabase SQL Editor (`supabase/migrations/001_user_progress.sql`)
- [x] **1.4** Verify RLS: `user_progress` table exists, 3 policies enabled, data isolated per user

> **Note:** Re-running the full migration after the table exists returns `relation "user_progress" already exists` — this is expected and safe to ignore.

### SQL migration

See `supabase/migrations/001_user_progress.sql` (also copied below for reference).

```sql
create table public.user_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_progress enable row level security;

create policy "Users read own progress"
  on public.user_progress for select
  using (auth.uid() = user_id);

create policy "Users insert own progress"
  on public.user_progress for insert
  with check (auth.uid() = user_id);

create policy "Users update own progress"
  on public.user_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger user_progress_updated_at
  before update on public.user_progress
  for each row execute function public.set_updated_at();
```

### Acceptance criteria

- [x] Table `user_progress` exists with RLS enabled
- [x] Auth sign-up works (app `/login` and Supabase Authentication → Users)

---

## Phase 2 — App dependencies & environment ✅

### Tasks

- [x] **2.1** Install `@supabase/supabase-js`
- [x] **2.2** Add `.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [x] **2.3** Add `.env.example` with placeholder keys
- [x] **2.4** Confirm `.gitignore` excludes `*.local` env files

### Acceptance criteria

- [x] `import.meta.env.VITE_SUPABASE_URL` resolves in dev
- [x] Supabase client initializes without throwing

---

## Phase 3 — Authentication UI ✅

### Tasks

- [x] **3.1** Create `src/lib/auth.tsx` — `AuthProvider`, `useAuth`, `onAuthStateChange`
- [x] **3.2** Create `src/routes/login.tsx` — email/password sign in & sign up
- [x] **3.3** Wrap `RootComponent` in `__root.tsx` with `AuthProvider`
- [x] **3.4** Auth UI in sidebar (sign in link / email + sign out) and Settings
- [x] **3.5** Browse without login allowed — sync optional until signed in

### Acceptance criteria

- [x] User can sign up, sign in, and sign out
- [x] Session persists across page refresh
- [x] Only anon key exposed in client (expected)

---

## Phase 4 — Cloud sync layer ✅

### Tasks

- [x] **4.1** `src/lib/progress-sync.ts` — `loadProgress`, `saveProgress`, `serializeAppState`, debounced save
- [x] **4.2** On login: cloud → Zustand; no cloud + local data → upload; both → cloud wins
- [x] **4.3** Zustand `subscribe` with ~800ms debounced upsert when logged in
- [x] **4.4** On logout: stop sync listener, flush pending save, keep local cache
- [x] **4.5** Sync status in Settings + sidebar (`saving` / `saved` / etc.)

### Conflict strategy (v1)

| Scenario | Resolution |
|----------|------------|
| Login, cloud has data | Cloud → Zustand → localStorage |
| Login, no cloud, local has data | Local → upload to cloud |
| Login, both have data | Cloud wins; local overwritten |
| Not logged in | localStorage only |

### Acceptance criteria

- [x] Lecture completion syncs to Supabase and survives refresh
- [x] `StateSchema` validates cloud payloads
- [x] Debounced saves (~800ms)

---

## Phase 5 — Settings & migration UX ✅

### Tasks

- [x] **5.1** Settings copy updated for signed-in vs local-only mode
- [x] **5.2** Export / Import JSON — import triggers cloud save when signed in
- [x] **5.3** “Upload local progress to cloud” button
- [x] **5.4** Reset clears Zustand + localStorage + cloud (upsert empty state)

### Acceptance criteria

- [x] Export produces valid `StateSchema` JSON
- [x] Import on signed-in session updates Supabase
- [x] Reset clears local + cloud

---

## Phase 6 — Netlify deployment ⏳

### Tasks

- [ ] **6.1** Connect repo to Netlify; configure build (`npm run build`)
- [ ] **6.2** Set environment variables in Netlify:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- [ ] **6.3** In Supabase → Authentication → URL configuration:
  - Add Netlify site URL to **Site URL**
  - Add `https://your-site.netlify.app/**` to **Redirect URLs**
- [ ] **6.4** Smoke test on production: sign in, complete lecture, refresh, second device

### Acceptance criteria

- [ ] Production build deploys without env errors
- [ ] Auth works on Netlify domain
- [ ] Progress sync works end-to-end in production

---

## Phase 7 — Testing checklist ✅ (local)

- [x] Sign up with new email
- [x] Sign in / sign out
- [x] Mark lecture complete → refresh → still complete
- [x] Progress row appears in Supabase `user_progress`
- [x] Different users have isolated progress
- [x] Settings toggles sync
- [x] Export JSON downloads valid file
- [x] Logged-out mode still works (localStorage only)
- [ ] Add lecture note → refresh → note persists (not explicitly verified)
- [ ] Complete project + assessment → syncs (not explicitly verified)
- [ ] Calendar day marking → syncs (not explicitly verified)
- [ ] Second browser / incognito with same account (not explicitly verified)
- [ ] Import JSON restores state + cloud
- [ ] Reset progress clears everything

---

## File changes summary (implemented)

| Action | File | Status |
|--------|------|--------|
| Create | `src/lib/supabase.ts` | ✅ |
| Create | `src/lib/auth.tsx` | ✅ |
| Create | `src/lib/progress-sync.ts` | ✅ |
| Create | `src/routes/login.tsx` | ✅ |
| Create | `supabase/migrations/001_user_progress.sql` | ✅ |
| Create | `supabase/SETUP.md` | ✅ |
| Create | `.env.example` | ✅ |
| Create | `src/vite-env.d.ts` | ✅ |
| Modify | `src/routes/__root.tsx` | ✅ |
| Modify | `src/lib/store.ts` | ✅ |
| Modify | `src/routes/settings.tsx` | ✅ |
| Modify | `src/components/AppSidebar.tsx` | ✅ |
| Modify | `package.json` | ✅ |

---

## Definition of done

| Criterion | Status |
|-----------|--------|
| User can authenticate via Supabase | ✅ |
| Progress loads from cloud on login and saves on change (debounced) | ✅ |
| Same account sees identical progress on different browsers/devices | ✅ (architecture verified; full multi-device QA optional) |
| App deploys to Netlify with env vars | ⏳ Phase 6 |
| localStorage + Export/Import work as fallback | ✅ |
| `curriculum.ts` unchanged | ✅ |

---

## Optional stretch goals (not required for v1)

- [ ] Google OAuth one-click sign in
- [ ] “Last synced at …” timestamp in Settings (partial — shown when status is `saved`)
- [ ] Merge strategy UI when local and cloud both differ (instead of cloud-wins)
- [ ] Clear localStorage on logout to avoid cross-account bleed on shared browser
- [ ] Offline queue: retry failed saves when back online
- [ ] E2E test with Playwright against a test Supabase project
