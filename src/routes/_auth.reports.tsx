import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";
import { Card } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { DataTable, type Column } from "@/components/DataTable";
import { ExportCSVButton } from "@/components/ExportCSVButton";

export const Route = createFileRoute("/_auth/reports")({
  component: ReportsPage,
});

interface ROIRow {
  id: string;
  vehicle: string;
  revenue: number;
  fuel: number;
  maintenance: number;
  acquisition: number;
  roi: number;
}

function ReportsPage() {
  const vehicles = useStore((s) => s.vehicles);
  const trips = useStore((s) => s.trips);
  const fuel = useStore((s) => s.fuel);
  const expenses = useStore((s) => s.expenses);

  const efficiency = useMemo(() => vehicles
    .filter((v) => v.status !== "Retired")
    .map((v) => {
      const done = trips.filter((t) => t.vehicleId === v.id && t.status === "Completed");
      const dist = done.reduce((a, t) => a + t.plannedDistance, 0);
      const litres = done.reduce((a, t) => a + (t.fuelConsumed ?? 0), 0);
      const kmpl = litres > 0 ? +(dist / litres).toFixed(2) : 0;
      return { name: v.name, kmpl, distance: dist };
    }), [vehicles, trips]);

  const utilization = useMemo(() => vehicles
    .filter((v) => v.status !== "Retired")
    .map((v) => ({
      name: v.name,
      trips: trips.filter((t) => t.vehicleId === v.id && t.status === "Completed").length,
    })), [vehicles, trips]);

  const cost = useMemo(() => vehicles.map((v) => {
    const f = fuel.filter((x) => x.vehicleId === v.id).reduce((a, x) => a + x.cost, 0);
    const e = expenses.filter((x) => x.vehicleId === v.id).reduce((a, x) => a + x.amount, 0);
    return { name: v.name, fuel: f, other: e, total: f + e };
  }), [vehicles, fuel, expenses]);

  const roi: ROIRow[] = useMemo(() => vehicles.map((v) => {
    const doneTrips = trips.filter((t) => t.vehicleId === v.id && t.status === "Completed");
    const revenue = doneTrips.reduce((a, t) => a + t.plannedDistance * 25, 0); // demo: ₹25/km
    const f = fuel.filter((x) => x.vehicleId === v.id).reduce((a, x) => a + x.cost, 0);
    const m = expenses.filter((x) => x.vehicleId === v.id).reduce((a, x) => a + x.amount, 0);
    const roiVal = v.acquisitionCost > 0
      ? +(((revenue - (f + m)) / v.acquisitionCost) * 100).toFixed(2)
      : 0;
    return { id: v.id, vehicle: v.name, revenue, fuel: f, maintenance: m, acquisition: v.acquisitionCost, roi: roiVal };
  }), [vehicles, trips, fuel, expenses]);

  const roiCols: Column<ROIRow>[] = [
    { key: "vehicle", header: "Vehicle", sortable: true, accessor: (r) => r.vehicle },
    { key: "revenue", header: "Revenue", className: "text-right", sortable: true, accessor: (r) => r.revenue, render: (r) => <span className="tabular-nums">₹{r.revenue.toLocaleString()}</span> },
    { key: "fuel", header: "Fuel", className: "text-right", render: (r) => <span className="tabular-nums">₹{r.fuel.toLocaleString()}</span> },
    { key: "maintenance", header: "Other", className: "text-right", render: (r) => <span className="tabular-nums">₹{r.maintenance.toLocaleString()}</span> },
    { key: "acquisition", header: "Acquisition", className: "text-right", render: (r) => <span className="tabular-nums">₹{(r.acquisition / 100000).toFixed(1)}L</span> },
    {
      key: "roi", header: "ROI", className: "text-right", sortable: true, accessor: (r) => r.roi,
      render: (r) => (
        <span className={`font-semibold tabular-nums ${r.roi >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
          {r.roi}%
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Fuel efficiency (km / L)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={efficiency}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="kmpl" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Fleet utilization (completed trips)">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={utilization}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="trips" stroke="var(--chart-2)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Operational cost breakdown" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cost}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Legend />
              <Bar dataKey="fuel" stackId="a" fill="var(--chart-1)" name="Fuel" />
              <Bar dataKey="other" stackId="a" fill="var(--chart-4)" name="Other" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Vehicle ROI</h3>
        </div>
        <DataTable
          data={roi}
          columns={roiCols}
          searchKeys={["vehicle"]}
          toolbar={<ExportCSVButton filename="vehicle-roi.csv" rows={roi as unknown as Record<string, unknown>[]} />}
        />
      </div>
    </div>
  );
}

function ChartCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={`border-border/60 bg-card p-5 ${className ?? ""}`}>
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div className="h-64">{children}</div>
    </Card>
  );
}
