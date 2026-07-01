import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { Swords, ExternalLink, Trash2, Search, Target, Award, TrendingUp } from "lucide-react";
import { useAppStore, isoWeekKey, katasThisWeek, weekHistory, weeksOnTarget, type CodewarsEntry } from "@/lib/store";
import { Shell } from "@/components/Shell";
import { StatCard } from "@/components/StatCard";
import { CircularProgress } from "@/components/CircularProgress";
import { CodewarsLogDialog } from "@/components/CodewarsLogDialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/practice")({
  head: () => ({ meta: [{ title: "Practice — Codewars" }] }),
  component: PracticePage,
});

const KYU_COLORS: Record<number, string> = {
  8: "bg-secondary text-muted-foreground",
  7: "bg-secondary text-muted-foreground",
  6: "bg-yellow-500/20 text-yellow-400",
  5: "bg-yellow-500/20 text-yellow-400",
  4: "bg-blue-500/20 text-blue-400",
  3: "bg-blue-500/20 text-blue-400",
  2: "bg-purple-500/20 text-purple-400",
  1: "bg-red-500/20 text-red-400",
};

const MONTH_GUIDANCE: Record<number, { focus: string; note: string }> = {
  1: { focus: "8–7 kyu", note: "Syntax reps while learning JS fundamentals" },
  2: { focus: "7–6 kyu", note: "Arrays, strings, logic — builds on React thinking" },
  3: { focus: "6–5 kyu", note: "TypeScript mindset: stricter problems help" },
  4: { focus: "5–6 kyu", note: "Backend logic & data transformation" },
  5: { focus: "5 kyu", note: "Harder edge cases — good for testing & auth thinking" },
  6: { focus: "5 kyu", note: "Maintenance mode — projects take priority" },
  7: { focus: "any", note: "Capstone month — katas are optional warmup only" },
  8: { focus: "6–5 kyu", note: "Interview prep — sharpen speed and accuracy" },
};

