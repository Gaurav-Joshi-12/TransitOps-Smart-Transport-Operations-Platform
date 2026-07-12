import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Truck, Wrench, CheckCircle2, Route as RouteIcon, Users, Activity, TrendingUp,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { KPICard } from "@/components/KPICard";
import { StatusBadge } from "@/components/StatusBadge";
import { Card } from "@/components/ui/card";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/_auth/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const vehicles = useStore((s) => s.vehicles);
  const drivers = useStore((s) => s.drivers);
  const trips = useStore((s) => s.trips);

  const stats = useMemo(() => {
    const activeVehicles = vehicles.filter((v) => v.status !== "Retired").length;
    const available = vehicles.filter((v) => v.status === "Available").length;
    const inShop = vehicles.filter((v) => v.status === "In Shop").length;
    const active = trips.filter((t) => t.status === "Dispatched").length;
    const pending = trips.filter((t) => t.status === "Draft").length;
    const driversOnDuty = drivers.filter((d) => d.status === "On Trip").length;
    const utilization = activeVehicles
      ? Math.round((vehicles.filter((v) => v.status === "On Trip").length / activeVehicles) * 100)
      : 0;
    return { activeVehicles, available, inShop, active, pending, driversOnDuty, utilization };
  }, [vehicles, drivers, trips]);

  const utilData = useMemo(() => {
    return vehicles
      .filter((v) => v.status !== "Retired")
      .map((v) => {
        const vTrips = trips.filter((t) => t.vehicleId === v.id && t.status === "Completed");
        const dist = vTrips.reduce((a, t) => a + t.plannedDistance, 0);
        return { name: v.name, distance: dist, status: v.status };
      });
  }, [vehicles, trips]);

  const recent = [...trips].slice(-6).reverse();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <KPICard label="Active Vehicles" value={stats.activeVehicles} icon={<Truck className="h-4 w-4" />} accent="primary" />
        <KPICard label="Available" value={stats.available} icon={<CheckCircle2 className="h-4 w-4" />} accent="success" />
        <KPICard label="In Maintenance" value={stats.inShop} icon={<Wrench className="h-4 w-4" />} accent="warning" />
        <KPICard label="Active Trips" value={stats.active} icon={<RouteIcon className="h-4 w-4" />} accent="info" />
        <KPICard label="Pending Trips" value={stats.pending} accent="warning" />
        <KPICard label="Drivers On Duty" value={stats.driversOnDuty} icon={<Users className="h-4 w-4" />} accent="info" />
        <KPICard label="Utilization" value={`${stats.utilization}%`} icon={<TrendingUp className="h-4 w-4" />} accent="primary" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="col-span-2 border-border/60 bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Fleet utilization — distance covered</h3>
              <p className="text-xs text-muted-foreground">Completed trip distance per vehicle</p>
            </div>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={utilData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip
                  cursor={{ fill: "var(--accent)" }}
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="distance" radius={[6, 6, 0, 0]}>
                  {utilData.map((d, i) => (
                    <Cell key={i} fill={d.status === "On Trip" ? "var(--chart-2)" : "var(--chart-1)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="border-border/60 bg-card p-5">
          <h3 className="mb-3 text-sm font-semibold">Recent trips</h3>
          <div className="space-y-2">
            {recent.map((t) => {
              const v = vehicles.find((x) => x.id === t.vehicleId);
              return (
                <div key={t.id} className="flex items-center justify-between rounded-md border border-border/40 bg-background/40 px-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium">{t.source} → {t.destination}</div>
                    <div className="text-[11px] text-muted-foreground">{v?.name ?? "—"} · {t.plannedDistance} km</div>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
