import { createFileRoute } from "@tanstack/react-router";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell } from "recharts";
import { MONTHS, TOTAL_LECTURES, TOTAL_MINUTES } from "@/lib/curriculum";
import { useAppStore, monthProgress, completedMinutes, computeStreak, longestStreak, weekHistory, weeksOnTarget } from "@/lib/store";
import { Shell } from "@/components/Shell";
import { StatCard } from "@/components/StatCard";
import { CheckCircle2, Flame, TrendingUp, Trophy, Clock, BookOpen, Star, Calendar, Swords } from "lucide-react";

export const Route = createFileRoute("/statistics")({
  head: () => ({ meta: [{ title: "Statistics" }] }),
  component: StatisticsPage,
});

function StatisticsPage() {
  const state = useAppStore();
  const doneCount = Object.keys(state.completedLectures).length;
  const overallPct = (doneCount / TOTAL_LECTURES) * 100;
  const mins = completedMinutes(state.completedLectures);
  const completedMonths = MONTHS.filter((m) => monthProgress(m, state.completedLectures).pct === 100).length;
  const completedProjects = Object.values(state.completedProjects).filter(Boolean).length;
  const projectAvg = (() => {
    const scores = Object.values(state.projectScores);
    return scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  })();
  const assessmentAvg = (() => {
    const scores = Object.values(state.assessmentScores);
    return scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  })();
  const streak = computeStreak(state.activityLog);
  const longest = longestStreak(state.activityLog);

  const weeklyTarget = state.codewars.weeklyTarget;
  const kataHistory = weekHistory(state.codewars.entries, weeklyTarget, 12);
  const totalKatas = state.codewars.entries.length;
  const weeksHit = weeksOnTarget(state.codewars.entries, weeklyTarget);

  // last 30 days line
  const last30 = (() => {
    const out: { date: string; count: number }[] = [];
    const d = new Date();
    for (let i = 29; i >= 0; i--) {
      const dd = new Date(d); dd.setDate(d.getDate() - i);
      const k = dd.toISOString().slice(0, 10);
      out.push({ date: k.slice(5), count: state.activityLog[k] ?? 0 });
    }
    return out;
  })();

  const monthsBar = MONTHS.map((m) => ({ name: `M${m.id}`, pct: monthProgress(m, state.completedLectures).pct }));

  // Estimated completion date
  const activeDays = Object.values(state.activityLog).filter((v) => v > 0).length || 1;
  const perDay = Math.max(1, doneCount / activeDays);
  const daysLeft = Math.ceil((TOTAL_LECTURES - doneCount) / perDay);
  const eta = new Date(); eta.setDate(eta.getDate() + daysLeft);

  return (
    <Shell>
      <header className="mb-8">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">Insights</div>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">Your <span className="text-gradient">statistics</span></h1>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={CheckCircle2} label="Overall completion" value={`${Math.round(overallPct)}%`} />
        <StatCard icon={BookOpen} label="Lectures" value={`${doneCount}/${TOTAL_LECTURES}`} />
        <StatCard icon={Clock} label="Hours studied" value={Math.round(mins / 60)} hint={`of ${Math.round(TOTAL_MINUTES / 60)}h`} />
        <StatCard icon={Trophy} label="Projects" value={completedProjects} hint={projectAvg ? `avg ${projectAvg}` : "—"} accent="success" />
        <StatCard icon={Star} label="Assessments avg" value={assessmentAvg ? `${assessmentAvg}%` : "—"} />
        <StatCard icon={Flame} label="Current streak" value={`${streak}d`} accent="warning" />
        <StatCard icon={TrendingUp} label="Longest streak" value={`${longest}d`} accent="warning" />
        <StatCard icon={Calendar} label="Est. completion" value={isFinite(daysLeft) ? eta.toLocaleDateString() : "—"} hint={`${daysLeft}d`} />
        <StatCard icon={Swords} label="Total katas" value={totalKatas} hint={`${weeksHit} weeks on target`} accent="warning" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-8">
        <div className="glass rounded-2xl p-5">
          <div className="text-sm font-semibold mb-3">Completion trend — 30 days</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={last30}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                <XAxis dataKey="date" stroke="oklch(0.7 0.02 270)" fontSize={11} />
                <YAxis stroke="oklch(0.7 0.02 270)" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "oklch(0.21 0.022 270)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12 }} />
                <Line dataKey="count" stroke="oklch(0.72 0.18 295)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="text-sm font-semibold mb-3">Months overview</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthsBar}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                <XAxis dataKey="name" stroke="oklch(0.7 0.02 270)" fontSize={11} />
                <YAxis stroke="oklch(0.7 0.02 270)" fontSize={11} />
                <Tooltip contentStyle={{ background: "oklch(0.21 0.022 270)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12 }} />
                <Bar dataKey="pct" fill="oklch(0.72 0.18 295)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-5 mb-4">
        <div className="text-sm font-semibold mb-1">Practice — katas per week</div>
        <div className="text-xs text-muted-foreground mb-4">Last 12 weeks · orange = target hit</div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={kataHistory} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
              <XAxis dataKey="label" stroke="oklch(0.7 0.02 270)" fontSize={10} />
              <YAxis stroke="oklch(0.7 0.02 270)" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "oklch(0.21 0.022 270)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12 }}
                formatter={(v: number) => [`${v} katas`]}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {kataHistory.map((d, i) => (
                  <Cell key={i} fill={d.hitTarget ? "oklch(0.75 0.15 60)" : "oklch(0.45 0.08 270)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-strong rounded-2xl p-6">
        <div className="text-sm font-semibold mb-4">Completed months</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {MONTHS.map((m) => {
            const p = monthProgress(m, state.completedLectures);
            return (
              <div key={m.id} className="rounded-xl border border-border p-3">
                <div className="text-xs text-muted-foreground">Month {m.id}</div>
                <div className="font-semibold text-sm truncate">{m.title}</div>
                <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-primary" style={{ width: `${p.pct}%` }} />
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">{p.pct}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}
