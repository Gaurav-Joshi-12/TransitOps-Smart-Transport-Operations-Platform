import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Truck, Users, Route as RouteIcon, Wrench, Fuel, BarChart3, LogOut, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import type { Role } from "@/lib/types";

// Each nav item defines which roles can see it
const allItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["FLEET_MANAGER", "DRIVER", "SAFETY_OFFICER", "FINANCIAL_ANALYST"] as Role[] },
  { to: "/vehicles", label: "Vehicles", icon: Truck, roles: ["FLEET_MANAGER", "DRIVER", "FINANCIAL_ANALYST"] as Role[] },
  { to: "/drivers", label: "Drivers", icon: Users, roles: ["FLEET_MANAGER", "SAFETY_OFFICER"] as Role[] },
  { to: "/trips", label: "Trips", icon: RouteIcon, roles: ["FLEET_MANAGER", "DRIVER", "SAFETY_OFFICER"] as Role[] },
  { to: "/maintenance", label: "Maintenance", icon: Wrench, roles: ["FLEET_MANAGER", "SAFETY_OFFICER"] as Role[] },
  { to: "/expenses", label: "Fuel & Expense", icon: Fuel, roles: ["FLEET_MANAGER", "FINANCIAL_ANALYST"] as Role[] },
  { to: "/reports", label: "Reports", icon: BarChart3, roles: ["FLEET_MANAGER", "FINANCIAL_ANALYST"] as Role[] },
];

const roleLabels: Record<Role, string> = {
  FLEET_MANAGER: "Fleet Manager",
  DRIVER: "Driver",
  SAFETY_OFFICER: "Safety Officer",
  FINANCIAL_ANALYST: "Financial Analyst",
};

const roleColors: Record<Role, string> = {
  FLEET_MANAGER: "text-blue-400",
  DRIVER: "text-green-400",
  SAFETY_OFFICER: "text-amber-400",
  FINANCIAL_ANALYST: "text-purple-400",
};

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const role = user?.role;

  // Filter to only show items the current role can access
  const visibleItems = role
    ? allItems.filter((item) => item.roles.includes(role))
    : allItems;

  function handleLogout() {
    logout();
    navigate({ to: "/login" });
  }

  return (
    <aside className="flex h-screen w-60 flex-shrink-0 flex-col border-r border-border/60 bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-border/60 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Truck className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-semibold leading-tight">TransitOps</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Fleet Control</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {visibleItems.map((it) => {
          const active = pathname === it.to || pathname.startsWith(it.to + "/");
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary/15 text-primary font-medium"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              <Icon className={cn("h-4 w-4 flex-shrink-0", active ? "text-primary" : "text-muted-foreground")} />
              <span className="flex-1">{it.label}</span>
              {active && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </nav>

      {/* User profile at bottom */}
      <div className="border-t border-border/60 p-3 space-y-2">
        {user && (
          <div className="rounded-md bg-sidebar-accent/60 px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                {user.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium leading-tight">{user.name}</div>
                <div className={cn("text-[10px] font-medium uppercase tracking-wider", role ? roleColors[role] : "text-muted-foreground")}>
                  <Shield className="mr-1 inline h-2.5 w-2.5" />
                  {role ? roleLabels[role] : "—"}
                </div>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </aside>
  );
}
