import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Truck, Users, Route as RouteIcon, Wrench, Fuel, BarChart3, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import type { Role } from "@/lib/types";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, highlightFor: ["FLEET_MANAGER"] as Role[] },
  { to: "/vehicles", label: "Vehicles", icon: Truck, highlightFor: ["FLEET_MANAGER"] as Role[] },
  { to: "/drivers", label: "Drivers", icon: Users, highlightFor: ["SAFETY_OFFICER"] as Role[] },
  { to: "/trips", label: "Trips", icon: RouteIcon, highlightFor: ["FLEET_MANAGER", "DRIVER"] as Role[] },
  { to: "/maintenance", label: "Maintenance", icon: Wrench, highlightFor: ["SAFETY_OFFICER"] as Role[] },
  { to: "/expenses", label: "Fuel & Expense", icon: Fuel, highlightFor: ["FINANCIAL_ANALYST"] as Role[] },
  { to: "/reports", label: "Reports", icon: BarChart3, highlightFor: ["FINANCIAL_ANALYST"] as Role[] },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Reorder: highlighted items for the role come to the top
  const role = user?.role;
  const ordered = role
    ? [...items].sort((a, b) => {
        const av = a.highlightFor.includes(role) ? 0 : 1;
        const bv = b.highlightFor.includes(role) ? 0 : 1;
        return av - bv;
      })
    : items;

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border/60 bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-2 border-b border-border/60 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Truck className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-semibold leading-tight">TransitOps</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Fleet Control</div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {ordered.map((it) => {
          const active = pathname === it.to || pathname.startsWith(it.to + "/");
          const highlighted = role ? it.highlightFor.includes(role) : false;
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary/15 text-primary"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
              <span className="flex-1">{it.label}</span>
              {highlighted && !active ? (
                <span className="h-1.5 w-1.5 rounded-full bg-primary" title="Recommended for your role" />
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/60 p-3">
        <div className="mb-2 rounded-md bg-sidebar-accent/60 px-3 py-2">
          <div className="text-sm font-medium">{user?.name ?? "—"}</div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {user?.role.replace("_", " ")}
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate({ to: "/login" }); }}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </aside>
  );
}
