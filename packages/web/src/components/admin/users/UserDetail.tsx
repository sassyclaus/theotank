import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, X } from "lucide-react";
import { DataTable } from "@/components/admin/ui/DataTable";
import { Badge } from "@/components/admin/ui/Badge";
import {
  useAdminUpdateTier,
  useAdminSetUsageOverride,
  useAdminDeleteUsageOverride,
  useAdminUsageHistory,
} from "@/hooks/useAdminUsers";
import type {
  AdminUserDetail,
  AdminUserResult,
  ToolUsage,
  UsageHistoryEntry,
} from "@/data/admin/user-types";

interface UserDetailProps {
  user: AdminUserDetail;
}

const TOOL_TYPES = ["ask", "poll", "super_poll", "review", "research"];
const TOOL_LABELS: Record<string, string> = {
  ask: "Ask",
  poll: "Poll",
  super_poll: "Super Poll",
  review: "Review",
  research: "Research",
};

const toolBadgeVariant: Record<string, "info" | "warning" | "success" | "neutral"> = {
  ask: "info",
  poll: "warning",
  super_poll: "warning",
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

function UsageLimitRow({
  toolType,
  usage,
  userId,
}: {
  toolType: string;
  usage: ToolUsage;
  userId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [limitValue, setLimitValue] = useState(String(usage.override?.monthlyLimit ?? usage.limit));
  const [reason, setReason] = useState(usage.override?.reason ?? "");
  const setOverride = useAdminSetUsageOverride();
  const deleteOverride = useAdminDeleteUsageOverride();

  const pct = usage.limit > 0 ? Math.round((usage.used / usage.limit) * 100) : 0;
  const barColor =
    pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-terracotta" : "bg-teal";

  function handleSave() {
    const newLimit = parseInt(limitValue, 10);
    if (isNaN(newLimit) || newLimit < 0) return;
    setOverride.mutate(
      {
        id: userId,
        payload: {
          toolType,
          monthlyLimit: newLimit,
          reason: reason || undefined,
        },
      },
      { onSuccess: () => setEditing(false) },
    );
  }

  function handleRemoveOverride() {
    deleteOverride.mutate(
      { id: userId, toolType },
      { onSuccess: () => setEditing(false) },
    );
  }

  return (
    <div className="py-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          {TOOL_LABELS[toolType] ?? toolType}
        </span>
        <div className="flex items-center gap-2">
          <span className={`text-sm ${pct >= 100 ? "font-medium text-red-600" : pct >= 80 ? "text-terracotta" : "text-gray-900"}`}>
            {usage.used} / {usage.limit}
          </span>
          {usage.override && (
            <Badge variant="info">
              Custom: {usage.override.monthlyLimit}/mo
            </Badge>
          )}
          {editing ? null : (
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Override
            </button>
          )}
          {usage.override && !editing && (
            <button
              onClick={handleRemoveOverride}
              className="text-gray-400 hover:text-red-500"
              title="Remove override"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      {/* Progress bar */}
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>

      {/* Inline editor */}
      {editing && (
        <div className="mt-2 flex items-end gap-2">
          <div>
            <label className="text-xs text-gray-500">Monthly limit</label>
            <input
              type="number"
              min={0}
              value={limitValue}
              onChange={(e) => setLimitValue(e.target.value)}
              className="mt-0.5 block w-20 rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500">Reason (optional)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Beta tester"
              className="mt-0.5 block w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={setOverride.isPending}
            className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Save
          </button>
          <button
            onClick={() => setEditing(false)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

function UsageHistorySection({ userId }: { userId: string }) {
  const [filterType, setFilterType] = useState<string | undefined>();
  const { data, isLoading } = useAdminUsageHistory(userId, filterType);
  const entries = data?.entries ?? [];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-900">Usage History</h2>
        <select
          value={filterType ?? ""}
          onChange={(e) => setFilterType(e.target.value || undefined)}
          className="rounded border border-gray-300 px-2 py-1 text-xs"
        >
          <option value="">All types</option>
          {TOOL_TYPES.map((t) => (
            <option key={t} value={t}>
              {TOOL_LABELS[t] ?? t}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading history...</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-gray-500">No usage entries.</p>
      ) : (
        <div className="rounded-lg border border-admin-border bg-white">
          <ul className="divide-y divide-admin-border">
            {entries.map((entry: UsageHistoryEntry) => (
              <li key={entry.id} className="flex items-start gap-3 px-4 py-3">
                <span className="shrink-0 text-xs text-gray-400">
                  {formatTimestamp(entry.createdAt)}
                </span>
                <Badge variant={toolBadgeVariant[entry.toolType] ?? "neutral"}>
                  {TOOL_LABELS[entry.toolType] ?? entry.toolType}
                </Badge>
                <span className="flex-1 truncate text-sm text-gray-700">
                  {entry.resultTitle ?? "—"}
                </span>
                {entry.teamSize && (
                  <span className="text-xs text-gray-400">
                    {entry.teamSize} members
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function UserDetail({ user }: UserDetailProps) {
  const tierMutation = useAdminUpdateTier();
  const [tierValue, setTierValue] = useState(user.tier);

  function handleTierChange(newTier: string) {
    setTierValue(newTier);
    tierMutation.mutate({ id: user.id, payload: { tier: newTier } });
  }

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
          {TOOL_LABELS[row.toolType] ?? row.toolType}
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
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-gray-900">
                {user.name ?? "Unknown User"}
              </h1>
              <Badge variant="neutral">{tierValue}</Badge>
            </div>
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
          <div>
            <label className="text-xs text-gray-500">Tier</label>
            <select
              value={tierValue}
              onChange={(e) => handleTierChange(e.target.value)}
              disabled={tierMutation.isPending}
              className="mt-0.5 block rounded border border-gray-300 px-2 py-1 text-sm"
            >
              <option value="free">Free</option>
              <option value="pro">Pro</option>
            </select>
          </div>
        </div>
      </div>

      {/* Usage & Limits */}
      <div className="rounded-lg border border-admin-border bg-white p-6">
        <h2 className="text-sm font-medium text-gray-900">Usage & Limits</h2>
        <div className="mt-3 divide-y divide-gray-100">
          {TOOL_TYPES.map((type) => (
            <UsageLimitRow
              key={type}
              toolType={type}
              usage={user.usage[type] ?? { used: 0, limit: 0 }}
              userId={user.id}
            />
          ))}
        </div>
      </div>

      {/* Usage History */}
      <UsageHistorySection userId={user.id} />

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
