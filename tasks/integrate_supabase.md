# Developer Assessment: Integrate Supabase

**Project:** Learning Hub (Roadmap Tracker)  
**Goal:** Enable multi-device progress sync after deploying to Netlify  
**Estimated effort:** 1–2 days for an experienced React developer

---

## Vision

Today the app is **fully client-side**: curriculum lives in code (`src/lib/curriculum.ts`), and user progress is persisted in the browser via Zustand + `localStorage` (`roadmap-progress-v1`).

That works locally, but **each browser is isolated**. Deploying to Netlify does not change that — two PCs still see different progress unless we add a shared backend.

### Target architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Netlify (hosted app)                                       │
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
│  Supabase                                                   │
│  • Auth (email/password or Google)                          │
│  • Postgres: one `user_progress` row per user (JSON blob)   │
│  • Row Level Security: users can only read/write own row    │
└─────────────────────────────────────────────────────────────┘
```

### Design principles

1. **Curriculum stays in code** — no need to wait for all 8 months of real lecture data before integrating Supabase. Only progress syncs to the cloud.
2. **Progress shape is already defined** — reuse `StateSchema` / `AppState` from `src/lib/store.ts`. Store it as a single `jsonb` column per user (simple v1).
3. **Login is required for sync** — one personal account, same progress on any PC.
4. **localStorage remains as cache** — faster loads and basic offline tolerance; cloud wins on conflict when logged in.
5. **Keep Export/Import JSON** — backup and migration path stays in Settings.

### Out of scope (v1)

- Storing curriculum in Supabase
- Multi-user admin / shared roadmaps
- Real-time collaboration
- Normalized tables per lecture (JSON blob is enough for now)

---

## Current codebase map

| Area | File | Role |
|------|------|------|
| Progress state | `src/lib/store.ts` | Zustand + `persist` → `localStorage` |
| State shape | `StateSchema` in `store.ts` | Zod schema — reuse for cloud validation |
| Curriculum | `src/lib/curriculum.ts` | Static months/courses/lectures — **unchanged** |
| Settings backup | `src/routes/settings.tsx` | Export/import JSON — keep working |
| App shell | `src/routes/__root.tsx` | Wrap with auth provider here |
| Sidebar | `src/components/AppSidebar.tsx` | Add login/logout affordance |

### Progress data shape (what goes to Supabase)

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

Lecture IDs (e.g. `js-fund-l1`) reference `curriculum.ts` — **do not duplicate curriculum in the DB**.

---

## Prerequisites

Before starting, the developer should have:

- [ ] A [Supabase](https://supabase.com) project created (free tier is fine)
- [ ] Supabase project URL and **anon** public key
- [ ] Node 18+ and existing app running (`npm run dev`)
- [ ] Familiarity with React, Zustand, and basic SQL

---

## Phase 1 — Supabase project setup

### Tasks

- [ ] **1.1** Create a Supabase project named e.g. `learning-hub`
- [ ] **1.2** Enable auth provider(s): Email + password (minimum); optionally Google OAuth
- [ ] **1.3** Run the SQL migration below in the Supabase SQL Editor
- [ ] **1.4** Verify RLS: unauthenticated `select` on `user_progress` returns nothing

### SQL migration

```sql
-- Progress table: one JSON document per user
create table public.user_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_progress enable row level security;

-- Users can only read their own row
create policy "Users read own progress"
  on public.user_progress for select
  using (auth.uid() = user_id);

-- Users can insert their own row (first login)
create policy "Users insert own progress"
  on public.user_progress for insert
  with check (auth.uid() = user_id);

-- Users can update their own row
create policy "Users update own progress"
  on public.user_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Optional: auto-touch updated_at
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

- Table `user_progress` exists with RLS enabled
- Auth sign-up works in Supabase dashboard (Authentication → Users)

---

## Phase 2 — App dependencies & environment

### Tasks

