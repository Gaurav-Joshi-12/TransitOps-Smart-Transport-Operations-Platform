import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function KPICard({
  label, value, icon, hint, accent,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  hint?: string;
  accent?: "primary" | "success" | "warning" | "danger" | "info";
}) {
  const accentBar: Record<string, string> = {
    primary: "bg-primary",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-rose-500",
    info: "bg-sky-500",
  };
  return (
    <Card className="relative overflow-hidden border-border/60 bg-card p-4">
      <div className={cn("absolute left-0 top-0 h-full w-1", accentBar[accent ?? "primary"])} />
      <div className="flex items-start justify-between gap-3 pl-2">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
          <div className="mt-1.5 text-2xl font-semibold tabular-nums text-foreground">{value}</div>
          {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
        </div>
        {icon ? <div className="text-muted-foreground">{icon}</div> : null}
      </div>
    </Card>
  );
}
