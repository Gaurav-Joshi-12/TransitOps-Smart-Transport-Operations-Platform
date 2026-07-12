import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import type { MaintenanceLog } from "@/lib/types";
import { useStore } from "@/lib/store";
import { openMaintenance, closeMaintenance } from "@/services/api";
import { RoleGuard } from "@/components/RoleGuard";
import { DataTable, type Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_auth/maintenance")({
  component: MaintenancePage,
});

function MaintenancePage() {
  const vehicles = useStore((s) => s.vehicles);
  const logs = useStore((s) => s.maintenance);
  const eligible = useMemo(() => vehicles.filter((v) => v.status !== "Retired"), [vehicles]);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ vehicleId: "", description: "", cost: 0 });

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await openMaintenance(form.vehicleId, form.description, form.cost);
      toast.success("Maintenance log opened — vehicle set to In Shop");
      setOpen(false); setForm({ vehicleId: "", description: "", cost: 0 });
    } catch (err) { toast.error((err as Error).message); }
  }

  async function onClose(id: string) {
    try { await closeMaintenance(id); toast.success("Log closed"); }
    catch (err) { toast.error((err as Error).message); }
  }

  const vName = (id: string) => vehicles.find((v) => v.id === id)?.name ?? "—";
  const columns: Column<MaintenanceLog>[] = [
    { key: "vehicle", header: "Vehicle", render: (r) => <span className="font-medium">{vName(r.vehicleId)}</span> },
    { key: "description", header: "Description", render: (r) => <span className="text-sm">{r.description}</span> },
    { key: "cost", header: "Cost", className: "text-right", render: (r) => <span className="tabular-nums font-medium">₹{(r.cost || 0).toLocaleString()}</span> },
    { key: "openedAt", header: "Opened", sortable: true, accessor: (r) => r.openedAt },
    { key: "closedAt", header: "Closed", render: (r) => r.closedAt ?? "—" },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "actions", header: "", className: "text-right",
      render: (r) => r.status === "Open" ? (
        <RoleGuard allow={["FLEET_MANAGER", "SAFETY_OFFICER"]}>
          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onClose(r.id); }}>
            Close log
          </Button>
        </RoleGuard>
      ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable
        data={logs}
        columns={columns}
        searchKeys={["description"]}
        toolbar={
          <RoleGuard allow={["FLEET_MANAGER", "SAFETY_OFFICER"]}>
            <Button size="sm" onClick={() => setOpen(true)}><Plus className="mr-1.5 h-4 w-4" /> Open log</Button>
          </RoleGuard>
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Open maintenance log</DialogTitle></DialogHeader>
          <form onSubmit={onCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Vehicle</Label>
              <Select value={form.vehicleId} onValueChange={(v) => setForm({ ...form, vehicleId: v })}>
                <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>
                  {eligible.map((v) => <SelectItem key={v.id} value={v.id}>{v.name} · {v.status}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Cost (₹)</Label>
              <Input type="number" min={0} value={form.cost} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={!form.vehicleId || !form.description}>Open log</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
