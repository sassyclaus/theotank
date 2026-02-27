import { DataTable } from "@/components/admin/ui/DataTable";
import { StatusBadge, PriorityBadge, TypeBadge } from "./JobBadges";
import type { JobSummary } from "@/data/admin/job-types";

interface JobsTableProps {
  jobs: JobSummary[];
  onJobClick: (job: JobSummary) => void;
}

function formatAge(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function formatDuration(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt) return "—";
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const ms = end - new Date(startedAt).getTime();
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return remaining > 0 ? `${minutes}m ${remaining}s` : `${minutes}m`;
}

export function JobsTable({ jobs, onJobClick }: JobsTableProps) {
  const columns = [
    {
      key: "type",
      header: "Type",
      render: (row: JobSummary) => <TypeBadge type={row.type} />,
    },
    {
      key: "status",
      header: "Status",
      render: (row: JobSummary) => <StatusBadge status={row.status} />,
    },
    {
      key: "priority",
      header: "Pri.",
      render: (row: JobSummary) => <PriorityBadge priority={row.priority} />,
    },
    {
      key: "attempts",
      header: "Att.",
      render: (row: JobSummary) => (
        <span className="text-gray-600">
          {row.attempts}/{row.maxAttempts}
        </span>
      ),
    },
    {
      key: "result",
      header: "Result",
      className: "max-w-[200px] truncate",
      render: (row: JobSummary) => (
        <span className="text-gray-700" title={row.resultTitle ?? undefined}>
          {row.resultTitle ? `"${row.resultTitle}"` : "—"}
        </span>
      ),
    },
    {
      key: "age",
      header: "Age",
      render: (row: JobSummary) => (
        <span className="text-gray-600">{formatAge(row.createdAt)}</span>
      ),
    },
    {
      key: "duration",
      header: "Dur.",
      render: (row: JobSummary) => (
        <span className="text-gray-600">
          {formatDuration(row.startedAt, row.completedAt)}
          {row.startedAt && !row.completedAt ? "..." : ""}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={jobs}
      onRowClick={onJobClick}
      keyExtractor={(row) => row.id}
    />
  );
}
