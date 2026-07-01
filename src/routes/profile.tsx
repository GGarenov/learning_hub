import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BookOpen,
  Cloud,
  Flame,
  HardDrive,
  LogIn,
  Settings,
  Swords,
  Trophy,
  User,
} from "lucide-react";
import { Shell } from "@/components/Shell";
import { CircularProgress } from "@/components/CircularProgress";
import { StatCard } from "@/components/StatCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth";
import { MONTHS, TOTAL_LECTURES } from "@/lib/curriculum";
import {
  computeStreak,
  completedMinutes,
  katasThisWeek,
  longestStreak,
  monthProgress,
  isoWeekKey,
  useAppStore,
} from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile" }] }),
  component: ProfilePage,
});

function displayName(email: string | undefined): string {
  if (!email) return "learner";
  const local = email.split("@")[0] ?? email;
  return local
    .split(/[._-]/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");
}

function initials(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatSyncedAt(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return d.toLocaleDateString();
}

function ProfilePage() {
  const { user, syncStatus, lastSyncedAt, loading: authLoading } = useAuth();
  const state = useAppStore();

  const name = user ? displayName(user.email) : "learner";
  const doneCount = Object.keys(state.completedLectures).length;
  const overallPct = (doneCount / TOTAL_LECTURES) * 100;
  const mins = completedMinutes(state.completedLectures);
  const streak = computeStreak(state.activityLog);
  const longest = longestStreak(state.activityLog);
  const completedProjects = Object.values(state.completedProjects).filter(Boolean).length;
  const completedMonths = MONTHS.filter((m) => monthProgress(m, state.completedLectures).pct === 100).length;
  const currentWeek = isoWeekKey(new Date().toISOString());
  const katasWeek = katasThisWeek(state.codewars.entries, currentWeek);
  const weeklyTarget = state.codewars.weeklyTarget;

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

  const pieData = [
    { name: "Completed", value: doneCount },
    { name: "Remaining", value: Math.max(0, TOTAL_LECTURES - doneCount) },
  ];

  const radarData = MONTHS.map((m) => ({
    subject: `M${m.id}`,
    progress: monthProgress(m, state.completedLectures).pct,
  }));

  const monthBars = MONTHS.map((m) => {
    const p = monthProgress(m, state.completedLectures);
    return { id: m.id, title: m.title, ...p };
  });

  return (
    <Shell>
      {/* Hero */}
      <section className="glass-strong rounded-3xl p-6 md:p-10 mb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh opacity-50 pointer-events-none" />
        <div className="relative flex flex-col md:flex-row gap-8 items-start md:items-center">
          <div className="flex items-center gap-5 flex-1 min-w-0">
            <div className="relative shrink-0">
              <div className="absolute -inset-1 rounded-full bg-gradient-primary opacity-60 blur-sm" />
              <Avatar className="size-20 md:size-24 border-2 border-background relative">
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl font-bold">
                  {user ? initials(name) : <User className="size-8" />}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">
                {authLoading ? "Loading…" : user ? "Your profile" : "Guest profile"}
              </div>
              <h1 className="mt-1 text-3xl md:text-4xl font-bold tracking-tight truncate">
                Welcome back, <span className="text-gradient">{name}</span>
              </h1>
              {user ? (
                <p className="mt-2 text-sm text-muted-foreground truncate">{user.email}</p>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  Progress is saved in this browser. Sign in anytime to sync across devices.
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {user ? (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
                      syncStatus === "saved"
                        ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                        : "bg-primary/15 text-primary border border-primary/30",
                    )}
                  >
                    <Cloud className="size-3.5" />
                    {syncStatus === "saved" ? "Cloud synced" : syncStatus}
                    {lastSyncedAt && (
                      <span className="text-muted-foreground">· {formatSyncedAt(lastSyncedAt)}</span>
                    )}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-secondary/80 text-muted-foreground border border-border">
                    <HardDrive className="size-3.5" /> Local only
                  </span>
                )}
                {!user && (
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-gradient-primary text-primary-foreground hover-lift"
                  >
                    <LogIn className="size-3.5" /> Sign in to sync
                  </Link>
                )}
                {user && (
                  <Link
                    to="/settings"
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium glass hover-lift"
                  >
                    <Settings className="size-3.5" /> Account settings
                  </Link>
                )}
              </div>
            </div>
          </div>
          <div className="shrink-0 self-center md:self-auto">
            <CircularProgress
              value={overallPct}
              size={160}
              stroke={12}
              label="Program"
              sublabel={`${doneCount} / ${TOTAL_LECTURES}`}
            />
          </div>
        </div>
      </section>

      {/* Quick stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={BookOpen} label="Lectures done" value={doneCount} hint={`${Math.round(overallPct)}% overall`} />
        <StatCard icon={Flame} label="Current streak" value={`${streak}d`} hint={`best ${longest}d`} accent="warning" />
        <StatCard icon={Trophy} label="Months complete" value={completedMonths} hint={`of ${MONTHS.length}`} accent="success" />
        <StatCard
          icon={Swords}
          label="Katas this week"
          value={`${katasWeek}/${weeklyTarget}`}
          hint={katasWeek >= weeklyTarget ? "Target hit!" : `${weeklyTarget - katasWeek} to go`}
          accent="warning"
        />
      </section>

      {/* Month progress bars */}
      <section className="glass rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-sm font-semibold">Curriculum progress</div>
            <div className="text-xs text-muted-foreground">All 8 months · {Math.round(mins / 60)}h studied</div>
          </div>
        </div>
        <div className="space-y-4">
          {monthBars.map((m) => (
            <Link
              key={m.id}
              to="/month/$id"
              params={{ id: String(m.id) }}
              className="group block rounded-xl border border-transparent hover:border-primary/20 hover:bg-sidebar-accent/40 p-3 -mx-3 transition-all"
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-8 shrink-0 rounded-lg bg-gradient-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {m.id}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {m.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {m.done} / {m.total} lectures
                    </div>
                  </div>
                </div>
                <div className="text-sm font-semibold tabular-nums text-gradient">{m.pct}%</div>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-primary transition-all duration-700 ease-out"
                  style={{ width: `${m.pct}%` }}
                />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Charts */}
      <section className="grid lg:grid-cols-3 gap-4 mb-8">
        <div className="glass rounded-2xl p-5">
          <div className="text-sm font-semibold mb-1">Completion mix</div>
          <div className="text-xs text-muted-foreground mb-4">Lectures done vs left</div>
          <div className="h-52 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius={45} outerRadius={72} stroke="none" paddingAngle={2}>
                  <Cell fill="oklch(0.72 0.18 295)" />
                  <Cell fill="oklch(0.3 0.02 270)" />
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.21 0.022 270)",
                    border: "1px solid oklch(1 0 0 / 0.1)",
                    borderRadius: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-primary" /> {doneCount} done
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-secondary" /> {TOTAL_LECTURES - doneCount} left
            </span>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <div className="text-sm font-semibold mb-1">Activity — last 14 days</div>
          <div className="text-xs text-muted-foreground mb-4">Lectures completed per day</div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last14}>
                <defs>
                  <linearGradient id="profileArea" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.72 0.18 295)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="oklch(0.72 0.18 295)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                <XAxis dataKey="date" stroke="oklch(0.7 0.02 270)" fontSize={11} />
                <YAxis stroke="oklch(0.7 0.02 270)" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.21 0.022 270)",
                    border: "1px solid oklch(1 0 0 / 0.1)",
                    borderRadius: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="oklch(0.72 0.18 295)"
                  fill="url(#profileArea)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 lg:col-span-3">
          <div className="text-sm font-semibold mb-1">Skills radar</div>
          <div className="text-xs text-muted-foreground mb-4">Coverage across each month</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="oklch(1 0 0 / 0.1)" />
                <PolarAngleAxis dataKey="subject" stroke="oklch(0.7 0.02 270)" fontSize={11} />
                <Radar
                  dataKey="progress"
                  stroke="oklch(0.72 0.18 295)"
                  fill="oklch(0.72 0.18 295)"
                  fillOpacity={0.35}
                />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.21 0.022 270)",
                    border: "1px solid oklch(1 0 0 / 0.1)",
                    borderRadius: 12,
                  }}
                  formatter={(v: number) => [`${v}%`, "Progress"]}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 lg:col-span-3">
          <div className="text-sm font-semibold mb-1">Monthly snapshot</div>
          <div className="text-xs text-muted-foreground mb-4">Completion % by month</div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthBars.map((m) => ({ name: `M${m.id}`, pct: m.pct }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                <XAxis dataKey="name" stroke="oklch(0.7 0.02 270)" fontSize={11} />
                <YAxis stroke="oklch(0.7 0.02 270)" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.21 0.022 270)",
                    border: "1px solid oklch(1 0 0 / 0.1)",
                    borderRadius: 12,
                  }}
                  formatter={(v: number) => [`${v}%`, "Complete"]}
                />
                <Bar dataKey="pct" fill="oklch(0.72 0.18 295)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Footer CTA for guests */}
      {!user && (
        <section className="glass-strong rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-mesh opacity-30 pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold">Want your progress everywhere?</div>
              <div className="text-sm text-muted-foreground mt-1">
                Create a free account to back up and sync across phone, laptop, and tablet.
              </div>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover-lift shrink-0"
            >
              <LogIn className="size-4" /> Get started
            </Link>
          </div>
        </section>
      )}

      {user && completedProjects > 0 && (
        <section className="mt-8 glass rounded-2xl p-5 text-center text-sm text-muted-foreground">
          {completedProjects} project{completedProjects !== 1 ? "s" : ""} shipped · keep building, {name.split(" ")[0]}.
        </section>
      )}
    </Shell>
  );
}
