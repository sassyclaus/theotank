import { DataTable } from "@/components/admin/ui/DataTable";
import type { InferenceByTool } from "@/data/admin/inference-types";

const TOOL_LABELS: Record<string, string> = {
  ask: "Ask",
  poll: "Poll",
  super_poll: "Super Poll",
  review: "Review",
  research: "Research",
};

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

interface Props {
  data: InferenceByTool[];
}

export function CostByTool({ data }: Props) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-gray-700">Cost by Tool</h3>
      <DataTable
        columns={[
          {
            key: "toolType",
            header: "Tool",
            render: (row) => TOOL_LABELS[row.toolType] ?? row.toolType,
          },
          {
            key: "resultCount",
            header: "Results",
            className: "text-right",
            render: (row) => row.resultCount.toLocaleString(),
          },
          {
            key: "totalTokens",
            header: "Tokens",
            className: "text-right",
            render: (row) => formatTokens(row.totalTokens),
          },
          {
            key: "estimatedCost",
            header: "Est. Cost",
            className: "text-right",
            render: (row) => `$${row.estimatedCost.toFixed(2)}`,
          },
          {
            key: "avgCostPerResult",
            header: "Avg / Result",
            className: "text-right",
            render: (row) => `$${row.avgCostPerResult.toFixed(4)}`,
          },
        ]}
        data={data}
        keyExtractor={(row) => row.toolType}
      />
    </div>
  );
}
