# Developer Assessment: Integrate Profile Page

**Project:** Learning Hub (Roadmap Tracker)  
**Goal:** Add a stylish profile page with personalized welcome + progress visuals  
**Status:** ✅ **Complete**  
**Completed:** July 2026

---

## Requirements

1. **Profile page** at `/profile` — welcome message, progress bars, charts
2. **Logged-in users** — personalized greeting (username from email), cloud sync badge
3. **Guests** — full app access unchanged; progress stays in `localStorage` only (no Supabase writes)
4. **No auth gates** — profile is viewable by everyone; sign-in is optional upsell

---

## To-do tasks

| # | Task | Status |
|---|------|--------|
| 1 | Write this assessment doc | ✅ |
| 2 | Create `src/routes/profile.tsx` — hero, stats, month progress bars, charts | ✅ |
| 3 | Add Profile nav item to `AppSidebar` + mobile `Shell` menu | ✅ |
| 4 | Link sidebar account block → `/profile` when signed in | ✅ |
| 5 | Regenerate route tree / verify build | ✅ |
| 6 | Update this doc with completion summary | ✅ |

---

## Completion summary

### What was built

- **`src/routes/profile.tsx`** — new profile page at `/profile`
- **`src/components/AppSidebar.tsx`** — Profile nav item; account email links to profile
- **`src/components/Shell.tsx`** — Profile in mobile menu

### Profile page features

| Section | Description |
|---------|-------------|
| **Hero** | Avatar with initials (gradient glow), "Welcome back, {name}", sync/local badge |
| **Stats row** | Lectures, streak, months complete, katas this week |
| **Month progress** | 8 clickable progress bars — link to each month page |
| **Donut chart** | Lectures completed vs remaining |
| **Area chart** | Last 14 days activity |
| **Radar chart** | Skill coverage across all 8 months |
| **Bar chart** | Monthly completion snapshot |
| **Guest CTA** | Soft upsell to sign in for cloud sync (no blocking) |

### Guest vs signed-in UX

| | Guest | Signed in |
|---|-------|-----------|
| Data source | `localStorage` (`roadmap-progress-v1`) | localStorage + Supabase cloud sync |
| Greeting | "Welcome back, **learner**" | "Welcome back, **Alex**" (from email) |
| Badge | "Local only" | "Cloud synced" + relative last-sync time |
| CTA | Sign in to sync | Account settings link |
| App access | Full — no routes blocked | Full |

### Auth / storage behavior (unchanged)

No code changes were needed for guest localStorage — existing architecture already supports this:

- **Zustand `persist`** writes all progress to `roadmap-progress-v1` in localStorage for every user
- **`AuthProvider`** only starts Supabase sync when `user?.id` exists (`auth.tsx` lines 131–148)
- **No route guards** — all pages remain public; `/login` has "Continue without signing in"

### Display name logic

Email `alex.dev@example.com` → **Alex Dev** (split on `.`, `_`, `-`, capitalize)

### Verified

- `npm run build` passes
- Route registered in TanStack Router file tree (`/profile`)
- Profile chunk builds separately (~18 kB client)

### Ideas for future (not implemented)

- Editable display name (stored in Supabase user metadata)
- Profile avatar upload
- "Member since" date from `user.created_at`
- Shareable progress card image
- Level / XP system based on lectures + katas

---

## Design plan (reference)

### Hero section
- Avatar with initials (gradient ring)
- **Signed in:** "Welcome back, **Alex**" (from email local-part)
- **Guest:** "Welcome, **learner**" + subtle note: progress saved locally · sign in to sync
- Circular overall completion + member/sync status pill

### Progress section
- Per-month horizontal progress bars (title, %, gradient fill) — scrollable grid
- Stat cards: lectures, streak, projects, katas

### Charts
- Donut: lectures completed vs remaining
- Area chart: last 14 days activity
- Skill radar across months (reuse dashboard pattern)

---

## Execution log

1. **Assessment** — reviewed `auth.tsx`, `store.ts`, `statistics.tsx`, `index.tsx` for patterns
2. **Profile route** — created `profile.tsx` reusing `CircularProgress`, `StatCard`, Recharts, glass UI
3. **Navigation** — added Profile to sidebar (after Dashboard) and mobile menu
4. **Account link** — sidebar email now links to `/profile`
5. **Build** — `npm run build` succeeded
