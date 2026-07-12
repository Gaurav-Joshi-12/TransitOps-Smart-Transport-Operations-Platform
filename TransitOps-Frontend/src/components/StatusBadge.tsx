import { cn } from "@/lib/utils";

const colorMap: Record<string, string> = {
  // green
  Available: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Closed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  // blue
  "On Trip": "bg-sky-500/15 text-sky-400 border-sky-500/30",
  Dispatched: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  // amber
  "In Shop": "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Open: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  // red
  Suspended: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  Cancelled: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  Retired: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  // gray
  "Off Duty": "bg-slate-500/15 text-slate-400 border-slate-500/30",
  Draft: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const c = colorMap[status] ?? "bg-slate-500/15 text-slate-400 border-slate-500/30";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
        c,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