- [ ] **2.1** Install `@supabase/supabase-js`
- [ ] **2.2** Add `.env.local` (gitignored) with:
  ```
  VITE_SUPABASE_URL=https://xxxx.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJ...
  ```
- [ ] **2.3** Add `.env.example` with placeholder keys (no secrets) for other developers
- [ ] **2.4** Confirm `.gitignore` excludes `*.local` env files

### Suggested new files

```
src/lib/supabase.ts       # createClient singleton
src/lib/auth.tsx          # AuthProvider + useAuth hook
src/lib/progress-sync.ts  # load/save helpers for user_progress
```

### Acceptance criteria

- `import.meta.env.VITE_SUPABASE_URL` resolves in dev
- Supabase client initializes without throwing

---

## Phase 3 — Authentication UI

### Tasks

- [ ] **3.1** Create `src/lib/auth.tsx` with:
  - `AuthProvider` wrapping the app
  - `useAuth()` exposing `{ user, session, loading, signIn, signUp, signOut }`
  - `onAuthStateChange` listener to keep session in sync
- [ ] **3.2** Create `src/routes/login.tsx` (or a modal) with:
  - Email + password sign in
  - Sign up link / toggle
  - Error messages from Supabase
- [ ] **3.3** Wrap `RootComponent` in `__root.tsx` with `AuthProvider`
- [ ] **3.4** Add auth UI to sidebar or settings:
  - Logged out → “Sign in” link
  - Logged in → user email + “Sign out”
- [ ] **3.5** Optional: protect routes — redirect to `/login` when sync is required (or allow read-only browse while logged out)

### Acceptance criteria

- User can sign up, sign in, and sign out
- Session persists across page refresh
- No secrets exposed in client bundle beyond the anon key (expected)

---

## Phase 4 — Cloud sync layer

### Tasks

- [ ] **4.1** Create `src/lib/progress-sync.ts`:

  ```ts
  // Pseudocode — implement with StateSchema validation
  loadProgress(userId): Promise<AppState | null>
  saveProgress(userId, data: AppState): Promise<void>
  ```

  - `loadProgress`: `select data from user_progress where user_id = ?`
  - `saveProgress`: `upsert` with validated `StateSchema.parse(data)`
  - Strip Zustand action functions before save (same pattern as `settings.tsx` export)

- [ ] **4.2** On login success:
  1. Fetch cloud progress
  2. If cloud row exists → `importState(cloudData)` into Zustand
  3. If no cloud row but localStorage has data → upload local state (first-time migration)
  4. If both exist → **cloud wins** (document this in code comment); optionally show toast: “Loaded progress from cloud”

- [ ] **4.3** On any store mutation (logged in):
  - Debounce saves (~500–1000 ms) to avoid hammering Supabase
  - Use `subscribe` on Zustand or wrap actions — pick one approach, stay consistent

- [ ] **4.4** On logout:
  - Stop sync listener
  - Optionally clear local Zustand/localStorage or keep local cache (document choice)

- [ ] **4.5** Add sync status indicator (minimal):
  - “Saved” / “Saving…” / “Offline” in Settings or sidebar footer

### Conflict strategy (v1)

| Scenario | Resolution |
|----------|------------|
| Login, cloud has data | Cloud → Zustand → localStorage |
| Login, no cloud, local has data | Local → upload to cloud |
| Login, both have data | Cloud wins; local overwritten |
| Not logged in | Current behavior (localStorage only) |

### Acceptance criteria

- Complete a lecture on PC A → log in → open PC B → same lecture shows complete
- `StateSchema` rejects corrupt cloud payloads gracefully
- Debounced saves do not fire on every keystroke in notes (if notes sync)

---

## Phase 5 — Settings & migration UX

### Tasks

