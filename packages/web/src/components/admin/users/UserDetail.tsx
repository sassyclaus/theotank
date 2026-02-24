import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { DataTable } from "@/components/admin/ui/DataTable";
import { Badge } from "@/components/admin/ui/Badge";
import type {
  AdminUser,
  UserSubmission,
  UserActivityEntry,
  AdminNote,
} from "@/data/admin/mock-users";
import {
  mockUserSubmissions,
  mockUserActivity,
  mockAdminNotes,
} from "@/data/admin/mock-users";

interface UserDetailProps {
  user: AdminUser;
}

const tierLabel: Record<AdminUser["tier"], string> = {
  free: "Free",
  base: "Base -- $9/mo",
  pro: "Pro -- $29/mo",
  scholar: "Scholar -- $79/mo",
};

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

const toolBadgeVariant: Record<UserSubmission["tool"], "info" | "warning" | "success" | "neutral"> =
  {
    ask: "info",
    poll: "warning",
    review: "success",
    research: "neutral",
  };

const submissionStatusVariant: Record<
  UserSubmission["status"],
  "success" | "warning" | "danger"
> = {
  complete: "success",
  processing: "warning",
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

export function UserDetail({ user }: UserDetailProps) {
  const submissionColumns = [
    {
      key: "date",
      header: "Date",
      render: (row: UserSubmission) => (
        <span className="text-gray-600">{formatDate(row.date)}</span>
      ),
    },
    {
      key: "tool",
      header: "Tool",
      render: (row: UserSubmission) => (
        <Badge variant={toolBadgeVariant[row.tool]}>
          {row.tool.charAt(0).toUpperCase() + row.tool.slice(1)}
        </Badge>
      ),
    },
    {
      key: "query",
      header: "Query",
      className: "max-w-xs truncate",
      render: (row: UserSubmission) => (
        <span className="text-gray-900" title={row.query}>
          {row.query}
        </span>
      ),
    },
    {
      key: "team",
      header: "Team",
      render: (row: UserSubmission) => (
        <span className="text-gray-600">{row.team}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row: UserSubmission) => (
        <Badge variant={submissionStatusVariant[row.status]}>
          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        </Badge>
      ),
    },
    {
      key: "isPublic",
      header: "Public",
      render: (row: UserSubmission) => (
        <span className="text-gray-500">{row.isPublic ? "Yes" : "No"}</span>
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
            <h1 className="text-xl font-semibold text-gray-900">{user.name}</h1>
            <p className="mt-0.5 text-sm text-gray-500">{user.email}</p>
            <p className="mt-1 text-xs text-gray-400">
              Signed up {formatDate(user.signupDate)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={tierBadgeVariant[user.tier]}>
              {user.tier.charAt(0).toUpperCase() + user.tier.slice(1)}
            </Badge>
            <Badge variant={statusBadgeVariant[user.status]}>
              {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
            </Badge>
          </div>
        </div>
        {user.stripeId && (
          <p className="mt-3 text-xs text-gray-400">
            Stripe: {user.stripeId}
          </p>
        )}
      </div>

      {/* Usage + Account cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Usage stats */}
        <div className="rounded-lg border border-admin-border bg-white p-6">
          <h2 className="text-sm font-medium text-gray-900">Usage</h2>
          <dl className="mt-4 space-y-3">
            <StatRow
              label="Submissions"
              value={`${user.submissionsUsed} / ${user.submissionsLimit}`}
            />
            <StatRow label="Explore Unlocks" value={String(user.exploreUnlocks)} />
            <StatRow label="Research Queries" value={String(user.researchQueries)} />
            <StatRow label="Shared Results" value={String(user.sharedResults)} />
            <StatRow label="Custom Teams" value={String(user.customTeams)} />
            <StatRow label="Last Active" value={formatDate(user.lastActive)} />
          </dl>
        </div>

        {/* Account info */}
        <div className="rounded-lg border border-admin-border bg-white p-6">
          <h2 className="text-sm font-medium text-gray-900">Account</h2>
          <dl className="mt-4 space-y-3">
            <StatRow label="Tier" value={tierLabel[user.tier]} />
            <StatRow label="Billing Cycle" value={user.billingCycle ?? "N/A"} />
            <StatRow label="Payment Status" value={user.paymentStatus ?? "N/A"} />
            <StatRow label="Signup Source" value={user.source} />
          </dl>
        </div>
      </div>

      {/* Submission History */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-gray-900">Submission History</h2>
        <DataTable
          columns={submissionColumns}
          data={mockUserSubmissions}
          keyExtractor={(row: UserSubmission) => row.id}
        />
      </div>

      {/* Activity Log */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-gray-900">Activity Log</h2>
        <div className="rounded-lg border border-admin-border bg-white">
          <ul className="divide-y divide-admin-border">
            {mockUserActivity.map((entry: UserActivityEntry) => (
              <li key={entry.id} className="flex items-start gap-3 px-4 py-3">
                <span className="shrink-0 text-xs text-gray-400">
                  {formatTimestamp(entry.timestamp)}
                </span>
                <span className="text-sm text-gray-700">{entry.action}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Admin Notes */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-gray-900">Admin Notes</h2>
        <div className="space-y-3">
          {mockAdminNotes.map((note: AdminNote) => (
            <div
              key={note.id}
              className="rounded-lg border border-admin-border bg-white p-4"
            >
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="font-medium text-gray-600">{note.author}</span>
                <span>&middot;</span>
                <span>{formatDate(note.date)}</span>
              </div>
              <p className="mt-1.5 text-sm text-gray-700">{note.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-gray-900">{value}</dd>
    </div>
  );
}
