import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/Shell";
import { useAppStore, type CalendarKind } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/calendar")({
  head: () => ({ meta: [{ title: "Calendar" }] }),
  component: CalendarPage,
});

const KIND_COLORS: Record<CalendarKind, string> = {
  learning: "bg-primary",
  rest: "bg-muted-foreground",
  project: "bg-chart-3",
  assessment: "bg-warning",
};

function CalendarPage() {
  const calendar = useAppStore((s) => s.calendar);
  const setDay = useAppStore((s) => s.setCalendarDay);
  const log = useAppStore((s) => s.activityLog);
  const [cursor, setCursor] = useState(new Date());

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const kindFor = (d: Date) => calendar[d.toISOString().slice(0, 10)];

  return (
    <Shell>
      <header className="mb-6">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">Planner</div>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">Calendar</h1>
        <p className="mt-1 text-sm text-muted-foreground">Plan learning, rest, project, and assessment days.</p>
      </header>

      <div className="glass-strong rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="p-2 rounded-lg hover:bg-accent"><ChevronLeft className="size-4" /></button>
          <div className="text-lg font-semibold">{cursor.toLocaleString("default", { month: "long", year: "numeric" })}</div>
          <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="p-2 rounded-lg hover:bg-accent"><ChevronRight className="size-4" /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-[11px] text-muted-foreground text-center mb-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const key = d.toISOString().slice(0, 10);
            const kind = kindFor(d);
            const lectures = log[key] ?? 0;
            const isToday = key === new Date().toISOString().slice(0, 10);
            return (
              <CellMenu key={i} date={d} kind={kind} lectures={lectures} isToday={isToday} onSet={(k) => setDay(key, k)} />
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-xs">
          {(Object.keys(KIND_COLORS) as CalendarKind[]).map((k) => (
            <div key={k} className="flex items-center gap-1.5"><div className={cn("size-2.5 rounded-full", KIND_COLORS[k])} /><span className="capitalize">{k}</span></div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

function CellMenu({ date, kind, lectures, isToday, onSet }: { date: Date; kind?: CalendarKind; lectures: number; isToday: boolean; onSet: (k: CalendarKind | null) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full aspect-square rounded-lg border border-border p-1.5 text-left text-xs hover:border-primary/40 transition",
          isToday && "border-primary/70",
          kind && "bg-secondary/50"
        )}
      >
        <div className="font-semibold">{date.getDate()}</div>
        <div className="mt-1 flex items-center gap-1">
          {kind && <div className={cn("size-1.5 rounded-full", KIND_COLORS[kind])} />}
          {lectures > 0 && <div className="text-[9px] text-muted-foreground">{lectures}</div>}
        </div>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 left-0 glass-strong rounded-lg p-2 min-w-[140px] shadow-card">
          {(Object.keys(KIND_COLORS) as CalendarKind[]).map((k) => (
            <button key={k} onClick={() => { onSet(k); setOpen(false); }} className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-accent capitalize">
              <div className={cn("size-2 rounded-full", KIND_COLORS[k])} /> {k}
            </button>
          ))}
          {kind && (
            <button onClick={() => { onSet(null); setOpen(false); }} className="w-full text-xs text-destructive px-2 py-1.5 rounded hover:bg-accent">Clear</button>
          )}
        </div>
      )}
    </div>
  );
}
