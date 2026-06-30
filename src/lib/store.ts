import { create } from "zustand";
import { persist } from "zustand/middleware";
import { z } from "zod";
import { MONTHS, TOTAL_LECTURES, TOTAL_MINUTES, ALL_LECTURE_IDS, type MonthDef } from "./curriculum";

export type CalendarKind = "learning" | "rest" | "project" | "assessment";

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
});

export type AppState = z.infer<typeof StateSchema>;

interface Store extends AppState {
  toggleLecture: (lectureId: string) => void;
  setNote: (lectureId: string, note: string) => void;
  completeProject: (projectId: string, score: number, reflection: string) => void;
  recordAssessment: (assessmentId: string, score: number) => void;
  setCalendarDay: (date: string, kind: CalendarKind | null) => void;
  setSetting: <K extends keyof AppState["settings"]>(k: K, v: AppState["settings"][K]) => void;
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
