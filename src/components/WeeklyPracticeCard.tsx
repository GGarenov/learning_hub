import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Swords, ChevronRight } from "lucide-react";
import { useAppStore, isoWeekKey, katasThisWeek } from "@/lib/store";
import { CodewarsLogDialog } from "./CodewarsLogDialog";

export function WeeklyPracticeCard() {
  const entries = useAppStore((s) => s.codewars.entries);
  const weeklyTarget = useAppStore((s) => s.codewars.weeklyTarget);
  const [dialogOpen, setDialogOpen] = useState(false);

  const currentWeek = isoWeekKey(new Date().toISOString());
  const count = katasThisWeek(entries, currentWeek);
  const pct = Math.min(100, Math.round((count / weeklyTarget) * 100));
  const remaining = Math.max(0, weeklyTarget - count);
  const hitTarget = count >= weeklyTarget;

  return (
    <>
      <div className="glass rounded-2xl p-5 hover-lift relative overflow-hidden">
        <div className="absolute -top-10 -right-10 size-32 rounded-full opacity-10 blur-2xl pointer-events-none bg-orange-500" />
        <div className="flex items-start justify-between gap-3 relative">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="size-7 rounded-md bg-gradient-warm flex items-center justify-center">
                <Swords className="size-3.5 text-primary-foreground" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Weekly practice</span>
            </div>

            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-semibold tracking-tight">{count}</span>
              <span className="text-muted-foreground text-sm">/ {weeklyTarget} katas</span>
            </div>

            <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-gradient-warm transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>

            <p className="mt-2 text-[11px] text-muted-foreground">
              {hitTarget
                ? "Target hit this week 🎉"
                : `${remaining} left this week`}
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setDialogOpen(true)}
            className="flex-1 rounded-lg bg-gradient-warm text-primary-foreground px-3 py-2 text-xs font-semibold hover-lift"
          >
            + Log kata
          </button>
          <Link
            to="/practice"
            className="rounded-lg glass px-3 py-2 text-xs font-semibold flex items-center gap-1 text-muted-foreground hover-lift"
          >
            Open <ChevronRight className="size-3" />
          </Link>
        </div>
      </div>

      <CodewarsLogDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  );
}
