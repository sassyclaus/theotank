import { DataTable } from "@/components/admin/ui/DataTable";
import { Badge } from "@/components/admin/ui/Badge";
import type { InferenceResultFeedItem } from "@/data/admin/inference-types";

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

const statusVariant: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  completed: "success",
  processing: "info",
  pending: "warning",
  failed: "danger",
};

const columns = [
  {
    key: "title",
    header: "Title",
    className: "max-w-[240px]",
    render: (row: InferenceResultFeedItem) => (
      <span className="block truncate font-medium text-gray-900" title={row.title}>
        {row.title}
      </span>
    ),
  },
  {
    key: "toolType",
    header: "Tool",
    render: (row: InferenceResultFeedItem) => (
      <Badge variant="info">{row.toolType}</Badge>
    ),
  },
  {
    key: "user",
    header: "User",
    render: (row: InferenceResultFeedItem) => (
      <div className="min-w-0">
        <div className="truncate text-sm text-gray-900">{row.userName ?? "—"}</div>
        {row.userEmail && (
          <div className="truncate text-xs text-gray-500">{row.userEmail}</div>
        )}
      </div>
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (row: InferenceResultFeedItem) => (
      <Badge variant={statusVariant[row.status] ?? "neutral"}>{row.status}</Badge>
    ),
  },
  {
    key: "inferenceCalls",
    header: "Calls",
    className: "text-right",
    render: (row: InferenceResultFeedItem) => (
      <span className="tabular-nums">{row.inferenceCalls.toLocaleString()}</span>
    ),
  },
  {
    key: "totalTokens",
    header: "Tokens",
    className: "text-right",
    render: (row: InferenceResultFeedItem) => (
      <span className="tabular-nums">{formatTokens(row.totalTokens)}</span>
    ),
  },
  {
    key: "estimatedCost",
    header: "Est. Cost",
    className: "text-right",
    render: (row: InferenceResultFeedItem) => (
      <span className="tabular-nums font-medium">${row.estimatedCost.toFixed(2)}</span>
    ),
  },
  {
    key: "createdAt",
    header: "Created",
    render: (row: InferenceResultFeedItem) => (
      <span className="whitespace-nowrap text-gray-500">
        {new Date(row.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </span>
    ),
  },
];

interface ResultsFeedTableProps {
  data: InferenceResultFeedItem[];
}

export function ResultsFeedTable({ data }: ResultsFeedTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      keyExtractor={(row) => row.resultId}
    />
  );
}
