import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Truck, Wrench, CheckCircle2, Route as RouteIcon, Users, Activity, TrendingUp, Filter, X,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { KPICard } from "@/components/KPICard";
import { StatusBadge } from "@/components/StatusBadge";
import { Card } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { getDashboardKpis } from "@/services/api";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_auth/dashboard")({
  component: DashboardPage,
});

interface KpiState {
  activeVehicles: number;
  availableVehicles: number;
  vehiclesInMaintenance: number;
  activeTrips: number;
  pendingTrips: number;
  driversOnDuty: number;
  fleetUtilizationPercent: number;
}

const defaultKpis: KpiState = {
  activeVehicles: 0,
  availableVehicles: 0,
  vehiclesInMaintenance: 0,
  activeTrips: 0,
  pendingTrips: 0,
  driversOnDuty: 0,
  fleetUtilizationPercent: 0,
};

function DashboardPage() {
  const vehicles = useStore((s) => s.vehicles);
  const trips = useStore((s) => s.trips);

  const [filters, setFilters] = useState({ type: "all", status: "all", region: "all" });
  const [kpis, setKpis] = useState<KpiState>(defaultKpis);
  const [kpiLoading, setKpiLoading] = useState(true);

  const fetchKpis = () => {
    const apiParams = {
      type: filters.type === "all" ? "" : filters.type,
      status: filters.status === "all" ? "" : filters.status,
      region: filters.region === "all" ? "" : filters.region,
    };
    setKpiLoading(true);
    getDashboardKpis(apiParams)
      .then((data) => {
        if (data) setKpis(data);
      })
      .catch(console.error)
      .finally(() => setKpiLoading(false));
  };

  // Re-fetch KPIs when filters or store data changes
  useEffect(() => {
    fetchKpis();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, vehicles.length, trips.length]);

  // Chart data — filtered by same filter criteria using JS string compare (not Java's equalsIgnoreCase)
  const utilData = useMemo(() => {
    return vehicles
      .filter((v) => v.status !== "Retired")
      .filter((v) => filters.type === "all" || v.type.toLowerCase() === filters.type.toLowerCase())
      .filter((v) => filters.status === "all" || v.status === filters.status)
      .filter((v) => {
        if (filters.region === "all") return true;
        const vRegion = (v as any).region as string | undefined;
        return vRegion ? vRegion.toLowerCase() === filters.region.toLowerCase() : false;
      })
      .map((v) => {
        const vTrips = trips.filter((t) => t.vehicleId === v.id && t.status === "Completed");
        const dist = vTrips.reduce((a, t) => a + (t.plannedDistance || 0), 0);
        return { name: v.name, distance: dist, status: v.status };
      });
  }, [vehicles, trips, filters]);

  const recent = [...trips].slice(-6).reverse();

  // Extract unique types and regions for filters
  const uniqueTypes = useMemo(() => Array.from(new Set(vehicles.map((v) => v.type).filter(Boolean))), [vehicles]);
  const uniqueRegions = useMemo(() => {
    return Array.from(new Set(vehicles.map((v) => (v as any).region as string | undefined).filter(Boolean))) as string[];
  }, [vehicles]);

  const hasFilters = filters.type !== "all" || filters.status !== "all" || filters.region !== "all";

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <Card className="border-border/60 bg-card/60 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>Filter by:</span>
          </div>

          <div className="w-40">
            <Select value={filters.type} onValueChange={(v) => setFilters({ ...filters, type: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {uniqueTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="w-40">
            <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Available">Available</SelectItem>
                <SelectItem value="On Trip">On Trip</SelectItem>
                <SelectItem value="In Shop">In Shop</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-40">
            <Select value={filters.region} onValueChange={(v) => setFilters({ ...filters, region: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Regions" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {uniqueRegions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters({ type: "all", status: "all", region: "all" })}
              className="h-8 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" /> Clear
            </Button>
          )}
        </div>
      </Card>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <KPICard label="Active Vehicles" value={kpiLoading ? "—" : kpis.activeVehicles} icon={<Truck className="h-4 w-4" />} accent="primary" />
        <KPICard label="Available" value={kpiLoading ? "—" : kpis.availableVehicles} icon={<CheckCircle2 className="h-4 w-4" />} accent="success" />
        <KPICard label="In Maintenance" value={kpiLoading ? "—" : kpis.vehiclesInMaintenance} icon={<Wrench className="h-4 w-4" />} accent="warning" />
        <KPICard label="Active Trips" value={kpiLoading ? "—" : kpis.activeTrips} icon={<RouteIcon className="h-4 w-4" />} accent="info" />
        <KPICard label="Pending Trips" value={kpiLoading ? "—" : kpis.pendingTrips} icon={<RouteIcon className="h-4 w-4" />} accent="warning" />
        <KPICard label="Drivers On Duty" value={kpiLoading ? "—" : kpis.driversOnDuty} icon={<Users className="h-4 w-4" />} accent="info" />
        <KPICard label="Fleet Utilization" value={kpiLoading ? "—" : `${Math.round(kpis.fleetUtilizationPercent)}%`} icon={<TrendingUp className="h-4 w-4" />} accent="primary" />
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
            {utilData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No vehicles match filters</div>
            ) : (
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
            )}
          </div>
        </Card>

        <Card className="border-border/60 bg-card p-5">
          <h3 className="mb-3 text-sm font-semibold">Recent trips</h3>
          <div className="space-y-2">
            {recent.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No trips yet</p>
            ) : recent.map((t) => {
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
