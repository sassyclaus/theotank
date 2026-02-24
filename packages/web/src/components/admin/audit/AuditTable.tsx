import { useState, useMemo } from "react";
import { DataTable } from "@/components/admin/ui/DataTable";
import { Badge } from "@/components/admin/ui/Badge";
import { SearchFilter } from "@/components/admin/ui/SearchFilter";
import { mockAuditLog, type AuditEntry } from "@/data/admin/mock-audit";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "neutral";

const actionCategory: Record<string, BadgeVariant> = {
  "user.tier_change": "info",
  "user.bonus_credits": "info",
  "user.suspend": "danger",
  "content.approve": "success",
  "content.remove": "danger",
  "theologian.bio_update": "neutral",
  "feature_flag.toggle": "warning",
  "team.reorder": "neutral",
  "collection.publish": "success",
  "corpus.status_change": "info",
};

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function renderChanges(entry: AuditEntry): React.ReactNode {
  if (entry.before && entry.after) {
    return (
      <span className="text-xs text-gray-600">
        <span className="text-gray-400">{entry.before}</span>
        <span className="mx-1 text-gray-300">&rarr;</span>
        <span className="font-medium text-gray-700">{entry.after}</span>
      </span>
    );
  }
  if (entry.after) {
    return <span className="text-xs font-medium text-gray-700">{entry.after}</span>;
  }
  return <span className="text-gray-300">&mdash;</span>;
}

export function AuditTable() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return mockAuditLog;
    const q = search.toLowerCase();
    return mockAuditLog.filter(
      (entry) =>
        entry.action.toLowerCase().includes(q) ||
        entry.target.toLowerCase().includes(q) ||
        entry.admin.toLowerCase().includes(q) ||
        (entry.reason?.toLowerCase().includes(q) ?? false),
    );
  }, [search]);

  const columns = [
    {
      key: "timestamp",
      header: "Timestamp",
      render: (row: AuditEntry) => (
        <span className="whitespace-nowrap text-gray-600">
          {formatTimestamp(row.timestamp)}
        </span>
      ),
    },
    {
      key: "admin",
      header: "Admin",
      render: (row: AuditEntry) => (
        <span className="text-gray-700">{row.admin}</span>
      ),
    },
    {
      key: "action",
      header: "Action",
      render: (row: AuditEntry) => (
        <Badge variant={actionCategory[row.action] ?? "default"}>
          <span className="font-mono">{row.action}</span>
        </Badge>
      ),
    },
    {
      key: "target",
      header: "Target",
      render: (row: AuditEntry) => (
        <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">
          {row.target}
        </code>
      ),
    },
    {
      key: "changes",
      header: "Changes",
      render: (row: AuditEntry) => renderChanges(row),
    },
    {
      key: "reason",
      header: "Reason",
      render: (row: AuditEntry) =>
        row.reason ? (
          <span className="text-gray-600">{row.reason}</span>
        ) : (
          <span className="text-gray-300">&mdash;</span>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <SearchFilter
        value={search}
        onChange={setSearch}
        placeholder="Filter by action, target, admin, or reason..."
      />
      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(row) => row.id}
      />
    </div>
  );
}