- [ ] **5.1** Update Settings copy: progress syncs when signed in; local-only when signed out
- [ ] **5.2** Keep Export JSON / Import JSON working (import should also trigger cloud save if logged in)
- [ ] **5.3** Add “Upload local progress to cloud” button (manual migration safety net)
- [ ] **5.4** Reset progress: clear Zustand + localStorage + cloud row (if logged in)

### Acceptance criteria

- Export still produces valid `StateSchema` JSON
- Import on a logged-in session updates Supabase
- Reset clears all three layers (local + cloud)

---

## Phase 6 — Netlify deployment

### Tasks

- [ ] **6.1** Connect repo to Netlify; configure build (`npm run build`, publish `dist` or per TanStack Start docs)
- [ ] **6.2** Set environment variables in Netlify:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- [ ] **6.3** In Supabase → Authentication → URL configuration:
  - Add Netlify site URL to **Site URL**
  - Add `https://your-site.netlify.app/**` to **Redirect URLs**
- [ ] **6.4** Smoke test on production URL: sign in, complete lecture, refresh, sign in on another device

### Acceptance criteria

- Production build deploys without env errors
- Auth redirect works on Netlify domain
- Progress sync works end-to-end in production

---

## Phase 7 — Testing checklist

Manual QA before marking the assessment complete:

- [ ] Sign up with new email
- [ ] Sign in / sign out
- [ ] Mark lecture complete → refresh → still complete
- [ ] Add lecture note → refresh → note persists
- [ ] Complete project + assessment → syncs
- [ ] Calendar day marking → syncs
- [ ] Activity log / streak updates after lecture toggle
- [ ] Settings toggles sync
- [ ] Export JSON downloads valid file
- [ ] Import JSON restores state (+ cloud if logged in)
- [ ] Reset progress clears everything
- [ ] Logged-out mode still works (localStorage only)
- [ ] Second browser / incognito with same account sees same progress
- [ ] Invalid session handled (expired token → prompt re-login)

---

## Suggested file changes summary

| Action | File |
|--------|------|
| Create | `src/lib/supabase.ts` |
| Create | `src/lib/auth.tsx` |
| Create | `src/lib/progress-sync.ts` |
| Create | `src/routes/login.tsx` |
| Modify | `src/routes/__root.tsx` — AuthProvider |
| Modify | `src/lib/store.ts` — sync subscription or cloud-aware persist |
| Modify | `src/routes/settings.tsx` — sync status, updated copy |
| Modify | `src/components/AppSidebar.tsx` — auth controls |
| Create | `.env.example` |
| Modify | `package.json` — add `@supabase/supabase-js` |

---

## Notes for the implementer

### Curriculum vs progress

- **Do not** wait for months 2–8 real lecture data before starting this work.
- When filling in placeholder months later, **keep lecture IDs stable** (`r-fund-l1`, etc.) or existing cloud progress for those IDs will appear orphaned.

### Why JSON blob instead of normalized tables?

- Matches existing `AppState` shape — minimal refactor
- One upsert per save — simple RLS
- Easy to validate with existing `StateSchema`
- Can normalize later if needed without blocking v1

### Security

- Anon key in the client is expected; **RLS is the enforcement layer**
- Never add the Supabase **service role** key to the frontend or Netlify public env
- Validate all loaded cloud data with `StateSchema.parse()` before applying to the store

---

## Definition of done

The assessment is complete when:

1. A user can authenticate via Supabase
2. Progress loads from cloud on login and saves on change (debounced)
3. The same account sees identical progress on two different browsers/devices
4. The app deploys to Netlify with env vars configured
5. localStorage + Export/Import still work as fallback
6. `curriculum.ts` is unchanged — curriculum remains static in code

---

## Optional stretch goals (not required for v1)

- [ ] Google OAuth one-click sign in
- [ ] “Last synced at …” timestamp in Settings
- [ ] Merge strategy UI when local and cloud both differ (instead of cloud-wins)
- [ ] Offline queue: retry failed saves when back online
- [ ] E2E test with Playwright against a test Supabase project
