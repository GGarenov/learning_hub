import { create } from "zustand";
import { persist } from "zustand/middleware";
import { z } from "zod";
import { MONTHS, TOTAL_LECTURES, TOTAL_MINUTES, ALL_LECTURE_IDS, type MonthDef } from "./curriculum";

export type CalendarKind = "learning" | "rest" | "project" | "assessment";

export const KYU_VALUES = [8, 7, 6, 5, 4, 3, 2, 1] as const;
export type Kyu = (typeof KYU_VALUES)[number];

export const CodewarsEntrySchema = z.object({
  id: z.string(),
  title: z.string(),
  kyu: z.union([z.literal(8), z.literal(7), z.literal(6), z.literal(5), z.literal(4), z.literal(3), z.literal(2), z.literal(1)]),
  language: z.string(),
  url: z.string().optional(),
  note: z.string().optional(),
  completedAt: z.string(), // ISO datetime
});

export type CodewarsEntry = z.infer<typeof CodewarsEntrySchema>;

export const StateSchema = z.object({
  completedLectures: z.record(z.string(), z.string()), // lectureId -> ISO date
  lectureNotes: z.record(z.string(), z.string()),
  completedProjects: z.record(z.string(), z.boolean()),
  projectScores: z.record(z.string(), z.number()),
  projectNotes: z.record(z.string(), z.string()),
  assessmentScores: z.record(z.string(), z.number()), // 0-100
  calendar: z.record(z.string(), z.enum(["learning", "rest", "project", "assessment"])),
  activityLog: z.record(z.string(), z.number()), // YYYY-MM-DD -> lectures completed
  settings: z.object({
    animations: z.boolean(),
    confirmCompletions: z.boolean(),
  }),
  codewars: z.object({
    weeklyTarget: z.number(),
    entries: z.array(CodewarsEntrySchema),
  }),
});

export type AppState = z.infer<typeof StateSchema>;

interface Store extends AppState {
  toggleLecture: (lectureId: string) => void;
  setNote: (lectureId: string, note: string) => void;
  completeProject: (projectId: string, score: number, reflection: string) => void;
  recordAssessment: (assessmentId: string, score: number) => void;
  setCalendarDay: (date: string, kind: CalendarKind | null) => void;
  setSetting: <K extends keyof AppState["settings"]>(k: K, v: AppState["settings"][K]) => void;
  logKata: (entry: Omit<CodewarsEntry, "id" | "completedAt">) => void;
  deleteKata: (id: string) => void;
  setWeeklyTarget: (n: number) => void;
  reset: () => void;
  importState: (s: AppState) => void;
}

const initial: AppState = {
  completedLectures: {},
  lectureNotes: {},
  completedProjects: {},
  projectScores: {},
  projectNotes: {},
  assessmentScores: {},
  calendar: {},
  activityLog: {},
  settings: { animations: true, confirmCompletions: false },
  codewars: { weeklyTarget: 10, entries: [] },
};

const todayKey = () => new Date().toISOString().slice(0, 10);

export const useAppStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initial,
      toggleLecture: (id) =>
        set((s) => {
          const completed = { ...s.completedLectures };
          const log = { ...s.activityLog };
          const today = todayKey();
          if (completed[id]) {
            delete completed[id];
            log[today] = Math.max(0, (log[today] ?? 1) - 1);
          } else {
            completed[id] = new Date().toISOString();
            log[today] = (log[today] ?? 0) + 1;
          }
          return { completedLectures: completed, activityLog: log };
        }),
      setNote: (id, note) =>
        set((s) => ({ lectureNotes: { ...s.lectureNotes, [id]: note } })),
      completeProject: (id, score, reflection) =>
        set((s) => ({
          completedProjects: { ...s.completedProjects, [id]: true },
          projectScores: { ...s.projectScores, [id]: score },
          projectNotes: { ...s.projectNotes, [id]: reflection },
        })),
      recordAssessment: (id, score) =>
        set((s) => ({ assessmentScores: { ...s.assessmentScores, [id]: score } })),
      setCalendarDay: (date, kind) =>
        set((s) => {
          const cal = { ...s.calendar };
          if (!kind) delete cal[date];
          else cal[date] = kind;
          return { calendar: cal };
        }),
      setSetting: (k, v) =>
        set((s) => ({ settings: { ...s.settings, [k]: v } })),
      logKata: (entry) =>
        set((s) => ({
          codewars: {
            ...s.codewars,
            entries: [
              { ...entry, id: crypto.randomUUID(), completedAt: new Date().toISOString() },
              ...s.codewars.entries,
            ],
          },
        })),
      deleteKata: (id) =>
        set((s) => ({
          codewars: { ...s.codewars, entries: s.codewars.entries.filter((e) => e.id !== id) },
        })),
      setWeeklyTarget: (n) =>
        set((s) => ({ codewars: { ...s.codewars, weeklyTarget: n } })),
      reset: () => set({ ...initial }),
      importState: (s) => set({ ...s }),
    }),
    { name: "roadmap-progress-v1" }
  )
);

