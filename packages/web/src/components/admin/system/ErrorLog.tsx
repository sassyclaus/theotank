import { DataTable } from "@/components/admin/ui/DataTable";
import { Badge } from "@/components/admin/ui/Badge";
import { mockErrorLog } from "@/data/admin/mock-system";
import type { ErrorLogEntry } from "@/data/admin/mock-system";

const statusVariant: Record<
  ErrorLogEntry["status"],
  "danger" | "warning" | "success"
> = {
  new: "danger",
  investigating: "warning",
  resolved: "success",
};

const statusLabel: Record<ErrorLogEntry["status"], string> = {
  new: "New",
  investigating: "Investigating",
  resolved: "Resolved",
};

const columns = [
  {
    key: "timestamp",
    header: "Timestamp",
    className: "whitespace-nowrap",
  },
  { key: "service", header: "Service" },
  {
    key: "error",
    header: "Error",
    className: "max-w-xs truncate",
    render: (row: ErrorLogEntry) => (
      <span className="block max-w-xs truncate" title={row.error}>
        {row.error}
      </span>
    ),
  },
  { key: "userAffected", header: "User Affected" },
  {
    key: "status",
    header: "Status",
    render: (row: ErrorLogEntry) => (
      <Badge variant={statusVariant[row.status]}>
        {statusLabel[row.status]}
      </Badge>
    ),
  },
];

export function ErrorLog() {
  return (
    <div className="rounded-lg border border-admin-border bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-gray-900">Error Log</h3>
      <DataTable
        columns={columns}
        data={mockErrorLog}
        keyExtractor={(row) => row.id}
      />
    </div>
  );
}
