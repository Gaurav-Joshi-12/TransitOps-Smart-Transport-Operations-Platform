import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { Topbar } from "@/components/Topbar";
import { useAuth } from "@/hooks/useAuth";
import {
  getVehicles, getDrivers, getTrips, getMaintenance, getFuelLogs, getExpenses
} from "@/services/api";

export const Route = createFileRoute("/_auth")({
  ssr: false,
  beforeLoad: () => {
    if (typeof window !== "undefined" && !localStorage.getItem("transitops_token")) {
      throw redirect({ to: "/login" });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const fetchedRef = useRef(false);

  // Redirect to login if auth check complete and no user
  useEffect(() => {
    if (ready && !user) {
      navigate({ to: "/login" });
    }
  }, [ready, user, navigate]);

  // Fetch all data once on mount (or when user changes role)
  useEffect(() => {
    if (!user) return;
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const promises: Promise<any>[] = [
      getVehicles(),
      getDrivers(),
      getMaintenance(),
      getFuelLogs(),
      getExpenses(),
    ];

    if (user.role === "DRIVER") {
      promises.push(getTrips({ driverId: user.id }));
    } else {
      promises.push(getTrips());
    }

    Promise.allSettled(promises).then((results) => {
      results.forEach((r) => {
        if (r.status === "rejected") {
          console.error("Data fetch failed:", r.reason);
        }
      });
    });
  }, [user]);

  // Show nothing while auth state is loading (prevents flash of protected content)
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <AppSidebar />
      <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
