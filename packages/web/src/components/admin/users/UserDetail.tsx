import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { DataTable } from "@/components/admin/ui/DataTable";
import { Badge } from "@/components/admin/ui/Badge";
import { useAdminUpdateCredits, useAdminUserLedger } from "@/hooks/useAdminUsers";
import type { AdminUserDetail, AdminUserResult, CreditLedgerEntry } from "@/data/admin/user-types";

interface UserDetailProps {
  user: AdminUserDetail;
}

const CREDIT_TYPES = ["ask", "poll", "review", "research"];

const toolBadgeVariant: Record<string, "info" | "warning" | "success" | "neutral"> = {
  ask: "info",
  poll: "warning",
  review: "success",
  research: "neutral",
};

const statusBadgeVariant: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  completed: "success",
  processing: "warning",
  pending: "neutral",
  failed: "danger",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimestamp(ts: string) {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const reasonLabels: Record<string, string> = {
  initial_grant: "Initial grant",
  result_created: "Result created",
  admin_adjustment: "Admin adjustment",
  retry_refund: "Retry refund",
};

function CreditRow({
  creditType,
  balance,
  userId,
}: {
  creditType: string;
  balance: number;
  userId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(balance));
  const mutation = useAdminUpdateCredits();

  function handleSave() {
    const newBalance = parseInt(value, 10);
    if (isNaN(newBalance) || newBalance < 0) return;
    mutation.mutate(
      { id: userId, payload: { creditType, balance: newBalance } },
      { onSuccess: () => setEditing(false) },
    );
  }

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-700 capitalize">{creditType}</span>
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
          />
          <button
            onClick={handleSave}
            disabled={mutation.isPending}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
          >
            Save
          </button>
          <button
            onClick={() => {
              setEditing(false);
              setValue(String(balance));
            }}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{balance}</span>
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
}

function LedgerSection({ userId }: { userId: string }) {
  const [filterType, setFilterType] = useState<string | undefined>();
  const { data, isLoading } = useAdminUserLedger(userId, filterType);
  const entries = data?.entries ?? [];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-900">Credit Ledger</h2>
        <select
          value={filterType ?? ""}
          onChange={(e) => setFilterType(e.target.value || undefined)}
          className="rounded border border-gray-300 px-2 py-1 text-xs"
        >
          <option value="">All types</option>
          {CREDIT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading ledger...</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-gray-500">No ledger entries.</p>
      ) : (
        <div className="rounded-lg border border-admin-border bg-white">
          <ul className="divide-y divide-admin-border">
            {entries.map((entry: CreditLedgerEntry) => (
              <li key={entry.id} className="flex items-start gap-3 px-4 py-3">
                <span className="shrink-0 text-xs text-gray-400">
                  {formatTimestamp(entry.createdAt)}
                </span>
                <span className="text-sm text-gray-700">
                  <span className="capitalize">{entry.creditType}</span>
                  {" "}
                  <span
                    className={
                      entry.delta > 0
                        ? "font-medium text-green-600"
                        : "font-medium text-red-600"
                    }
                  >
                    {entry.delta > 0 ? "+" : ""}
                    {entry.delta}
                  </span>
                  {" "}
                  <span className="text-gray-400">
                    (bal: {entry.balanceAfter})
                  </span>
                </span>
                <span className="ml-auto text-xs text-gray-400">
                  {reasonLabels[entry.reason] ?? entry.reason}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function UserDetail({ user }: UserDetailProps) {
  const resultColumns = [
    {
      key: "date",
      header: "Date",
      render: (row: AdminUserResult) => (
        <span className="text-gray-600">{formatDate(row.createdAt)}</span>
      ),
    },
    {
      key: "tool",
      header: "Tool",
      render: (row: AdminUserResult) => (
        <Badge variant={toolBadgeVariant[row.toolType] ?? "neutral"}>
          {row.toolType.charAt(0).toUpperCase() + row.toolType.slice(1)}
        </Badge>
      ),
    },
    {
      key: "title",
      header: "Title",
      className: "max-w-xs truncate",
      render: (row: AdminUserResult) => (
        <span className="text-gray-900" title={row.title}>
          {row.title}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row: AdminUserResult) => (
        <Badge variant={statusBadgeVariant[row.status] ?? "neutral"}>
          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        to="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Users
      </Link>

      {/* User header */}
      <div className="rounded-lg border border-admin-border bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {user.name ?? "Unknown User"}
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              {user.email ?? "No email"}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Clerk ID: {user.clerkId}
            </p>
            <p className="mt-0.5 text-xs text-gray-400">
              Joined {formatDate(user.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Credit Balances */}
      <div className="rounded-lg border border-admin-border bg-white p-6">
        <h2 className="text-sm font-medium text-gray-900">Credit Balances</h2>
        <div className="mt-3 divide-y divide-gray-100">
          {CREDIT_TYPES.map((type) => (
            <CreditRow
              key={type}
              creditType={type}
              balance={user.credits[type] ?? 0}
              userId={user.id}
            />
          ))}
        </div>
      </div>

      {/* Credit Ledger */}
      <LedgerSection userId={user.id} />

      {/* Result History */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-gray-900">
          Result History ({user.results.length})
        </h2>
        {user.results.length > 0 ? (
          <DataTable
            columns={resultColumns}
            data={user.results}
            keyExtractor={(row: AdminUserResult) => row.id}
          />
        ) : (
          <p className="text-sm text-gray-500">No results yet.</p>
        )}
      </div>
    </div>
  );
}
