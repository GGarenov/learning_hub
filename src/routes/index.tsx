import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Flame,
  Target,
  Trophy,
  Calendar,
  TrendingUp,
  GraduationCap,
  Star,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  BarChart,
  Bar,
} from "recharts";

import { MONTHS, TOTAL_LECTURES, TOTAL_MINUTES } from "@/lib/curriculum";
import { useAppStore, monthProgress, completedMinutes, computeStreak } from "@/lib/store";
import { CircularProgress } from "@/components/CircularProgress";
import { StatCard } from "@/components/StatCard";
import { Shell } from "@/components/Shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Roadmap" },
      { name: "description", content: "Track your 8-month software engineering journey." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const state = useAppStore();
  const completedCount = Object.keys(state.completedLectures).length;
  const overallPct = (completedCount / TOTAL_LECTURES) * 100;
  const mins = completedMinutes(state.completedLectures);
  const hoursDone = Math.round(mins / 60);
  const hoursLeft = Math.max(0, Math.round((TOTAL_MINUTES - mins) / 60));

  const completedProjects = Object.values(state.completedProjects).filter(Boolean).length;
  const completedAssessments = Object.keys(state.assessmentScores).length;
  const avgScore = completedAssessments
    ? Math.round(
        Object.values(state.assessmentScores).reduce((a, b) => a + b, 0) / completedAssessments
      )
    : 0;

  const streak = computeStreak(state.activityLog);

  const completedMonths = MONTHS.filter((m) => monthProgress(m, state.completedLectures).pct === 100).length;
  const currentMonth = MONTHS.find((m) => {
    const p = monthProgress(m, state.completedLectures);
    return p.pct > 0 && p.pct < 100;
  }) ?? MONTHS[completedMonths] ?? MONTHS[0];

  // Projected days remaining: avg per active day = mins / activeDays
  const days = Object.entries(state.activityLog).filter(([, v]) => v > 0).length || 1;
  const lecturesPerDay = Math.max(1, completedCount / days);
  const remainingLectures = TOTAL_LECTURES - completedCount;
  const estimatedDays = Math.ceil(remainingLectures / lecturesPerDay);

  // chart data
  const last14 = (() => {
    const out: { date: string; count: number }[] = [];
    const d = new Date();
    for (let i = 13; i >= 0; i--) {
      const dd = new Date(d);
      dd.setDate(d.getDate() - i);
      const k = dd.toISOString().slice(0, 10);
      out.push({ date: k.slice(5), count: state.activityLog[k] ?? 0 });
    }
    return out;
  })();

  const monthlyData = MONTHS.map((m) => ({
    name: `M${m.id}`,
    pct: monthProgress(m, state.completedLectures).pct,
  }));

  const pieData = [
    { name: "Completed", value: completedCount },
    { name: "Remaining", value: Math.max(0, TOTAL_LECTURES - completedCount) },
  ];

  const radarData = MONTHS.slice(0, 8).map((m) => ({
    subject: m.title.split(" ")[0],
    A: monthProgress(m, state.completedLectures).pct,
  }));

  // Heatmap (last 12 weeks)
  const weeks: { date: string; count: number }[][] = [];
  {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 12 * 7);
    let cur = new Date(start);
    let week: { date: string; count: number }[] = [];
    while (cur <= today) {
      const k = cur.toISOString().slice(0, 10);
      week.push({ date: k, count: state.activityLog[k] ?? 0 });
      if (week.length === 7) { weeks.push(week); week = []; }
      cur.setDate(cur.getDate() + 1);
    }
    if (week.length) weeks.push(week);
  }

  return (
    <Shell>
      {/* Hero */}
      <section className="glass-strong rounded-3xl p-6 md:p-10 mb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh opacity-60 pointer-events-none" />
        <div className="relative grid md:grid-cols-[1fr_auto] gap-8 items-center">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">
              Welcome back
            </div>
            <h1 className="mt-2 text-4xl md:text-5xl font-bold tracking-tight">
              Your <span className="text-gradient">roadmap</span> awaits.
            </h1>
            <p className="mt-3 text-muted-foreground max-w-xl">
              You're on <span className="text-foreground font-medium">Month {currentMonth.id} — {currentMonth.title}</span>.
              Keep stacking small wins.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/month/$id"
                params={{ id: String(currentMonth.id) }}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover-lift"
              >
                <BookOpen className="size-4" /> Continue learning
              </Link>
              <Link
                to="/roadmap"
                className="inline-flex items-center gap-2 rounded-lg glass px-5 py-2.5 text-sm font-semibold hover-lift"
              >
                <Target className="size-4" /> View roadmap
              </Link>
            </div>
          </div>
          <div className="flex justify-center md:justify-end">
            <CircularProgress value={overallPct} size={200} stroke={14} label="Overall" sublabel={`${completedCount} / ${TOTAL_LECTURES} lectures`} />
          </div>
        </div>
      </section>

      {/* Stats grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={CheckCircle2} label="Completed Lectures" value={completedCount} hint={`of ${TOTAL_LECTURES}`} />
        <StatCard icon={BookOpen} label="Remaining Lectures" value={Math.max(0, TOTAL_LECTURES - completedCount)} accent="warning" />
        <StatCard icon={GraduationCap} label="Completed Courses" value={completedMonths} hint="months 100%" accent="success" />
        <StatCard icon={Trophy} label="Projects Done" value={completedProjects} accent="success" />
        <StatCard icon={Star} label="Assessments Passed" value={completedAssessments} hint={avgScore ? `avg ${avgScore}%` : "—"} />
        <StatCard icon={Flame} label="Current Streak" value={`${streak}d`} accent="warning" />
        <StatCard icon={Clock} label="Hours Completed" value={hoursDone} hint={`${hoursLeft}h left`} />
        <StatCard icon={Calendar} label="Days Remaining" value={isFinite(estimatedDays) ? estimatedDays : "—"} hint="est." accent="primary" />
      </section>

      {/* Charts */}
      <section className="grid lg:grid-cols-3 gap-4 mb-8">
        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold">Last 14 days</div>
              <div className="text-xs text-muted-foreground">Lectures completed per day</div>
            </div>
            <TrendingUp className="size-4 text-muted-foreground" />
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last14}>
                <defs>
                  <linearGradient id="ga" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.72 0.18 295)" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="oklch(0.72 0.18 295)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                <XAxis dataKey="date" stroke="oklch(0.7 0.02 270)" fontSize={11} />
                <YAxis stroke="oklch(0.7 0.02 270)" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "oklch(0.21 0.022 270)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12 }} />
                <Area type="monotone" dataKey="count" stroke="oklch(0.72 0.18 295)" fill="url(#ga)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="text-sm font-semibold mb-1">Completion mix</div>
          <div className="text-xs text-muted-foreground mb-4">Completed vs remaining</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius={50} outerRadius={80} stroke="none">
                  <Cell fill="oklch(0.72 0.18 295)" />
                  <Cell fill="oklch(0.3 0.02 270)" />
                </Pie>
                <Tooltip contentStyle={{ background: "oklch(0.21 0.022 270)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="text-sm font-semibold mb-1">Monthly progress</div>
          <div className="text-xs text-muted-foreground mb-4">% per month</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                <XAxis dataKey="name" stroke="oklch(0.7 0.02 270)" fontSize={11} />
                <YAxis stroke="oklch(0.7 0.02 270)" fontSize={11} />
                <Tooltip contentStyle={{ background: "oklch(0.21 0.022 270)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12 }} />
                <Bar dataKey="pct" fill="oklch(0.72 0.18 295)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <div className="text-sm font-semibold mb-1">Skill radar</div>
          <div className="text-xs text-muted-foreground mb-4">Coverage across each month</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="oklch(1 0 0 / 0.1)" />
                <PolarAngleAxis dataKey="subject" stroke="oklch(0.7 0.02 270)" fontSize={11} />
                <Radar dataKey="A" stroke="oklch(0.72 0.18 295)" fill="oklch(0.72 0.18 295)" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Heatmap */}
      <section className="glass rounded-2xl p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-semibold">Consistency heatmap</div>
            <div className="text-xs text-muted-foreground">Last 12 weeks</div>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-2">
          {weeks.map((w, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {w.map((d) => {
                const level = d.count === 0 ? 0 : d.count < 2 ? 1 : d.count < 4 ? 2 : d.count < 7 ? 3 : 4;
                const bg = ["bg-secondary/60", "bg-primary/20", "bg-primary/40", "bg-primary/70", "bg-gradient-primary"][level];
                return <div key={d.date} title={`${d.date}: ${d.count}`} className={`size-3.5 rounded-sm ${bg}`} />;
              })}
            </div>
          ))}
        </div>
      </section>

      {/* Motivation */}
      <section className="glass-strong rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh opacity-40 pointer-events-none" />
        <div className="relative flex items-start gap-4">
          <div className="size-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Flame className="size-6 text-primary-foreground" />
          </div>
          <div>
            <div className="text-sm font-semibold">Today's goal</div>
            <div className="text-muted-foreground text-sm mt-1">
              {remainingLectures > 0
                ? `Only ${remainingLectures} lectures left. You're ${Math.round(overallPct)}% through the entire program.`
                : "🎉 You completed the program. Take a moment to be proud."}
            </div>
          </div>
        </div>
      </section>
    </Shell>
  );
}
