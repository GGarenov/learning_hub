# Codewars Practice Integration

**Project:** Learning Hub (Roadmap Tracker)
**Goal:** Track a weekly Codewars kata habit (10/week) alongside the 8-month curriculum
**Status:** ✅ Completed — fully implemented as a side-quest track

---

## Overview

Codewars practice lives as a **parallel habit track**, not part of the 8-month curriculum. Lectures, projects, and assessments are the main path. Codewars is a weekly reps cadence for syntax fluency and problem decomposition.

- Default target: **10 katas / week** (editable in the Practice page)
- You solve on [codewars.com](https://www.codewars.com), then log the completion here in under 30 seconds
- No curriculum pollution — katas are never counted toward month or lecture completion percentages

---

## Design decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Main path vs side quest | Side quest | Avoids bloating curriculum %; katas are optional |
| Logging method | Manual (v1) | Fast to build; no API key required |
| Week boundary | Monday–Sunday (ISO) | Consistent with most calendar tools |
| Progress storage | Zustand + localStorage (same store) | No new infrastructure needed |
| Export/import | Automatic | `StateSchema` extended; Settings export/import already exports everything |
| Weekly target | Editable in-place on Practice page | One number, no settings screen needed |

---

## What was built

### New files

| File | Purpose |
|------|---------|
| `src/routes/practice.tsx` | Main Practice page at `/practice` |
| `src/components/CodewarsLogDialog.tsx` | Modal form to log a completed kata |
| `src/components/WeeklyPracticeCard.tsx` | Dashboard widget with ring, progress bar, quick log button |

### Modified files

| File | Change |
|------|--------|
| `src/lib/store.ts` | Added `CodewarsEntry` type, `codewars` slice in `StateSchema`, `logKata` / `deleteKata` / `setWeeklyTarget` actions, and selectors (`katasThisWeek`, `weekHistory`, `weeksOnTarget`, `isoWeekKey`, `weekLabel`) |
| `src/routes/index.tsx` | Added "Katas this week" stat card + `WeeklyPracticeCard` widget above the motivation block |
| `src/routes/achievements.tsx` | Added 6 Codewars-specific badges |
| `src/routes/statistics.tsx` | Added "Practice — katas per week" bar chart + "Total katas" stat card |
| `src/components/AppSidebar.tsx` | Added `Practice` nav item (Swords icon) |
| `src/components/Shell.tsx` | Added `Practice` link to mobile topbar |

---

## Data model

```ts
// Added to StateSchema in src/lib/store.ts
type CodewarsEntry = {
  id: string;             // crypto.randomUUID()
  title: string;          // kata name
  kyu: 8 | 7 | 6 | 5 | 4 | 3 | 2 | 1;
  language: string;       // e.g. "javascript"
  url?: string;           // optional link to kata
  note?: string;          // optional personal note
  completedAt: string;    // ISO datetime
};

codewars: {
  weeklyTarget: number;   // default 10
  entries: CodewarsEntry[];
}
```

Week key format: `"YYYY-MM-DD"` of the Monday that starts the ISO week.

---

## Practice page (`/practice`)

### Sections

1. **Header** — title, description, "Log completed kata" + "Open Codewars" buttons
2. **Ring + stats** — `CircularProgress` ring (this week %), quick stats, inline target editor
3. **Stats row** — 4 `StatCard`s: this week, total, weeks on target, best rank solved
4. **This week** — list of katas logged in the current Mon–Sun window
5. **Weekly history chart** — 12-week bar chart (orange = target hit, muted = partial)
6. **All katas** — searchable, filterable (by kyu) full log with delete
7. **Month-by-month focus** — guidance on which rank to focus per curriculum month

### Kata log dialog

Fields: kata name (required), rank (8–1 kyu), language, Codewars URL (optional), note (optional).
"Browse" button opens Codewars search filtered to selected rank.
Confetti fires when logging the kata that hits the weekly target.

---

## Achievements (6 new badges)

| Badge | Condition |
|-------|-----------|
| First Blood | Log 1 kata |
| Week Warrior | Hit weekly target in any single week |
| Consistent Coder | Hit weekly target 4+ times (any weeks) |
| Century | 100 total katas logged |
| Rank Up | Solve first 6 kyu (or harder) kata |
| Interview Ready | 50+ katas logged & Month 8 started |

---

## Month-by-month focus guidance

Shown as clickable cards on the Practice page. Guidance only — not enforced:

| Month | Focus | Note |
|-------|-------|------|
| 1 | 8–7 kyu | Syntax reps while learning JS |
| 2 | 7–6 kyu | Arrays, strings, logic |
| 3 | 6–5 kyu | TypeScript mindset |
| 4 | 5–6 kyu | Backend logic & data transformation |
| 5 | 5 kyu | Harder edge cases |
| 6 | 5 kyu | Maintenance mode — projects take priority |
| 7 | any | Capstone month — katas are optional warmup |
| 8 | 6–5 kyu | Interview prep — sharpen speed and accuracy |

---

## Future work (v2 / v3)

- [ ] **Codewars API sync** — user pastes their API token in Settings; "Sync from Codewars" auto-imports recent completions (uses `GET /api/v1/users/:user/code-challenges/completed`)
- [ ] **Kata difficulty distribution chart** — pie/bar showing kyu breakdown of all logged katas
- [ ] **Month banners** — slim call-to-action on month 1, 2, and 8 pages linking to `/practice`
- [ ] **Weekly target per month** — per-month targets configurable in practice settings

---

## How to use

1. Solve a kata on [codewars.com](https://www.codewars.com)
2. Click **Practice** in the sidebar (or the "Log kata" button on the dashboard widget)
3. Fill in name, rank, language — takes ~15 seconds
4. Hit 10/week to trigger confetti and the **Week Warrior** badge
