import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent = "primary",
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  accent?: "primary" | "success" | "warning" | "destructive";
  className?: string;
}) {
  const accentBg = {
    primary: "bg-gradient-primary",
    success: "bg-gradient-success",
    warning: "bg-gradient-warm",
    destructive: "bg-destructive",
  }[accent];
  return (
    <div className={cn("glass rounded-2xl p-5 hover-lift relative overflow-hidden", className)}>
      <div className="absolute -top-10 -right-10 size-32 rounded-full opacity-20 blur-2xl pointer-events-none" style={{ background: "var(--gradient-primary)" }} />
      <div className="flex items-start justify-between gap-3 relative">
        <div>
          <div className="text-xs text-muted-foreground font-medium">{label}</div>
          <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
          {hint && <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>}
        </div>
        <div className={cn("size-10 rounded-xl flex items-center justify-center", accentBg)}>
          <Icon className="size-5 text-primary-foreground" />
        </div>
      </div>
    </div>
  );
}
