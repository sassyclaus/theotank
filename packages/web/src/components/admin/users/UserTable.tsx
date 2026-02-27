import { DataTable } from "@/components/admin/ui/DataTable";
import type { AdminUserSummary } from "@/data/admin/user-types";

interface UserTableProps {
  users: AdminUserSummary[];
  onUserClick: (user: AdminUserSummary) => void;
}

const CREDIT_TYPE_ORDER = ["ask", "poll", "review", "research"];

export function UserTable({ users, onUserClick }: UserTableProps) {
  const columns = [
    {
      key: "user",
      header: "User",
      render: (row: AdminUserSummary) => (
        <div>
          <p className="font-medium text-gray-900">{row.name ?? "Unknown"}</p>
          <p className="text-xs text-gray-500">{row.email ?? row.clerkId}</p>
        </div>
      ),
    },
    {
      key: "credits",
      header: "Credits",
      render: (row: AdminUserSummary) => {
        const parts = CREDIT_TYPE_ORDER
          .filter((t) => t in row.credits)
          .map((t) => `${t[0].toUpperCase() + t.slice(1)}: ${row.credits[t]}`);
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
