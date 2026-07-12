import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("transitops_token");
}

export function ExportCSVButton({ type }: { type: "vehicles" | "trips" | "fuel" | "expenses" }) {
  async function handleClick() {
    try {
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`http://localhost:8080/api/reports/export/csv?type=${type}`, { headers });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Failed to export ${type} CSV`);
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      let filename = `${type}-export.csv`;
      const match = /filename="?([^";\n]+)"?/.exec(disposition);
      if (match?.[1]) filename = match[1];

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`${type} CSV downloaded`);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  const labels: Record<string, string> = {
    vehicles: "Vehicles",
    trips: "Trips",
    fuel: "Fuel Logs",
    expenses: "Expenses",
  };

  return (
    <Button variant="outline" size="sm" onClick={handleClick}>
      <Download className="mr-1.5 h-4 w-4" /> Export {labels[type] ?? type}
    </Button>
  );
}

export function exportCSV(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [keys.join(","), ...rows.map((r) => keys.map((k) => escape(r[k])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ExportLocalCSVButton({ filename, rows }: { filename: string; rows: Record<string, unknown>[] }) {
  return (
    <Button variant="outline" size="sm" onClick={() => exportCSV(filename, rows)}>
      <Download className="mr-2 h-4 w-4" /> Export CSV
    </Button>
  );
}
