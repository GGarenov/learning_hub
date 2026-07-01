import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { useAppStore, monthProgress, computeStreak, longestStreak, weeksOnTarget } from "@/lib/store";
import { MONTHS, TOTAL_LECTURES } from "@/lib/curriculum";
import { Award, Lock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/achievements")({
  head: () => ({ meta: [{ title: "Achievements" }] }),
  component: AchievementsPage,
});

function AchievementsPage() {
  const state = useAppStore();
  const done = Object.keys(state.completedLectures).length;
  const projects = Object.values(state.completedProjects).filter(Boolean).length;
  const monthsDone = MONTHS.filter((m) => monthProgress(m, state.completedLectures).pct === 100).length;
  const perfectAssessment = Object.values(state.assessmentScores).some((v) => v === 100);
  const streak = computeStreak(state.activityLog);
  const longest = longestStreak(state.activityLog);

  const totalKatas = state.codewars.entries.length;
  const weeklyTarget = state.codewars.weeklyTarget;
  const weeksHit = weeksOnTarget(state.codewars.entries, weeklyTarget);
  const hasKyu6 = state.codewars.entries.some((e) => e.kyu <= 6);
  const month8Active = MONTHS[7] ? monthProgress(MONTHS[7], state.completedLectures).pct > 0 : false;

  const badges = [
    { id: "first", title: "First Lecture", desc: "Complete your first lecture", unlocked: done >= 1 },
    { id: "10", title: "Getting Started", desc: "10 lectures completed", unlocked: done >= 10 },
    { id: "50", title: "Half a Hundred", desc: "50 lectures completed", unlocked: done >= 50 },
    { id: "100", title: "Centurion", desc: "100 lectures completed", unlocked: done >= 100 },
    { id: "month", title: "Month Crusher", desc: "Complete an entire month", unlocked: monthsDone >= 1 },
    { id: "perfect", title: "Perfect Assessment", desc: "Score 100% on an assessment", unlocked: perfectAssessment },
    { id: "project", title: "Project Master", desc: "Complete 3 projects", unlocked: projects >= 3 },
    { id: "streak7", title: "7-Day Streak", desc: "Learn 7 days in a row", unlocked: longest >= 7 },
    { id: "streak30", title: "30-Day Streak", desc: "Learn 30 days in a row", unlocked: longest >= 30 },
    { id: "halfway", title: "Halfway There", desc: "50% of program complete", unlocked: done >= TOTAL_LECTURES / 2 },
    { id: "all", title: "Program Complete", desc: "Finish the entire roadmap", unlocked: done === TOTAL_LECTURES },
    // Codewars badges
    { id: "cw-first", title: "First Blood", desc: "Log your first kata", unlocked: totalKatas >= 1 },
    { id: "cw-week", title: "Week Warrior", desc: `Hit ${weeklyTarget} katas in any single week`, unlocked: weeksHit >= 1 },
    { id: "cw-4weeks", title: "Consistent Coder", desc: "Hit your weekly target 4 times", unlocked: weeksHit >= 4 },
    { id: "cw-100", title: "Century", desc: "Log 100 katas in total", unlocked: totalKatas >= 100 },
    { id: "cw-6kyu", title: "Rank Up", desc: "Solve your first 6 kyu kata", unlocked: hasKyu6 },
    { id: "cw-ready", title: "Interview Ready", desc: "50+ katas logged & Month 8 started", unlocked: totalKatas >= 50 && month8Active },
  ];

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <Shell>
      <header className="mb-8">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">Trophy room</div>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">Your <span className="text-gradient">achievements</span></h1>
        <p className="text-sm text-muted-foreground mt-1">{unlockedCount} / {badges.length} unlocked · Streak: {streak}d (best {longest}d)</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {badges.map((b) => (
          <div key={b.id} className={cn("glass rounded-2xl p-5 text-center hover-lift relative overflow-hidden", b.unlocked && "border-primary/30")}>
            {b.unlocked && <div className="absolute inset-0 bg-gradient-mesh opacity-40 pointer-events-none" />}
            <div className={cn("size-16 mx-auto rounded-2xl flex items-center justify-center", b.unlocked ? "bg-gradient-primary shadow-glow" : "bg-secondary")}>
              {b.unlocked ? <Award className="size-8 text-primary-foreground" /> : <Lock className="size-6 text-muted-foreground" />}
            </div>
            <div className="mt-3 font-semibold">{b.title}</div>
            <div className="text-xs text-muted-foreground mt-1">{b.desc}</div>
            {b.unlocked && <div className="mt-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-primary"><Sparkles className="size-3" /> Unlocked</div>}
          </div>
        ))}
      </div>
    </Shell>
  );
}
