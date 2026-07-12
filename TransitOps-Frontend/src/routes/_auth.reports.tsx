import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";
import { Card } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { DataTable, type Column } from "@/components/DataTable";
import { ExportCSVButton, ExportLocalCSVButton } from "@/components/ExportCSVButton";
import { KPICard } from "@/components/KPICard";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { getReportInsights } from "@/services/api";

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
  const maintenance = useStore((s) => s.maintenance);

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
    const m = maintenance.filter((x) => x.vehicleId === v.id).reduce((a, x) => a + x.cost, 0);
    const e = expenses.filter((x) => x.vehicleId === v.id).reduce((a, x) => a + x.amount, 0);
    return { name: v.name, fuel: f, maintenance: m, other: e, total: f + m + e };
  }), [vehicles, fuel, maintenance, expenses]);

  const roi: ROIRow[] = useMemo(() => vehicles.map((v) => {
    const revenue = v.revenue ?? 0;
    const f = fuel.filter((x) => x.vehicleId === v.id).reduce((a, x) => a + x.cost, 0);
    const m = maintenance.filter((x) => x.vehicleId === v.id).reduce((a, x) => a + x.cost, 0);
    const roiVal = v.acquisitionCost > 0
      ? +(((revenue - (f + m)) / v.acquisitionCost) * 100).toFixed(2)
      : 0;
    return { id: v.id, vehicle: v.name, revenue, fuel: f, maintenance: m, acquisition: v.acquisitionCost, roi: roiVal };
  }), [vehicles, fuel, maintenance]);

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
      <AIInsightsCard />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <KPICard label="Total Revenue" value={`₹${vehicles.reduce((a, v) => a + (v.revenue || 0), 0).toLocaleString()}`} accent="success" />
        <KPICard label="Average Fuel Efficiency" value={`${(efficiency.reduce((a, e) => a + e.kmpl, 0) / (efficiency.filter(e => e.kmpl > 0).length || 1)).toFixed(2)} km/L`} accent="primary" />
      </div>

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
              <Bar dataKey="maintenance" stackId="a" fill="var(--chart-2)" name="Maintenance" />
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
          toolbar={<ExportLocalCSVButton filename="vehicle-roi.csv" rows={roi as unknown as Record<string, unknown>[]} />}
        />
      </div>

      <Card className="border-border/60 bg-card p-5">
        <h3 className="mb-3 text-sm font-semibold">Data Export Center</h3>
        <p className="mb-4 text-xs text-muted-foreground">Download full data logs directly from the backend database.</p>
        <div className="flex flex-wrap gap-3">
          <ExportCSVButton type="vehicles" />
          <ExportCSVButton type="trips" />
          <ExportCSVButton type="fuel" />
          <ExportCSVButton type="expenses" />
        </div>
      </Card>
    </div>
  );
}

function ChartCard({ title, children, className, exportType }: { title: string; children: React.ReactNode; className?: string; exportType?: string }) {
  return (
    <Card className="flex flex-col p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        {exportType && <ExportCSVButton type={exportType} />}
      </div>
      <div className="flex-1 min-h-[300px]">
        {children}
      </div>
    </Card>
  );
}

function AIInsightsCard() {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const data = await getReportInsights();
      setInsight(data.insights);
    } catch (err) {
      setInsight("Insights are temporarily unavailable — showing raw data below.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-6 border-indigo-500/30 bg-indigo-500/5 relative overflow-hidden">
      <div className="flex flex-col md:flex-row items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold">
            <Sparkles className="w-5 h-5" />
            <h3>AI Executive Summary</h3>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating insights...
            </div>
          ) : insight ? (
            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{insight}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Generate an AI summary of the current fleet state to identify notable trends and outliers.
            </p>
          )}
        </div>
        {!loading && !insight && (
          <Button onClick={handleGenerate} variant="outline" className="shrink-0 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10">
            Generate Insights
          </Button>
        )}
      </div>
    </Card>
  );
}
