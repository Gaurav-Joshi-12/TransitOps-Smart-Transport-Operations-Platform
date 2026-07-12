import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { createFuelLog, createExpense } from "@/services/api";
import type { FuelLog, Expense } from "@/lib/types";
import { DataTable, type Column } from "@/components/DataTable";
import { KPICard } from "@/components/KPICard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/_auth/expenses")({
  component: ExpensesPage,
});

const todayStr = () => new Date().toISOString().slice(0, 10);

function ExpensesPage() {
  const vehicles = useStore((s) => s.vehicles);
  const fuel = useStore((s) => s.fuel);
  const expenses = useStore((s) => s.expenses);

  const [fuelOpen, setFuelOpen] = useState(false);
  const [expOpen, setExpOpen] = useState(false);
  const [fuelForm, setFuelForm] = useState({ vehicleId: "", liters: 0, cost: 0, date: todayStr() });
  const [expForm, setExpForm] = useState({ vehicleId: "", type: "Toll", amount: 0, date: todayStr() });

  const vName = (id: string) => vehicles.find((v) => v.id === id)?.name ?? "—";

  const perVehicleCost = useMemo(() => {
    return vehicles.map((v) => {
      const fuelC = fuel.filter((f) => f.vehicleId === v.id).reduce((a, f) => a + f.cost, 0);
      const expC = expenses.filter((e) => e.vehicleId === v.id).reduce((a, e) => a + e.amount, 0);
      return { vehicle: v.name, total: fuelC + expC, fuel: fuelC, other: expC };
    });
  }, [vehicles, fuel, expenses]);

  const totalOps = perVehicleCost.reduce((a, x) => a + x.total, 0);
  const totalFuel = perVehicleCost.reduce((a, x) => a + x.fuel, 0);

  async function submitFuel(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createFuelLog(fuelForm);
      toast.success("Fuel entry added");
      setFuelOpen(false);
      setFuelForm({ vehicleId: "", liters: 0, cost: 0, date: todayStr() });
    } catch (err) { toast.error((err as Error).message); }
  }
  async function submitExp(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createExpense(expForm);
      toast.success("Expense added");
      setExpOpen(false);
      setExpForm({ vehicleId: "", type: "Toll", amount: 0, date: todayStr() });
    } catch (err) { toast.error((err as Error).message); }
  }

  const fuelCols: Column<FuelLog>[] = [
    { key: "date", header: "Date", sortable: true, accessor: (r) => r.date },
    { key: "vehicle", header: "Vehicle", render: (r) => vName(r.vehicleId) },
    { key: "liters", header: "Liters", className: "text-right", render: (r) => <span className="tabular-nums">{r.liters} L</span> },
    { key: "cost", header: "Cost", className: "text-right", render: (r) => <span className="tabular-nums">₹{r.cost.toLocaleString()}</span> },
  ];
  const expCols: Column<Expense>[] = [
    { key: "date", header: "Date", sortable: true, accessor: (r) => r.date },
    { key: "vehicle", header: "Vehicle", render: (r) => vName(r.vehicleId) },
    { key: "type", header: "Type" },
    { key: "amount", header: "Amount", className: "text-right", render: (r) => <span className="tabular-nums">₹{r.amount.toLocaleString()}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <KPICard label="Total ops spend" value={`₹${totalOps.toLocaleString()}`} accent="primary" />
        <KPICard label="Fuel spend" value={`₹${totalFuel.toLocaleString()}`} accent="info" />
        <KPICard label="Other expenses" value={`₹${(totalOps - totalFuel).toLocaleString()}`} accent="warning" />
      </div>

      <Card className="border-border/60 bg-card p-5">
        <h3 className="mb-3 text-sm font-semibold">Operational cost per vehicle</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {perVehicleCost.map((v) => (
            <div key={v.vehicle} className="rounded-md border border-border/40 bg-background/40 p-3">
              <div className="text-sm font-medium">{v.vehicle}</div>
              <div className="mt-1 text-lg font-semibold tabular-nums">₹{v.total.toLocaleString()}</div>
              <div className="mt-1 flex gap-3 text-[11px] text-muted-foreground">
                <span>Fuel ₹{v.fuel.toLocaleString()}</span>
                <span>Other ₹{v.other.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Tabs defaultValue="fuel">
        <TabsList>
          <TabsTrigger value="fuel">Fuel logs</TabsTrigger>
          <TabsTrigger value="exp">Expenses</TabsTrigger>
        </TabsList>
        <TabsContent value="fuel" className="mt-4">
          <DataTable
            data={fuel} columns={fuelCols} searchKeys={[]}
            toolbar={<Button size="sm" onClick={() => setFuelOpen(true)}><Plus className="mr-1.5 h-4 w-4" /> Add fuel</Button>}
          />
        </TabsContent>
        <TabsContent value="exp" className="mt-4">
          <DataTable
            data={expenses} columns={expCols} searchKeys={["type"]}
            toolbar={<Button size="sm" onClick={() => setExpOpen(true)}><Plus className="mr-1.5 h-4 w-4" /> Add expense</Button>}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={fuelOpen} onOpenChange={setFuelOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New fuel entry</DialogTitle></DialogHeader>
          <form onSubmit={submitFuel} className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Vehicle</Label>
              <Select value={fuelForm.vehicleId} onValueChange={(v) => setFuelForm({ ...fuelForm, vehicleId: v })}>
                <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Liters</Label>
              <Input type="number" step="0.1" min={0} value={fuelForm.liters} onChange={(e) => setFuelForm({ ...fuelForm, liters: Number(e.target.value) })} required /></div>
            <div className="space-y-2"><Label>Cost (₹)</Label>
              <Input type="number" min={0} value={fuelForm.cost} onChange={(e) => setFuelForm({ ...fuelForm, cost: Number(e.target.value) })} required /></div>
            <div className="col-span-2 space-y-2"><Label>Date</Label>
              <Input type="date" value={fuelForm.date} onChange={(e) => setFuelForm({ ...fuelForm, date: e.target.value })} required /></div>
            <DialogFooter className="col-span-2">
              <Button type="button" variant="outline" onClick={() => setFuelOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={!fuelForm.vehicleId}>Add</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={expOpen} onOpenChange={setExpOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New expense</DialogTitle></DialogHeader>
          <form onSubmit={submitExp} className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Vehicle</Label>
              <Select value={expForm.vehicleId} onValueChange={(v) => setExpForm({ ...expForm, vehicleId: v })}>
                <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Type</Label>
              <Select value={expForm.type} onValueChange={(v) => setExpForm({ ...expForm, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Toll", "Insurance", "Parts", "Fine", "Other"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Amount (₹)</Label>
              <Input type="number" min={0} value={expForm.amount} onChange={(e) => setExpForm({ ...expForm, amount: Number(e.target.value) })} required /></div>
            <div className="col-span-2 space-y-2"><Label>Date</Label>
              <Input type="date" value={expForm.date} onChange={(e) => setExpForm({ ...expForm, date: e.target.value })} required /></div>
            <DialogFooter className="col-span-2">
              <Button type="button" variant="outline" onClick={() => setExpOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={!expForm.vehicleId}>Add</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
