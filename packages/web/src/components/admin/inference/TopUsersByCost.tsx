import { useNavigate } from "react-router";
import { DataTable } from "@/components/admin/ui/DataTable";
import type { InferenceTopUser } from "@/data/admin/inference-types";

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

interface Props {
  data: InferenceTopUser[];
}

export function TopUsersByCost({ data }: Props) {
  const navigate = useNavigate();

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-gray-700">
        Top Users by Token Consumption
      </h3>
      {data.length === 0 ? (
        <p className="text-sm text-gray-400">No user data yet.</p>
      ) : (
        <DataTable
          columns={[
            {
              key: "name",
              header: "User",
              render: (row) => (
                <div>
                  <p className="font-medium text-gray-900">
                    {row.name ?? "Unknown"}
                  </p>
                  {row.email && (
                    <p className="text-xs text-gray-400">{row.email}</p>
                  )}
                </div>
              ),
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
          ]}
          data={data}
          keyExtractor={(row) => row.userId}
          onRowClick={(row) => navigate(`/admin/users/${row.userId}`)}
        />
      )}
    </div>
  );
}
