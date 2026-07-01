import { Menu } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { MONTHS } from "@/lib/curriculum";
import { cn } from "@/lib/utils";

export function MobileTopbar() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const Link2 = ({ to, label }: { to: string; label: string }) => (
    <Link
      to={to}
      onClick={() => setOpen(false)}
      className={cn(
        "block px-3 py-2 rounded-lg text-sm",
        pathname === to ? "bg-gradient-primary text-primary-foreground" : "hover:bg-accent"
      )}
    >
      {label}
    </Link>
  );
  return (
    <div className="md:hidden sticky top-0 z-40 glass-strong border-b border-border">
      <div className="flex items-center justify-between p-3">
        <Link to="/" className="font-semibold text-gradient">Roadmap</Link>
        <button onClick={() => setOpen((v) => !v)} className="p-2 rounded-lg hover:bg-accent">
          <Menu className="size-5" />
        </button>
      </div>
      {open && (
        <div className="px-3 pb-3 space-y-1">
          <Link2 to="/" label="Dashboard" />
          <Link2 to="/roadmap" label="Roadmap" />
          <Link2 to="/statistics" label="Statistics" />
          <Link2 to="/calendar" label="Calendar" />
          <Link2 to="/practice" label="Practice" />
          <Link2 to="/achievements" label="Achievements" />
          <Link2 to="/settings" label="Settings" />
          <div className="pt-2 text-[11px] uppercase text-muted-foreground">Months</div>
          {MONTHS.map((m) => (
            <Link
              key={m.id}
              to="/month/$id"
              params={{ id: String(m.id) }}
              onClick={() => setOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm hover:bg-accent"
            >
              Month {m.id}: {m.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 overflow-y-auto">
      <MobileTopbar />
      <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">{children}</div>
    </div>
  );
}
