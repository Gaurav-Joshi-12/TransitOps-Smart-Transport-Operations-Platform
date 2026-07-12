import { useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";

const titles: Record<string, string> = {
  "/dashboard": "Operations Dashboard",
  "/vehicles": "Vehicle Registry",
  "/drivers": "Driver Management",
  "/trips": "Trip Management",
  "/maintenance": "Maintenance Logs",
  "/expenses": "Fuel & Expenses",
  "/reports": "Reports & Analytics",
};

export function Topbar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const title = titles[pathname] ?? "TransitOps";
  return (
    <header className="flex h-14 items-center justify-between border-b border-border/60 bg-background/80 px-6 backdrop-blur">
      <div>
        <h1 className="text-base font-semibold text-foreground">{title}</h1>
        <p className="text-xs text-muted-foreground">
          Live fleet operations — {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
        </p>
      </div>
      {user ? (
        <div className="flex items-center gap-3">
          <span className="rounded-md border border-border/60 bg-muted/40 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {user.role.replace("_", " ")}
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
            {user.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
          </div>
        </div>
      ) : null}
    </header>
  );
}
