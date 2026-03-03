import { DataTable } from "@/components/admin/ui/DataTable";
import type { InferenceModelBreakdown } from "@/data/admin/inference-types";

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

interface Props {
  data: InferenceModelBreakdown[];
  pricing: Record<string, { input: number; output: number }>;
}

export function ModelUsage({ data, pricing }: Props) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-gray-700">Model Breakdown</h3>
      {data.length === 0 ? (
        <p className="text-sm text-gray-400">No model data yet.</p>
      ) : (
        <DataTable
          columns={[
            {
              key: "model",
              header: "Model",
              render: (row) => (
                <div>
                  <p className="font-medium text-gray-900">{row.model}</p>
                  {pricing[row.model] && (
                    <p className="text-xs text-gray-400">
                      ${pricing[row.model].input}/M in, $
                      {pricing[row.model].output}/M out
                    </p>
                  )}
                </div>
              ),
            },
            {
              key: "calls",
              header: "Calls",
              className: "text-right",
              render: (row) => row.calls.toLocaleString(),
            },
            {
              key: "promptTokens",
              header: "Input Tokens",
              className: "text-right",
              render: (row) => formatTokens(row.promptTokens),
            },
            {
              key: "completionTokens",
              header: "Output Tokens",
              className: "text-right",
              render: (row) => formatTokens(row.completionTokens),
            },
            {
              key: "estimatedCost",
              header: "Est. Cost",
              className: "text-right",
              render: (row) => `$${row.estimatedCost.toFixed(2)}`,
            },
          ]}
          data={data}
          keyExtractor={(row) => row.model}
        />
      )}
    </div>
  );
}
