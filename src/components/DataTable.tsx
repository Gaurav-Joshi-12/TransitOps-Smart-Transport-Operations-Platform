import { useMemo, useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  accessor?: (row: T) => string | number;
  className?: string;
  sortable?: boolean;
}

export function DataTable<T extends { id: string }>({
  data, columns, searchKeys, empty, onRowClick, toolbar,
}: {
  data: T[];
  columns: Column<T>[];
  searchKeys?: (keyof T)[];
  empty?: ReactNode;
  onRowClick?: (row: T) => void;
  toolbar?: ReactNode;
}) {
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() => {
    let rows = data;
    if (q && searchKeys?.length) {
      const s = q.toLowerCase();
      rows = rows.filter((r) => searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(s)));
    }
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      if (col?.accessor) {
        rows = [...rows].sort((a, b) => {
          const av = col.accessor!(a); const bv = col.accessor!(b);
          if (av === bv) return 0;
          return (av > bv ? 1 : -1) * (sortDir === "asc" ? 1 : -1);
        });
      }
    }
    return rows;
  }, [data, q, searchKeys, sortKey, sortDir, columns]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {searchKeys?.length ? (
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className="pl-8"
            />
          </div>
        ) : null}
        <div className="ml-auto flex items-center gap-2">{toolbar}</div>
      </div>
      <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border/60 bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  onClick={() => {
                    if (!c.sortable) return;
                    if (sortKey === c.key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                    else { setSortKey(c.key); setSortDir("asc"); }
                  }}
                  className={cn(
                    "px-4 py-3 text-left font-medium",
                    c.sortable && "cursor-pointer select-none hover:text-foreground",
                    c.className,
                  )}
                >
                  {c.header}
                  {sortKey === c.key ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-muted-foreground">
                  {empty ?? "No records"}
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "border-b border-border/40 last:border-0",
                    onRowClick && "cursor-pointer hover:bg-muted/30",
                  )}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={cn("px-4 py-3", c.className)}>
                      {c.render ? c.render(row) : (row as Record<string, ReactNode>)[c.key] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