function PracticePage() {
  const entries = useAppStore((s) => s.codewars.entries);
  const weeklyTarget = useAppStore((s) => s.codewars.weeklyTarget);
  const deleteKata = useAppStore((s) => s.deleteKata);
  const setWeeklyTarget = useAppStore((s) => s.setWeeklyTarget);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filterKyu, setFilterKyu] = useState<number | "all">("all");

  const currentWeek = isoWeekKey(new Date().toISOString());
  const thisWeekCount = katasThisWeek(entries, currentWeek);
  const pct = Math.min(100, Math.round((thisWeekCount / weeklyTarget) * 100));
  const history = weekHistory(entries, weeklyTarget, 12);
  const totalKatas = entries.length;
  const weeksHit = weeksOnTarget(entries, weeklyTarget);
  const highestKyu = entries.length ? Math.min(...entries.map((e) => e.kyu)) : 8;

  const weekEntries = entries.filter((e) => isoWeekKey(e.completedAt) === currentWeek);

  const filtered = entries.filter((e) => {
    if (filterKyu !== "all" && e.kyu !== filterKyu) return false;
    if (query && !e.title.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const handleDelete = (e: CodewarsEntry) => {
    if (!confirm(`Delete "${e.title}"?`)) return;
    deleteKata(e.id);
    toast.success("Kata removed");
  };

  return (
    <Shell>
      <header className="mb-8">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">Side quest</div>
        <div className="mt-1 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
              <span className="size-12 rounded-2xl bg-gradient-warm flex items-center justify-center shadow-glow">
                <Swords className="size-6 text-primary-foreground" />
              </span>
              Practice
            </h1>
            <p className="text-muted-foreground mt-2 max-w-xl">
              Codewars katas — 10 per week. Sharpens syntax and problem decomposition alongside your main curriculum.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setDialogOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-warm text-primary-foreground px-5 py-2.5 text-sm font-semibold hover-lift shadow-glow"
              >
                <Swords className="size-4" /> Log completed kata
              </button>
              <a
                href="https://www.codewars.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg glass px-5 py-2.5 text-sm font-semibold hover-lift"
              >
                <ExternalLink className="size-4" /> Open Codewars
              </a>
            </div>
          </div>

          <div className="glass rounded-2xl p-4 flex items-center gap-5 shrink-0">
            <CircularProgress value={pct} size={110} stroke={10} label="This week" sublabel={`${thisWeekCount}/${weeklyTarget}`} />
            <div className="space-y-2 text-sm">
              <div><span className="text-muted-foreground">Total katas:</span> <span className="font-semibold">{totalKatas}</span></div>
              <div><span className="text-muted-foreground">Weeks on target:</span> <span className="font-semibold">{weeksHit}</span></div>
              <div><span className="text-muted-foreground">Best rank:</span> <span className="font-semibold">{highestKyu} kyu</span></div>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Weekly target:</span>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={weeklyTarget}
                  onChange={(e) => setWeeklyTarget(Math.max(1, Number(e.target.value)))}
                  className="w-12 rounded bg-secondary/60 px-2 py-0.5 text-sm font-semibold text-center outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Swords} label="This week" value={`${thisWeekCount}/${weeklyTarget}`} hint={thisWeekCount >= weeklyTarget ? "Target hit 🎉" : `${weeklyTarget - thisWeekCount} to go`} accent="warning" />
        <StatCard icon={Target} label="Total katas" value={totalKatas} />
        <StatCard icon={Award} label="Weeks on target" value={weeksHit} hint="of all recorded weeks" accent="success" />
        <StatCard icon={TrendingUp} label="Best rank solved" value={`${highestKyu} kyu`} accent="primary" />
      </div>

      {/* This week's katas */}
      <section className="glass-strong rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-semibold">This week</div>
            <div className="text-xs text-muted-foreground">Mon – Sun · {thisWeekCount} logged</div>
          </div>
          <div className="h-1.5 w-48 rounded-full bg-secondary overflow-hidden">
            <div className="h-full bg-gradient-warm transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {weekEntries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No katas logged this week yet.{" "}
            <button onClick={() => setDialogOpen(true)} className="text-primary underline underline-offset-2">Log your first one.</button>
          </div>
        ) : (
          <div className="space-y-2">
            {weekEntries.map((e) => (
              <KataRow key={e.id} entry={e} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </section>

      {/* Weekly history chart */}
      <section className="glass rounded-2xl p-5 mb-6">
        <div className="text-sm font-semibold mb-1">Weekly history</div>
        <div className="text-xs text-muted-foreground mb-4">Katas per week — last 12 weeks</div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={history} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
              <XAxis dataKey="label" stroke="oklch(0.7 0.02 270)" fontSize={10} />
              <YAxis stroke="oklch(0.7 0.02 270)" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "oklch(0.21 0.022 270)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12 }}
                formatter={(v: number) => [`${v} katas`]}
              />
              {history.map((d, i) => (
                <Cell
                  key={i}
                  fill={d.hitTarget ? "oklch(0.75 0.15 60)" : "oklch(0.72 0.18 295)"}
                />
              ))}
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {history.map((d, i) => (
                  <Cell key={i} fill={d.hitTarget ? "oklch(0.75 0.15 60)" : "oklch(0.45 0.08 270)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-4 mt-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-yellow-400/70 inline-block" /> Hit target</span>
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-primary/40 inline-block" /> Partial</span>
        </div>
      </section>

      {/* All-time log */}
      <section className="glass-strong rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="text-sm font-semibold">All katas</div>
            <div className="text-xs text-muted-foreground">{totalKatas} logged in total</div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="flex items-center gap-2 px-3 bg-secondary/50 rounded-lg">
              <Search className="size-3.5 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search katas…"
                className="bg-transparent outline-none text-sm py-2 w-36 placeholder:text-muted-foreground/60"
              />
            </div>
            <select
              value={filterKyu === "all" ? "all" : String(filterKyu)}
              onChange={(e) => setFilterKyu(e.target.value === "all" ? "all" : Number(e.target.value))}
              className="rounded-lg bg-secondary/60 px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All ranks</option>
              {[8, 7, 6, 5, 4, 3, 2, 1].map((k) => (
                <option key={k} value={k}>{k} kyu</option>
              ))}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            {totalKatas === 0
              ? <>No katas yet. <button onClick={() => setDialogOpen(true)} className="text-primary underline underline-offset-2">Log your first one.</button></>
              : "No katas match your filter."}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((e) => (
              <KataRow key={e.id} entry={e} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </section>

      {/* Guidance card */}
      <section className="glass rounded-2xl p-5 mt-6">
        <div className="text-sm font-semibold mb-3">Month-by-month focus</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(MONTH_GUIDANCE).map(([monthId, g]) => (
            <Link
              key={monthId}
              to="/month/$id"
              params={{ id: monthId }}
              className="rounded-xl border border-border p-3 hover:bg-accent/50 transition-colors"
            >
              <div className="text-[11px] text-muted-foreground">Month {monthId}</div>
              <div className="text-xs font-semibold mt-0.5">{g.focus}</div>
              <div className="text-[11px] text-muted-foreground mt-1 leading-snug">{g.note}</div>
            </Link>
          ))}
        </div>
      </section>

      <CodewarsLogDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </Shell>
  );
}

function KataRow({ entry, onDelete }: { entry: CodewarsEntry; onDelete: (e: CodewarsEntry) => void }) {
  const date = new Date(entry.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return (
    <div className="flex items-center gap-3 rounded-xl bg-secondary/30 px-4 py-3 group hover:bg-secondary/50 transition-colors">
      <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0", KYU_COLORS[entry.kyu] ?? KYU_COLORS[8])}>
        {entry.kyu} kyu
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">
          {entry.url ? (
            <a href={entry.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
              {entry.title} <ExternalLink className="inline size-3 opacity-50 ml-0.5" />
            </a>
          ) : entry.title}
        </div>
        {entry.note && <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{entry.note}</div>}
      </div>
      <div className="text-[11px] text-muted-foreground shrink-0 hidden sm:block">{entry.language}</div>
      <div className="text-[11px] text-muted-foreground shrink-0">{date}</div>
      <button
        onClick={() => onDelete(entry)}
        className="opacity-0 group-hover:opacity-60 hover:!opacity-100 size-6 rounded flex items-center justify-center text-destructive transition-opacity"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}
