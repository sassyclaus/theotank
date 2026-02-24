import { AlertTriangle } from "lucide-react";
import { DataTable } from "@/components/admin/ui/DataTable";
import { Badge } from "@/components/admin/ui/Badge";
import type { AdminUser } from "@/data/admin/mock-users";

interface UserTableProps {
  users: AdminUser[];
  onUserClick: (user: AdminUser) => void;
}

const tierBadgeVariant: Record<AdminUser["tier"], "neutral" | "info" | "warning" | "success"> = {
  free: "neutral",
  base: "info",
  pro: "warning",
  scholar: "success",
};

const statusBadgeVariant: Record<AdminUser["status"], "success" | "danger" | "neutral"> = {
  active: "success",
  suspended: "danger",
  churned: "neutral",
};

export function UserTable({ users, onUserClick }: UserTableProps) {
  const columns = [
    {
      key: "user",
      header: "User",
      render: (row: AdminUser) => (
        <div>
          <p className="font-medium text-gray-900">{row.name}</p>
          <p className="text-xs text-gray-500">{row.email}</p>
        </div>
      ),
    },
    {
      key: "tier",
      header: "Tier",
      render: (row: AdminUser) => (
        <Badge variant={tierBadgeVariant[row.tier]}>
          {row.tier.charAt(0).toUpperCase() + row.tier.slice(1)}
        </Badge>
      ),
    },
    {
      key: "submissions",
      header: "Submissions",
      render: (row: AdminUser) => {
        const atLimit = row.submissionsUsed >= row.submissionsLimit;
        return (
          <span className="inline-flex items-center gap-1.5">
            <span className={atLimit ? "font-medium text-amber-700" : ""}>
              {row.submissionsUsed}/{row.submissionsLimit}
            </span>
            {atLimit && (
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            )}
          </span>
        );
      },
    },
    {
      key: "signupDate",
      header: "Signup",
      render: (row: AdminUser) => (
        <span className="text-gray-600">
          {new Date(row.signupDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row: AdminUser) => (
        <Badge variant={statusBadgeVariant[row.status]}>
          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        </Badge>
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
