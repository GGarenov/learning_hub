import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, Clock, FileText, Sparkles, CheckCircle2, BookOpen, Trophy, Search, Lock } from "lucide-react";
import { MONTHS, type ModuleDef } from "@/lib/curriculum";
import { useAppStore, monthProgress, monthLectureIds } from "@/lib/store";
import { Shell } from "@/components/Shell";
import { celebrate } from "@/lib/confetti";
import { cn } from "@/lib/utils";
import { CircularProgress } from "@/components/CircularProgress";
import { toast } from "sonner";

export const Route = createFileRoute("/month/$id")({
  head: ({ params }) => {
    const m = MONTHS.find((x) => String(x.id) === params.id);
    return { meta: [{ title: m ? `Month ${m.id} — ${m.title}` : "Month" }, { name: "description", content: m?.description ?? "Month overview" }] };
  },
  component: MonthPage,
  notFoundComponent: () => <Shell><div className="text-center py-20 text-muted-foreground">Month not found</div></Shell>,
  loader: ({ params }) => {
    const m = MONTHS.find((x) => String(x.id) === params.id);
    if (!m) throw notFound();
    return { monthId: m.id };
  },
});

function MonthPage() {
  const { monthId } = Route.useLoaderData();
  const month = MONTHS.find((m) => m.id === monthId)!;
  const completed = useAppStore((s) => s.completedLectures);
  const toggle = useAppStore((s) => s.toggleLecture);
  const notes = useAppStore((s) => s.lectureNotes);
  const setNote = useAppStore((s) => s.setNote);
  const assessmentScores = useAppStore((s) => s.assessmentScores);
  const completedProjects = useAppStore((s) => s.completedProjects);

  const [openNote, setOpenNote] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "todo" | "done">("all");

  const p = monthProgress(month, completed);
  const courseComplete = p.pct === 100;

  const onToggle = (id: string) => {
    const wasDone = !!completed[id];
    toggle(id);
    if (!wasDone) {
      // Check if this completion made the month 100%
      const ids = monthLectureIds(month);
      const newDone = ids.filter((x) => completed[x] || x === id).length;
      if (newDone === ids.length) {
        setTimeout(celebrate, 200);
        toast.success(`Month ${month.id} complete! 🎉`);
      } else {
        toast.success("Nice. Logged.");
      }
    }
  };

  return (
    <Shell>
      <header className="mb-8">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Month {month.id}</div>
        <div className="mt-1 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">{month.title}</h1>
            <p className="text-muted-foreground mt-1">{month.subtitle}</p>
            <p className="text-sm text-muted-foreground mt-3 max-w-2xl">{month.description}</p>
          </div>
          <div className="glass rounded-2xl p-4 flex items-center gap-4">
            <CircularProgress value={p.pct} size={110} stroke={10} sublabel={`${p.done}/${p.total}`} />
            <div className="space-y-2 text-sm">
              <div><span className="text-muted-foreground">Courses:</span> <span className="font-semibold">{month.courses.length}</span></div>
              <div><span className="text-muted-foreground">Lectures:</span> <span className="font-semibold">{p.total}</span></div>
              {month.assessment && (
                <div><span className="text-muted-foreground">Assessment:</span> <span className="font-semibold">{assessmentScores[month.assessment.id] ?? "—"}{assessmentScores[month.assessment.id] !== undefined ? "%" : ""}</span></div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="glass rounded-2xl p-3 flex flex-col sm:flex-row gap-2 mb-6">
        <div className="flex-1 flex items-center gap-2 px-3 bg-secondary/50 rounded-lg">
          <Search className="size-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search lectures…" className="bg-transparent w-full outline-none text-sm py-2" />
        </div>
        <div className="flex gap-1">
          {(["all", "todo", "done"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={cn("px-3 py-2 rounded-lg text-xs font-semibold capitalize", filter === f ? "bg-gradient-primary text-primary-foreground" : "hover:bg-accent text-muted-foreground")}>{f}</button>
          ))}
        </div>
      </div>

      {/* Courses */}
      <div className="space-y-6">
        {month.courses.map((course) => (
          <div key={course.id} className="glass-strong rounded-2xl p-5 md:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-xl bg-gradient-primary flex items-center justify-center"><BookOpen className="size-5 text-primary-foreground" /></div>
              <h2 className="text-xl font-semibold tracking-tight">{course.title}</h2>
            </div>
            <div className="space-y-3">
              {course.modules.map((mod) => (
                <ModuleBlock
                  key={mod.id}
                  mod={mod}
                  completed={completed}
                  onToggle={onToggle}
                  notes={notes}
                  setNote={setNote}
                  openNote={openNote}
                  setOpenNote={setOpenNote}
                  query={q}
                  filter={filter}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Unlocks */}
      {(month.assessment || month.project) && (
        <div className="grid md:grid-cols-2 gap-4 mt-8">
          {month.assessment && (
            <Link
              to={courseComplete ? "/assessment/$monthId" : "/month/$id"}
              params={{ monthId: String(month.id), id: String(month.id) }}
              className={cn("glass-strong rounded-2xl p-6 hover-lift relative overflow-hidden", !courseComplete && "opacity-60 pointer-events-none")}
            >
              <div className="absolute inset-0 bg-gradient-mesh opacity-30" />
              <div className="relative flex items-start gap-4">
                <div className="size-12 rounded-xl bg-gradient-warm flex items-center justify-center"><Sparkles className="size-6 text-primary-foreground" /></div>
                <div className="flex-1">
                  <div className="text-xs uppercase text-muted-foreground tracking-wider">Module Assessment</div>
                  <div className="font-semibold mt-1">{month.assessment.title}</div>
                  <div className="text-sm text-muted-foreground mt-1">{month.assessment.questions.length} questions · Mixed difficulty</div>
                  {!courseComplete && <div className="mt-2 text-xs flex items-center gap-1 text-muted-foreground"><Lock className="size-3" /> Complete all lectures to unlock</div>}
                  {assessmentScores[month.assessment.id] !== undefined && (
                    <div className="mt-2 text-xs"><CheckCircle2 className="inline size-3 text-success mr-1" /> Best: {assessmentScores[month.assessment.id]}%</div>
                  )}
                </div>
              </div>
            </Link>
          )}
          {month.project && (
            <Link
              to={courseComplete ? "/project/$monthId" : "/month/$id"}
              params={{ monthId: String(month.id), id: String(month.id) }}
              className={cn("glass-strong rounded-2xl p-6 hover-lift relative overflow-hidden", !courseComplete && "opacity-60 pointer-events-none")}
            >
              <div className="absolute inset-0 bg-gradient-mesh opacity-30" />
              <div className="relative flex items-start gap-4">
                <div className="size-12 rounded-xl bg-gradient-success flex items-center justify-center"><Trophy className="size-6 text-primary-foreground" /></div>
                <div className="flex-1">
                  <div className="text-xs uppercase text-muted-foreground tracking-wider">Project Assessment</div>
                  <div className="font-semibold mt-1">{month.project.title}</div>
                  <div className="text-sm text-muted-foreground mt-1">{month.project.difficulty} · ~{month.project.estimatedHours}h</div>
                  {!courseComplete && <div className="mt-2 text-xs flex items-center gap-1 text-muted-foreground"><Lock className="size-3" /> Complete all lectures to unlock</div>}
                  {completedProjects[month.project.id] && (
                    <div className="mt-2 text-xs"><CheckCircle2 className="inline size-3 text-success mr-1" /> Completed</div>
                  )}
                </div>
              </div>
            </Link>
          )}
        </div>
      )}
    </Shell>
  );
}

function ModuleBlock({
  mod, completed, onToggle, notes, setNote, openNote, setOpenNote, query, filter,
}: {
  mod: ModuleDef;
  completed: Record<string, string>;
  onToggle: (id: string) => void;
  notes: Record<string, string>;
  setNote: (id: string, n: string) => void;
  openNote: string | null;
  setOpenNote: (id: string | null) => void;
  query: string;
  filter: "all" | "todo" | "done";
}) {
  const [open, setOpen] = useState(true);
  const done = mod.lectures.filter((l) => completed[l.id]).length;
  const pct = Math.round((done / mod.lectures.length) * 100);

  const visible = useMemo(() => {
    return mod.lectures.filter((l) => {
      if (query && !l.title.toLowerCase().includes(query.toLowerCase())) return false;
      if (filter === "todo" && completed[l.id]) return false;
      if (filter === "done" && !completed[l.id]) return false;
      return true;
    });
  }, [mod.lectures, query, filter, completed]);

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-3 p-4 hover:bg-accent/50 transition">
        {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        <div className="flex-1 text-left">
          <div className="font-medium text-sm">{mod.title}</div>
          <div className="mt-1.5 flex items-center gap-3">
            <div className="flex-1 max-w-xs h-1.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-gradient-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[11px] text-muted-foreground">{done}/{mod.lectures.length}</span>
          </div>
        </div>
      </button>
      {open && visible.length > 0 && (
        <ul className="divide-y divide-border">
          {visible.map((l) => {
            const isDone = !!completed[l.id];
            const noteOpen = openNote === l.id;
            return (
              <li key={l.id} className={cn("transition", isDone && "bg-success/5")}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <button
                    onClick={() => onToggle(l.id)}
                    className={cn(
                      "shrink-0 size-5 rounded-md border-2 flex items-center justify-center transition-all",
                      isDone ? "bg-gradient-success border-transparent" : "border-border hover:border-primary"
                    )}
                  >
                    {isDone && <CheckCircle2 className="size-3 text-primary-foreground" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className={cn("text-sm truncate", isDone && "line-through text-muted-foreground")}>{l.title}</div>
                    {isDone && completed[l.id] && (
                      <div className="text-[10px] text-muted-foreground">Done {new Date(completed[l.id]).toLocaleDateString()}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="size-3" /> {l.minutes}m
                  </div>
                  <button
                    onClick={() => setOpenNote(noteOpen ? null : l.id)}
                    className={cn("p-1.5 rounded-md hover:bg-accent", notes[l.id] && "text-primary")}
                    title="Notes"
                  >
                    <FileText className="size-3.5" />
                  </button>
                </div>
                {noteOpen && (
                  <div className="px-4 pb-3">
                    <textarea
                      value={notes[l.id] ?? ""}
                      onChange={(e) => setNote(l.id, e.target.value)}
                      placeholder="Personal notes (markdown supported)…"
                      className="w-full bg-secondary/50 rounded-lg p-3 text-sm outline-none border border-border min-h-[80px]"
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
