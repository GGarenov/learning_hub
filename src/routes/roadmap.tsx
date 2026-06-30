import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, CheckCircle2, ArrowRight, Activity } from "lucide-react";
import { MONTHS } from "@/lib/curriculum";
import { useAppStore, monthProgress } from "@/lib/store";
import { Shell } from "@/components/Shell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/roadmap")({
  head: () => ({ meta: [{ title: "Roadmap" }, { name: "description", content: "Your 8-month learning path." }] }),
  component: RoadmapPage,
});

function RoadmapPage() {
  const completed = useAppStore((s) => s.completedLectures);

  const status = (idx: number) => {
    const p = monthProgress(MONTHS[idx], completed);
    if (p.pct === 100) return "completed";
    if (p.pct > 0) return "active";
    // unlock month if previous is completed OR it's month 1
    if (idx === 0) return "active";
    const prev = monthProgress(MONTHS[idx - 1], completed);
    return prev.pct >= 80 ? "active" : "locked";
  };

  return (
    <Shell>
      <header className="mb-8">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">Your path</div>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">The <span className="text-gradient">8-month</span> roadmap</h1>
        <p className="mt-2 text-muted-foreground">A visual timeline of every month, course, and milestone.</p>
      </header>

      <div className="relative">
        <div className="absolute left-6 md:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-primary/60 via-border to-transparent" />
        <div className="space-y-5">
          {MONTHS.map((m, i) => {
            const p = monthProgress(m, completed);
            const st = status(i);
            return (
              <div key={m.id} className="relative pl-14 md:pl-20">
                <div className={cn(
                  "absolute left-0 top-4 size-12 md:size-16 rounded-2xl flex items-center justify-center font-bold text-lg shadow-card",
                  st === "completed" ? "bg-gradient-success" : st === "active" ? "bg-gradient-primary shadow-glow" : "bg-secondary text-muted-foreground"
                )}>
                  {st === "locked" ? <Lock className="size-5" /> : st === "completed" ? <CheckCircle2 className="size-6 text-primary-foreground" /> : <span className="text-primary-foreground">{m.id}</span>}
                </div>

                <Link
                  to="/month/$id"
                  params={{ id: String(m.id) }}
                  className={cn("group block glass rounded-2xl p-5 md:p-6 hover-lift", st === "locked" && "opacity-60")}
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-wider text-muted-foreground">Month {m.id}</span>
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase",
                          st === "completed" ? "bg-success/20 text-success" : st === "active" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                        )}>{st}</span>
                      </div>
                      <h2 className="mt-1 text-xl md:text-2xl font-semibold tracking-tight">{m.title}</h2>
                      <p className="text-sm text-muted-foreground mt-1">{m.description}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {m.courses.map((c) => (
                          <span key={c.id} className="text-[11px] px-2 py-1 rounded-md bg-secondary/80">{c.title}</span>
                        ))}
                      </div>
                    </div>
                    <div className="md:w-56 shrink-0">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground flex items-center gap-1"><Activity className="size-3" /> Progress</span>
                        <span className="font-semibold">{p.pct}%</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-primary transition-all" style={{ width: `${p.pct}%` }} />
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground">{p.done} / {p.total} lectures</div>
                      <div className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                        Open <ArrowRight className="size-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}
