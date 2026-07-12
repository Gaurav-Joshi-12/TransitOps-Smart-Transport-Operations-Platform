import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, AlertTriangle } from "lucide-react";
import type { Driver, DriverStatus } from "@/lib/types";
import { useStore } from "@/lib/store";
import { createDriver, updateDriver } from "@/services/api";
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
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_auth/drivers")({
  component: DriversPage,
});

const empty: Omit<Driver, "id"> = {
  name: "", licenseNo: "", licenseCategory: "LMV",
  licenseExpiry: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
  contact: "", safetyScore: 80, status: "Available",
};

function DriversPage() {
  const drivers = useStore((s) => s.drivers);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [form, setForm] = useState<Omit<Driver, "id">>(empty);

  function openNew() { setEditing(null); setForm(empty); setOpen(true); }
  function openEdit(d: Driver) {
    setEditing(d);
    const { id: _id, ...rest } = d; setForm(rest); setOpen(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editing) { await updateDriver(editing.id, form); toast.success("Driver updated"); }
      else { await createDriver(form); toast.success("Driver added"); }
      setOpen(false);
    } catch (err) { toast.error((err as Error).message); }
  }

  const today = new Date().toISOString().slice(0, 10);
  const soon = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  const columns: Column<Driver>[] = [
    { key: "name", header: "Name", sortable: true, accessor: (r) => r.name },
    { key: "licenseNo", header: "License", render: (r) => <span className="font-mono text-xs">{r.licenseNo}</span> },
    { key: "licenseCategory", header: "Cat.", accessor: (r) => r.licenseCategory },
    {
      key: "licenseExpiry", header: "Expiry", sortable: true, accessor: (r) => r.licenseExpiry,
      render: (r) => {
        const expired = r.licenseExpiry < today;
        const nearing = !expired && r.licenseExpiry < soon;
        return (
          <span className={cn(
            "inline-flex items-center gap-1 tabular-nums",
            expired && "text-rose-400 font-medium",
            nearing && "text-amber-400",
          )}>
            {(expired || nearing) && <AlertTriangle className="h-3 w-3" />}
            {r.licenseExpiry}
          </span>
        );
      },
    },
    { key: "contact", header: "Contact", render: (r) => <span className="text-xs">{r.contact}</span> },
    {
      key: "safetyScore", header: "Safety", className: "text-right", sortable: true, accessor: (r) => r.safetyScore,
      render: (r) => (
        <span className={cn(
          "tabular-nums font-medium",
          r.safetyScore >= 85 ? "text-emerald-400" : r.safetyScore >= 70 ? "text-amber-400" : "text-rose-400",
        )}>{r.safetyScore}</span>
      ),
    },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div className="space-y-4">
      <DataTable
        data={drivers}
        columns={columns}
        searchKeys={["name", "licenseNo"]}
        onRowClick={openEdit}
        toolbar={<Button size="sm" onClick={openNew}><Plus className="mr-1.5 h-4 w-4" /> Add driver</Button>}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit driver" : "Add driver"}</DialogTitle></DialogHeader>
          <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Full name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>License No.</Label>
              <Input value={form.licenseNo} onChange={(e) => setForm({ ...form, licenseNo: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.licenseCategory} onValueChange={(v) => setForm({ ...form, licenseCategory: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["LMV", "HMV", "MCWG"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>License expiry</Label>
              <Input type="date" value={form.licenseExpiry} onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Contact</Label>
              <Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Safety score</Label>
              <Input type="number" min={0} max={100} value={form.safetyScore} onChange={(e) => setForm({ ...form, safetyScore: Number(e.target.value) })} required />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as DriverStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["Available", "On Trip", "Off Duty", "Suspended"] as DriverStatus[]).map((s) =>
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">{editing ? "Save changes" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
