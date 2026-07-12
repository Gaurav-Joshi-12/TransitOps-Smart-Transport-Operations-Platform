import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import type { Vehicle, VehicleStatus } from "@/lib/types";
import { useStore } from "@/lib/store";
import { createVehicle, updateVehicle } from "@/services/api";
import { DataTable, type Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_auth/vehicles")({
  component: VehiclesPage,
});

const empty: Omit<Vehicle, "id"> = {
  regNo: "", name: "", type: "Cargo Van", maxLoadKg: 500, odometer: 0, acquisitionCost: 0, status: "Available",
};

function VehiclesPage() {
  const vehicles = useStore((s) => s.vehicles);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<Omit<Vehicle, "id">>(empty);
  const [regError, setRegError] = useState<string | null>(null);

  function openNew() {
    setEditing(null); setForm(empty); setRegError(null); setOpen(true);
  }
  function openEdit(v: Vehicle) {
    setEditing(v);
    const { id: _id, ...rest } = v;
    setForm(rest); setRegError(null); setOpen(true);
  }

  function validateReg(value: string) {
    const dup = vehicles.some(
      (x) => x.regNo.toLowerCase() === value.toLowerCase() && x.id !== editing?.id,
    );
    setRegError(dup ? "This registration number already exists." : null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (regError) return;
    try {
      if (editing) {
        await updateVehicle(editing.id, form);
        toast.success("Vehicle updated");
      } else {
        await createVehicle(form);
        toast.success("Vehicle added");
      }
      setOpen(false);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  const columns: Column<Vehicle>[] = [
    { key: "regNo", header: "Reg No", sortable: true, accessor: (r) => r.regNo, render: (r) => <span className="font-mono">{r.regNo}</span> },
    { key: "name", header: "Name", sortable: true, accessor: (r) => r.name },
    { key: "type", header: "Type", sortable: true, accessor: (r) => r.type },
    { key: "maxLoadKg", header: "Max Load", className: "text-right", render: (r) => <span className="tabular-nums">{r.maxLoadKg} kg</span> },
    { key: "odometer", header: "Odometer", className: "text-right", sortable: true, accessor: (r) => r.odometer, render: (r) => <span className="tabular-nums">{r.odometer.toLocaleString()} km</span> },
    { key: "acquisitionCost", header: "Acquisition", className: "text-right", render: (r) => <span className="tabular-nums">₹{(r.acquisitionCost / 100000).toFixed(1)}L</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div className="space-y-4">
      <DataTable
        data={vehicles}
        columns={columns}
        searchKeys={["regNo", "name", "type"]}
        onRowClick={openEdit}
        toolbar={
          <Button onClick={openNew} size="sm">
            <Plus className="mr-1.5 h-4 w-4" /> Add vehicle
          </Button>
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit vehicle" : "Add vehicle"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Registration No.</Label>
              <Input
                value={form.regNo}
                onChange={(e) => { setForm({ ...form, regNo: e.target.value }); validateReg(e.target.value); }}
                required
              />
              {regError ? <p className="text-xs text-destructive">{regError}</p> : null}
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as VehicleStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["Available", "On Trip", "In Shop", "Retired"] as VehicleStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Max load (kg)</Label>
              <Input type="number" min={0} value={form.maxLoadKg} onChange={(e) => setForm({ ...form, maxLoadKg: Number(e.target.value) })} required />
            </div>
            <div className="space-y-2">
              <Label>Odometer (km)</Label>
              <Input type="number" min={0} value={form.odometer} onChange={(e) => setForm({ ...form, odometer: Number(e.target.value) })} required />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Acquisition cost (₹)</Label>
              <Input type="number" min={0} value={form.acquisitionCost} onChange={(e) => setForm({ ...form, acquisitionCost: Number(e.target.value) })} required />
            </div>
            <DialogFooter className="col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={!!regError}>{editing ? "Save changes" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
