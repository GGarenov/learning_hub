import { supabase } from "./supabase";
import { StateSchema, type AppState } from "./store";

export type SyncStatus = "idle" | "loading" | "saving" | "saved" | "error" | "offline";

let syncStatus: SyncStatus = "idle";
let lastSyncedAt: string | null = null;
const listeners = new Set<() => void>();

function setSyncStatus(status: SyncStatus) {
  syncStatus = status;
  listeners.forEach((cb) => cb());
}

export function getSyncStatus(): SyncStatus {
  return syncStatus;
}

export function getLastSyncedAt(): string | null {
  return lastSyncedAt;
}

export function subscribeSyncStatus(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function serializeAppState(state: Record<string, unknown>): AppState {
  const {
    toggleLecture,
    setNote,
    completeProject,
    recordAssessment,
    setCalendarDay,
    setSetting,
    reset,
    importState,
    ...data
  } = state;
  return StateSchema.parse(data);
}

export function hasProgressData(state: AppState): boolean {
  return (
    Object.keys(state.completedLectures).length > 0 ||
    Object.keys(state.lectureNotes).length > 0 ||
    Object.keys(state.completedProjects).length > 0 ||
    Object.keys(state.assessmentScores).length > 0 ||
    Object.keys(state.calendar).length > 0 ||
    Object.keys(state.activityLog).length > 0
  );
}

export async function loadProgress(userId: string): Promise<AppState | null> {
  if (!supabase) {
    setSyncStatus("offline");
    return null;
  }

  setSyncStatus("loading");

  const { data, error } = await supabase
    .from("user_progress")
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load progress:", error);
    setSyncStatus("error");
    throw error;
  }

  if (!data?.data || Object.keys(data.data).length === 0) {
    setSyncStatus("idle");
    return null;
  }

  try {
    const parsed = StateSchema.parse(data.data);
    setSyncStatus("saved");
    return parsed;
  } catch (e) {
    console.error("Invalid cloud progress payload:", e);
    setSyncStatus("error");
    throw e;
  }
}

export async function saveProgress(userId: string, state: AppState): Promise<void> {
  if (!supabase) {
    setSyncStatus("offline");
    return;
  }

  const validated = StateSchema.parse(state);
  setSyncStatus("saving");

  const { error } = await supabase.from("user_progress").upsert(
    { user_id: userId, data: validated },
    { onConflict: "user_id" },
  );

  if (error) {
    console.error("Failed to save progress:", error);
    setSyncStatus("error");
    throw error;
  }

  lastSyncedAt = new Date().toISOString();
  setSyncStatus("saved");
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let pendingSave: { userId: string; state: AppState } | null = null;

export function debouncedSaveProgress(userId: string, state: AppState, delayMs = 800): void {
  pendingSave = { userId, state };
  if (saveTimer) clearTimeout(saveTimer);
  setSyncStatus("saving");

  saveTimer = setTimeout(async () => {
    if (!pendingSave) return;
    const payload = pendingSave;
    pendingSave = null;
    try {
      await saveProgress(payload.userId, payload.state);
    } catch {
      // status already set to error
    }
  }, delayMs);
}

export function flushPendingSave(): Promise<void> {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  if (!pendingSave) return Promise.resolve();
  const payload = pendingSave;
  pendingSave = null;
  return saveProgress(payload.userId, payload.state).then(() => undefined);
}

export function cancelPendingSave(): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  pendingSave = null;
}
