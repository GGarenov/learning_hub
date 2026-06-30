import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { MONTHS } from "@/lib/curriculum";
import { useAppStore } from "@/lib/store";
import { Shell } from "@/components/Shell";
import { celebrate } from "@/lib/confetti";
import { CheckCircle2, Trophy, Clock, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/project/$monthId")({
  head: () => ({ meta: [{ title: "Project" }] }),
  component: ProjectPage,
  loader: ({ params }) => {
    const m = MONTHS.find((x) => String(x.id) === params.monthId);
    if (!m || !m.project) throw notFound();
    return { monthId: m.id };
  },
});

function ProjectPage() {
  const { monthId } = Route.useLoaderData();
  const month = MONTHS.find((m) => m.id === monthId)!;
  const project = month.project!;
  const completed = useAppStore((s) => s.completedProjects[project.id]);
  const savedScore = useAppStore((s) => s.projectScores[project.id]);
  const savedNote = useAppStore((s) => s.projectNotes[project.id]);
  const completeProject = useAppStore((s) => s.completeProject);

  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [score, setScore] = useState(savedScore ?? 80);
  const [note, setNote] = useState(savedNote ?? "");

  const allChecked = project.requirements.every((r) => checks[r]);

  return (
    <Shell>
      <header className="mb-6">
        <Link to="/month/$id" params={{ id: String(month.id) }} className="text-xs text-muted-foreground hover:text-foreground">← Back to Month {month.id}</Link>
        <div className="mt-2 flex items-center gap-3">
          <div className="size-12 rounded-xl bg-gradient-success flex items-center justify-center"><Trophy className="size-6 text-primary-foreground" /></div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
            <div className="text-sm text-muted-foreground">{project.difficulty} · ~{project.estimatedHours}h estimated</div>
          </div>
        </div>
        <p className="mt-3 text-muted-foreground max-w-2xl">{project.description}</p>
      </header>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 glass-strong rounded-2xl p-6">
          <div className="text-sm font-semibold mb-3 flex items-center gap-2"><Wrench className="size-4" /> Acceptance Checklist</div>
          <div className="space-y-2">
            {project.requirements.map((r) => (
              <label key={r} className={cn("flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 cursor-pointer", checks[r] && "bg-success/10 border-success/40")}>
                <input type="checkbox" checked={!!checks[r]} onChange={(e) => setChecks((c) => ({ ...c, [r]: e.target.checked }))} className="size-4 accent-primary" />
                <span className={cn("text-sm", checks[r] && "line-through text-muted-foreground")}>{r}</span>
              </label>
            ))}
          </div>

          <div className="mt-6 text-sm font-semibold mb-2">Project Reflection</div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What did you learn? What was hard?"
            className="w-full bg-secondary/40 rounded-lg p-3 text-sm outline-none border border-border min-h-[140px]"
          />

          <div className="mt-6 flex items-center gap-4">
            <div className="flex-1">
              <div className="text-sm font-semibold mb-1">Self-score: <span className="text-gradient">{score}</span></div>
              <input type="range" min={0} max={100} value={score} onChange={(e) => setScore(+e.target.value)} className="w-full accent-primary" />
            </div>
            <button
              onClick={() => { completeProject(project.id, score, note); celebrate(); }}
              disabled={!allChecked}
              className={cn(
                "rounded-lg px-5 py-2.5 text-sm font-semibold inline-flex items-center gap-2",
                allChecked ? "bg-gradient-success text-primary-foreground" : "bg-secondary text-muted-foreground cursor-not-allowed"
              )}
            >
              <CheckCircle2 className="size-4" /> {completed ? "Update completion" : "Mark complete"}
            </button>
          </div>
          {!allChecked && <div className="text-xs text-muted-foreground mt-2">Check all requirements to enable completion.</div>}
        </div>

        <aside className="glass rounded-2xl p-5 space-y-4">
          <div>
            <div className="text-xs uppercase text-muted-foreground tracking-wider">Difficulty</div>
            <div className="font-semibold">{project.difficulty}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-muted-foreground tracking-wider flex items-center gap-1"><Clock className="size-3" /> Estimated</div>
            <div className="font-semibold">~{project.estimatedHours} hours</div>
          </div>
          <div>
            <div className="text-xs uppercase text-muted-foreground tracking-wider mb-1">Skills</div>
            <div className="flex flex-wrap gap-1.5">
              {project.skills.map((s) => <span key={s} className="text-[11px] px-2 py-1 rounded-md bg-secondary">{s}</span>)}
            </div>
          </div>
          {completed && (
            <div className="rounded-lg bg-success/10 border border-success/30 p-3 text-sm">
              <CheckCircle2 className="inline size-4 text-success mr-1" /> Completed at {savedScore ?? score}%
            </div>
          )}
        </aside>
      </div>
    </Shell>
  );
}
