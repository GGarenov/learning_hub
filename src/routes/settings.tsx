import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import { Shell } from "@/components/Shell";
import { useAuth } from "@/lib/auth";
import { saveProgress, serializeAppState } from "@/lib/progress-sync";
import { useAppStore, StateSchema } from "@/lib/store";
import { Cloud, Download, Upload, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings" }] }),
  component: SettingsPage,
});

function syncStatusLabel(status: string, lastSyncedAt: string | null): string {
  switch (status) {
    case "saving":
      return "Saving…";
    case "saved":
      return lastSyncedAt ? `Saved · ${new Date(lastSyncedAt).toLocaleString()}` : "Saved";
    case "loading":
      return "Loading from cloud…";
    case "error":
      return "Sync error";
    case "offline":
      return "Offline (local only)";
    default:
      return "Idle";
  }
}

function SettingsPage() {
  const state = useAppStore();
  const { user, configured, syncStatus, lastSyncedAt, uploadLocalToCloud } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const exportData = () => {
    const data = serializeAppState(state as Record<string, unknown>);
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `roadmap-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported your progress");
  };

  const importData = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        const valid = StateSchema.parse(parsed);
        state.importState(valid);
        if (user?.id) await saveProgress(user.id, valid);
        toast.success(user ? "Progress imported and synced" : "Progress imported");
      } catch {
        toast.error("Invalid file");
      }
    };
    reader.readAsText(file);
  };

  const resetAll = async () => {
    if (!confirm("Reset all progress? This cannot be undone.")) return;
    state.reset();
    if (user?.id) {
      try {
        await saveProgress(user.id, serializeAppState(useAppStore.getState() as Record<string, unknown>));
      } catch {
        toast.error("Local reset done, but cloud reset failed");
        return;
      }
    }
    toast.success("Progress reset");
  };

  return (
    <Shell>
      <header className="mb-8">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">Preferences</div>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">Settings</h1>
      </header>

      <div className="space-y-4 max-w-2xl">
        <Section
          title="Account & sync"
          desc={
            user
              ? "Signed in — progress syncs to the cloud automatically."
              : "Sign in to sync progress across devices. Without an account, data stays in this browser only."
          }
        >
          {configured ? (
            <div className="rounded-lg border border-border p-3 text-sm space-y-2">
              {user ? (
                <>
                  <div>
                    <span className="text-muted-foreground">Signed in as </span>
                    <span className="font-medium">{user.email}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Sync: {syncStatusLabel(syncStatus, lastSyncedAt)}
                  </div>
                </>
              ) : (
                <a href="/login" className="text-primary font-medium hover:underline">
                  Sign in or create account →
                </a>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
              Add <code className="text-xs">VITE_SUPABASE_URL</code> and{" "}
              <code className="text-xs">VITE_SUPABASE_ANON_KEY</code> to <code className="text-xs">.env.local</code>.
            </div>
          )}
          {user && (
            <button
              onClick={() => uploadLocalToCloud().catch(() => toast.error("Upload failed"))}
              className="inline-flex items-center gap-2 rounded-lg glass px-4 py-2 text-sm font-semibold"
            >
              <Cloud className="size-4" /> Upload local progress to cloud
            </button>
          )}
        </Section>

        <Section title="Appearance" desc="The dashboard is dark by default and tuned for long sessions.">
          <Toggle label="Animations" checked={state.settings.animations} onChange={(v) => state.setSetting("animations", v)} />
          <Toggle label="Confirm before marking complete" checked={state.settings.confirmCompletions} onChange={(v) => state.setSetting("confirmCompletions", v)} />
        </Section>

        <Section title="Backup" desc="Export a JSON copy anytime. Import restores progress and syncs when signed in.">
          <div className="flex flex-wrap gap-2">
            <button onClick={exportData} className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary text-primary-foreground px-4 py-2 text-sm font-semibold"><Download className="size-4" /> Export JSON</button>
            <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg glass px-4 py-2 text-sm font-semibold"><Upload className="size-4" /> Import JSON</button>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])} />
          </div>
        </Section>

        <Section title="Danger zone" desc="Clears local progress and your cloud copy when signed in.">
          <button
            onClick={resetAll}
            className="inline-flex items-center gap-2 rounded-lg bg-destructive/15 text-destructive border border-destructive/30 px-4 py-2 text-sm font-semibold hover:bg-destructive/25"
          >
            <Trash2 className="size-4" /> Reset progress
          </button>
        </Section>

        <div className="glass rounded-2xl p-5 flex items-start gap-3">
          <Sparkles className="size-5 text-primary mt-0.5" />
          <div className="text-sm text-muted-foreground">
            Curriculum stays in the app. Your progress is cached in localStorage and synced to Supabase when you are signed in.
          </div>
        </div>
      </div>
    </Shell>
  );
}

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="glass-strong rounded-2xl p-6">
      <div className="font-semibold">{title}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-accent/40">
      <span className="text-sm">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-6 rounded-full transition ${checked ? "bg-gradient-primary" : "bg-secondary"}`}
      >
        <span className={`absolute top-0.5 ${checked ? "left-5" : "left-0.5"} size-5 rounded-full bg-background transition-all`} />
      </button>
    </label>
  );
}
