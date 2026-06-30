import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import { Shell } from "@/components/Shell";
import { useAppStore, StateSchema } from "@/lib/store";
import { Download, Upload, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const state = useAppStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const exportData = () => {
    const { toggleLecture, setNote, completeProject, recordAssessment, setCalendarDay, setSetting, reset, importState, ...data } = state as any;
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `roadmap-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported your progress");
  };

  const importData = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        const valid = StateSchema.parse(parsed);
        state.importState(valid);
        toast.success("Progress imported");
      } catch (e) {
        toast.error("Invalid file");
      }
    };
    reader.readAsText(file);
  };

  return (
    <Shell>
      <header className="mb-8">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">Preferences</div>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">Settings</h1>
      </header>

      <div className="space-y-4 max-w-2xl">
        <Section title="Appearance" desc="The dashboard is dark by default and tuned for long sessions.">
          <Toggle label="Animations" checked={state.settings.animations} onChange={(v) => state.setSetting("animations", v)} />
          <Toggle label="Confirm before marking complete" checked={state.settings.confirmCompletions} onChange={(v) => state.setSetting("confirmCompletions", v)} />
        </Section>

        <Section title="Backup" desc="Your progress lives in this browser. Export to keep a copy safe.">
          <div className="flex flex-wrap gap-2">
            <button onClick={exportData} className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary text-primary-foreground px-4 py-2 text-sm font-semibold"><Download className="size-4" /> Export JSON</button>
            <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg glass px-4 py-2 text-sm font-semibold"><Upload className="size-4" /> Import JSON</button>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])} />
          </div>
        </Section>

        <Section title="Danger zone" desc="This permanently clears all your progress.">
          <button
            onClick={() => { if (confirm("Reset all progress? This cannot be undone.")) { state.reset(); toast.success("Progress reset"); } }}
            className="inline-flex items-center gap-2 rounded-lg bg-destructive/15 text-destructive border border-destructive/30 px-4 py-2 text-sm font-semibold hover:bg-destructive/25"
          >
            <Trash2 className="size-4" /> Reset progress
          </button>
        </Section>

        <div className="glass rounded-2xl p-5 flex items-start gap-3">
          <Sparkles className="size-5 text-primary mt-0.5" />
          <div className="text-sm text-muted-foreground">
            Built for personal use. No accounts. No backend. Everything is stored locally in your browser via localStorage.
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
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-6 rounded-full transition ${checked ? "bg-gradient-primary" : "bg-secondary"}`}
      >
        <span className={`absolute top-0.5 ${checked ? "left-5" : "left-0.5"} size-5 rounded-full bg-background transition-all`} />
      </button>
    </label>
  );
}
