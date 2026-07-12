import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

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
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function ExportCSVButton({ filename, rows }: { filename: string; rows: Record<string, unknown>[] }) {
  return (
    <Button variant="outline" size="sm" onClick={() => exportCSV(filename, rows)}>
      <Download className="mr-2 h-4 w-4" /> Export CSV
    </Button>
  );
}
