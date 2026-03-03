import { DataTable } from "@/components/admin/ui/DataTable";
import { Badge } from "@/components/admin/ui/Badge";
import type { AdminUserSummary } from "@/data/admin/user-types";

interface UserTableProps {
  users: AdminUserSummary[];
  onUserClick: (user: AdminUserSummary) => void;
}

const TOOL_ORDER = ["ask", "poll", "super_poll", "review", "research"];
const TOOL_SHORT: Record<string, string> = {
  ask: "Ask",
  poll: "Poll",
  super_poll: "SP",
  review: "Rev",
  research: "Res",
};

export function UserTable({ users, onUserClick }: UserTableProps) {
  const columns = [
    {
      key: "user",
      header: "User",
      render: (row: AdminUserSummary) => (
        <div className="flex items-center gap-2">
          <div>
            <p className="font-medium text-gray-900">{row.name ?? "Unknown"}</p>
            <p className="text-xs text-gray-500">{row.email ?? row.clerkId}</p>
          </div>
          <Badge variant="neutral">{row.tier}</Badge>
        </div>
      ),
    },
    {
      key: "usage",
      header: "Usage (30d)",
      render: (row: AdminUserSummary) => {
        const parts = TOOL_ORDER
          .filter((t) => t in row.usage)
          .map((t) => `${TOOL_SHORT[t]}: ${row.usage[t]}`);
        return (
          <span className="text-xs text-gray-600">
            {parts.length > 0 ? parts.join(" | ") : "—"}
          </span>
        );
      },
    },
    {
      key: "results",
      header: "Results",
      render: (row: AdminUserSummary) => (
        <span className="text-gray-600">{row.resultCount}</span>
      ),
    },
    {
      key: "joined",
      header: "Joined",
      render: (row: AdminUserSummary) => (
        <span className="text-gray-600">
          {new Date(row.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={users}
      onRowClick={onUserClick}
      keyExtractor={(row) => row.id}
    />
  );
}
