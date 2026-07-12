import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Send, CheckCircle2, XCircle } from "lucide-react";
import type { Trip, TripStatus } from "@/lib/types";
import { useStore } from "@/lib/store";
import { createTrip, dispatchTrip, completeTrip, cancelTrip } from "@/services/api";
import { DataTable, type Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_auth/trips")({
  component: TripsPage,
});

function TripsPage() {
  const trips = useStore((s) => s.trips);
  const vehicles = useStore((s) => s.vehicles);
  const drivers = useStore((s) => s.drivers);

  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<Trip | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<Trip | null>(null);
  const [completeOpen, setCompleteOpen] = useState<Trip | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const availableVehicles = vehicles.filter((v) => v.status === "Available");
  const availableDrivers = drivers.filter((d) => d.status === "Available" && d.licenseExpiry > today);

  // Create form
  const [form, setForm] = useState({
    source: "", destination: "", vehicleId: "", driverId: "",
    cargoWeightKg: 0, plannedDistance: 0,
  });
  const selectedVeh = vehicles.find((v) => v.id === form.vehicleId);
  const overload = !!(selectedVeh && form.cargoWeightKg > selectedVeh.maxLoadKg);

  function openCreate() {
    setForm({ source: "", destination: "", vehicleId: "", driverId: "", cargoWeightKg: 0, plannedDistance: 0 });
    setCreateOpen(true);
  }
  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (overload) return;
    if (!form.vehicleId || !form.driverId) { toast.error("Select vehicle and driver."); return; }
    try {
      await createTrip(form);
      toast.success("Trip created as Draft");
      setCreateOpen(false);
    } catch (err) { toast.error((err as Error).message); }
  }

  async function doDispatch(t: Trip) {
    try { await dispatchTrip(t.id); toast.success("Trip dispatched"); setDetail(null); }
    catch (err) { toast.error((err as Error).message); }
  }
  async function doCancel(t: Trip) {
    try { await cancelTrip(t.id); toast.success("Trip cancelled"); setConfirmCancel(null); setDetail(null); }
    catch (err) { toast.error((err as Error).message); }
  }

  const [complete, setComplete] = useState({ finalOdometer: 0, fuelConsumed: 0 });
  function openComplete(t: Trip) {
    const v = vehicles.find((x) => x.id === t.vehicleId);
    setComplete({ finalOdometer: (v?.odometer ?? 0) + t.plannedDistance, fuelConsumed: 0 });
    setCompleteOpen(t);
  }
  async function doComplete(e: React.FormEvent) {
    e.preventDefault();
    if (!completeOpen) return;
    try {
      await completeTrip(completeOpen.id, complete.finalOdometer, complete.fuelConsumed);
      toast.success("Trip completed");
      setCompleteOpen(null); setDetail(null);
    } catch (err) { toast.error((err as Error).message); }
  }

  const vName = (id: string) => vehicles.find((v) => v.id === id)?.name ?? "—";
  const dName = (id: string) => drivers.find((d) => d.id === id)?.name ?? "—";

  const columns: Column<Trip>[] = [
    { key: "route", header: "Route", render: (r) => <span className="font-medium">{r.source} → {r.destination}</span> },
    { key: "vehicle", header: "Vehicle", render: (r) => vName(r.vehicleId) },
    { key: "driver", header: "Driver", render: (r) => dName(r.driverId) },
    { key: "cargo", header: "Cargo", className: "text-right", render: (r) => <span className="tabular-nums">{r.cargoWeightKg} kg</span> },
    { key: "distance", header: "Distance", className: "text-right", render: (r) => <span className="tabular-nums">{r.plannedDistance} km</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
  ];

  const byStatus = (s: TripStatus | "All") => s === "All" ? trips : trips.filter((t) => t.status === s);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={openCreate}><Plus className="mr-1.5 h-4 w-4" /> New trip</Button>
      </div>

      <Tabs defaultValue="All">
        <TabsList>
          {(["All", "Draft", "Dispatched", "Completed", "Cancelled"] as const).map((s) => (
            <TabsTrigger key={s} value={s}>
              {s} <span className="ml-1.5 text-xs text-muted-foreground">{byStatus(s).length}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        {(["All", "Draft", "Dispatched", "Completed", "Cancelled"] as const).map((s) => (
          <TabsContent key={s} value={s} className="mt-4">
            <DataTable
              data={byStatus(s)}
              columns={columns}
              searchKeys={["source", "destination"]}
              onRowClick={(t) => setDetail(t)}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Create modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New trip</DialogTitle>
            <DialogDescription>
              Only Available vehicles and drivers with a valid license are shown.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onCreate} className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Source</Label>
              <Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Destination</Label>
              <Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Vehicle</Label>
              <Select value={form.vehicleId} onValueChange={(v) => setForm({ ...form, vehicleId: v })}>
                <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>
                  {availableVehicles.length === 0 ? (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">No available vehicles</div>
                  ) : availableVehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.name} · {v.maxLoadKg}kg</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Driver</Label>
              <Select value={form.driverId} onValueChange={(v) => setForm({ ...form, driverId: v })}>
                <SelectTrigger><SelectValue placeholder="Select driver" /></SelectTrigger>
                <SelectContent>
                  {availableDrivers.length === 0 ? (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">No eligible drivers</div>
                  ) : availableDrivers.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name} · {d.licenseCategory}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cargo weight (kg)</Label>
              <Input
                type="number" min={0}
                value={form.cargoWeightKg}
                onChange={(e) => setForm({ ...form, cargoWeightKg: Number(e.target.value) })}
                required
              />
              {overload ? (
                <p className="text-xs text-destructive">
                  Exceeds vehicle capacity ({selectedVeh?.maxLoadKg} kg).
                </p>
              ) : selectedVeh ? (
                <p className="text-xs text-muted-foreground">Capacity: {selectedVeh.maxLoadKg} kg</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>Planned distance (km)</Label>
              <Input type="number" min={0} value={form.plannedDistance} onChange={(e) => setForm({ ...form, plannedDistance: Number(e.target.value) })} required />
            </div>
            <DialogFooter className="col-span-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={overload}>Create trip</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail modal */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent>
          {detail ? (
            <>
              <DialogHeader>
                <DialogTitle>{detail.source} → {detail.destination}</DialogTitle>
                <DialogDescription>Trip {detail.id}</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <Field label="Status"><StatusBadge status={detail.status} /></Field>
                <Field label="Vehicle">{vName(detail.vehicleId)}</Field>
                <Field label="Driver">{dName(detail.driverId)}</Field>
                <Field label="Cargo">{detail.cargoWeightKg} kg</Field>
                <Field label="Planned distance">{detail.plannedDistance} km</Field>
                {detail.finalOdometer ? <Field label="Final odometer">{detail.finalOdometer.toLocaleString()} km</Field> : null}
                {detail.fuelConsumed ? <Field label="Fuel consumed">{detail.fuelConsumed} L</Field> : null}
              </div>
              <DialogFooter>
                {detail.status === "Draft" && (
                  <Button onClick={() => doDispatch(detail)}>
                    <Send className="mr-1.5 h-4 w-4" /> Dispatch
                  </Button>
                )}
                {detail.status === "Dispatched" && (
                  <>
                    <Button variant="outline" onClick={() => setConfirmCancel(detail)}>
                      <XCircle className="mr-1.5 h-4 w-4" /> Cancel trip
                    </Button>
                    <Button onClick={() => openComplete(detail)}>
                      <CheckCircle2 className="mr-1.5 h-4 w-4" /> Complete
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Complete form */}
      <Dialog open={!!completeOpen} onOpenChange={(o) => !o && setCompleteOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete trip</DialogTitle>
            <DialogDescription>Enter final metrics to close this trip.</DialogDescription>
          </DialogHeader>
          <form onSubmit={doComplete} className="space-y-4">
            <div className="space-y-2">
              <Label>Final odometer (km)</Label>
              <Input type="number" min={0} value={complete.finalOdometer}
                onChange={(e) => setComplete({ ...complete, finalOdometer: Number(e.target.value) })} required />
            </div>
            <div className="space-y-2">
              <Label>Fuel consumed (L)</Label>
              <Input type="number" min={0} step="0.1" value={complete.fuelConsumed}
                onChange={(e) => setComplete({ ...complete, fuelConsumed: Number(e.target.value) })} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCompleteOpen(null)}>Back</Button>
              <Button type="submit">Complete trip</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cancel confirm */}
      <AlertDialog open={!!confirmCancel} onOpenChange={(o) => !o && setConfirmCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this trip?</AlertDialogTitle>
            <AlertDialogDescription>
              The vehicle and driver will be restored to Available.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmCancel && doCancel(confirmCancel)}>
              Cancel trip
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-medium">{children}</div>
    </div>
  );
}
