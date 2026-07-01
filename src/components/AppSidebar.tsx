import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Map,
  BarChart3,
  Settings,
  Trophy,
  Calendar as CalendarIcon,
  ChevronRight,
  Swords,
  LogIn,
  LogOut,
  User,
} from "lucide-react";
import { MONTHS } from "@/lib/curriculum";
import { useAuth } from "@/lib/auth";
import { useAppStore, monthProgress } from "@/lib/store";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const completed = useAppStore((s) => s.completedLectures);
  const { user, signOut, syncStatus } = useAuth();

  const Item = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
    const active = pathname === to;
    return (
      <Link
        to={to}
        className={cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
          active
            ? "bg-gradient-primary text-primary-foreground shadow-glow"
            : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
        )}
      >
        <Icon className="size-4" />
        <span className="font-medium">{label}</span>
      </Link>
    );
  };

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar/60 backdrop-blur-xl">
      <div className="px-6 py-6 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2">
          <div className="size-9 rounded-xl bg-gradient-primary shadow-glow flex items-center justify-center">
            <Trophy className="size-5 text-primary-foreground" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">Roadmap</div>
            <div className="text-[11px] text-muted-foreground">8-Month Curriculum</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div className="space-y-1">
          <Item to="/" icon={LayoutDashboard} label="Dashboard" />
          <Item to="/profile" icon={User} label="Profile" />
          <Item to="/roadmap" icon={Map} label="Roadmap" />
          <Item to="/statistics" icon={BarChart3} label="Statistics" />
          <Item to="/calendar" icon={CalendarIcon} label="Calendar" />
          <Item to="/practice" icon={Swords} label="Practice" />
          <Item to="/achievements" icon={Trophy} label="Achievements" />
          <Item to="/settings" icon={Settings} label="Settings" />
        </div>

        <div>
          <div className="px-3 mb-2 text-[11px] uppercase tracking-wider text-muted-foreground/70 font-semibold">
            Months
          </div>
          <div className="space-y-0.5">
            {MONTHS.map((m) => {
              const p = monthProgress(m, completed);
              const to = `/month/${m.id}`;
              const active = pathname === to;
              return (
                <Link
                  key={m.id}
                  to="/month/$id"
                  params={{ id: String(m.id) }}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                    active
                      ? "bg-sidebar-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60"
                  )}
                >
                  <div className="size-7 rounded-md bg-secondary/80 flex items-center justify-center text-[11px] font-semibold">
                    {m.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-[13px] font-medium">{m.title}</div>
                    <div className="mt-1 h-1 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full bg-gradient-primary transition-all"
                        style={{ width: `${p.pct}%` }}
                      />
                    </div>
                  </div>
                  <ChevronRight className="size-3.5 opacity-0 group-hover:opacity-60 transition" />
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-3">
        {user ? (
          <div className="glass rounded-xl p-3 space-y-2">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Account</div>
            <Link to="/profile" className="block group">
              <div className="text-xs truncate font-medium group-hover:text-primary transition-colors">{user.email}</div>
              <div className="text-[11px] text-muted-foreground capitalize">{syncStatus === "saved" ? "Synced" : syncStatus}</div>
            </Link>
            <button
              type="button"
              onClick={() => signOut().catch(() => undefined)}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <LogOut className="size-3.5" /> Sign out
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="glass rounded-xl p-3 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <LogIn className="size-4" /> Sign in to sync
          </Link>
        )}
        <div className="glass rounded-xl p-3">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Tip</div>
          <div className="text-xs mt-1 leading-relaxed">
            Tick at least one lecture daily to keep your streak alive.
          </div>
        </div>
      </div>
    </aside>
  );
}