// ---------- selectors ----------
export const monthLectureIds = (m: MonthDef) =>
  m.courses.flatMap((c) => c.modules.flatMap((mod) => mod.lectures.map((l) => l.id)));

export const monthProgress = (m: MonthDef, completed: Record<string, string>) => {
  const ids = monthLectureIds(m);
  const done = ids.filter((id) => completed[id]).length;
  return { done, total: ids.length, pct: ids.length ? Math.round((done / ids.length) * 100) : 0 };
};

export const monthMinutes = (m: MonthDef) =>
  m.courses.reduce(
    (a, c) => a + c.modules.reduce((b, mod) => b + mod.lectures.reduce((s, l) => s + l.minutes, 0), 0),
    0
  );

export const completedMinutes = (completed: Record<string, string>) => {
  let mins = 0;
  for (const m of MONTHS) {
    for (const c of m.courses) {
      for (const mod of c.modules) {
        for (const l of mod.lectures) {
          if (completed[l.id]) mins += l.minutes;
        }
      }
    }
  }
  return mins;
};

export const computeStreak = (log: Record<string, number>) => {
  let streak = 0;
  const d = new Date();
  while (true) {
    const k = d.toISOString().slice(0, 10);
    if ((log[k] ?? 0) > 0) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      // allow today to be empty without breaking yesterday's streak
      if (streak === 0 && k === todayKey()) {
        d.setDate(d.getDate() - 1);
        continue;
      }
      break;
    }
  }
  return streak;
};

export const longestStreak = (log: Record<string, number>) => {
  const days = Object.keys(log).filter((k) => log[k] > 0).sort();
  if (!days.length) return 0;
  let best = 1, cur = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]);
    const curD = new Date(days[i]);
    const diff = (curD.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) cur++; else cur = 1;
    if (cur > best) best = cur;
  }
  return best;
};

export const allConstants = { TOTAL_LECTURES, TOTAL_MINUTES, ALL_LECTURE_IDS };

// ---------- codewars selectors ----------
export const katasThisWeek = (entries: CodewarsEntry[], weekKey: string) =>
  entries.filter((e) => isoWeekKey(e.completedAt) === weekKey).length;

export const weekHistory = (entries: CodewarsEntry[], weeklyTarget: number, n = 12) => {
  const result: { week: string; label: string; count: number; hitTarget: boolean }[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i * 7);
    const key = isoWeekKey(d.toISOString());
    const count = entries.filter((e) => isoWeekKey(e.completedAt) === key).length;
    result.push({ week: key, label: weekLabel(d), count, hitTarget: count >= weeklyTarget });
  }
  return result;
};

export const weeksOnTarget = (entries: CodewarsEntry[], weeklyTarget: number) => {
  const byWeek = new Map<string, number>();
  for (const e of entries) {
    const k = isoWeekKey(e.completedAt);
    byWeek.set(k, (byWeek.get(k) ?? 0) + 1);
  }
  return [...byWeek.values()].filter((c) => c >= weeklyTarget).length;
};

function isoWeekKey(iso: string): string {
  const d = new Date(iso);
  // shift to Monday-based week
  const day = d.getUTCDay() === 0 ? 6 : d.getUTCDay() - 1;
  const mon = new Date(d);
  mon.setUTCDate(d.getUTCDate() - day);
  return mon.toISOString().slice(0, 10);
}

function weekLabel(d: Date): string {
  const day = d.getUTCDay() === 0 ? 6 : d.getUTCDay() - 1;
  const mon = new Date(d);
  mon.setUTCDate(d.getUTCDate() - day);
  return mon.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export { isoWeekKey, weekLabel };
