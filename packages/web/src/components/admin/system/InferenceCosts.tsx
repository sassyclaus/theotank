import { ChartPlaceholder } from "@/components/admin/ui/ChartPlaceholder";
import { DataTable } from "@/components/admin/ui/DataTable";
import { mockInferenceCosts } from "@/data/admin/mock-system";
import type { InferenceCost } from "@/data/admin/mock-system";
import { AlertTriangle } from "lucide-react";

const columns = [
  { key: "tool", header: "Tool" },
  {
    key: "totalCost",
    header: "Total Cost",
    className: "text-right",
    render: (row: InferenceCost) =>
      `$${row.totalCost.toLocaleString()}`,
  },
  {
    key: "avgCostPerQuery",
    header: "Avg Cost / Query",
    className: "text-right",
    render: (row: InferenceCost) =>
      `$${row.avgCostPerQuery.toFixed(2)}`,
  },
];

export function InferenceCosts() {
  const { totalSpend, perTool, unitEconomics } = mockInferenceCosts;

  return (
    <div className="rounded-lg border border-admin-border bg-white p-5">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          Inference Costs
        </h3>
        <span className="text-2xl font-semibold text-gray-900">
          {totalSpend}
        </span>
      </div>
      <p className="mt-0.5 text-xs text-gray-500">Total spend this period</p>

      {/* Chart placeholder */}
      <div className="mt-4">
        <ChartPlaceholder label="Daily cost by tool type (30d)" height="h-48" />
      </div>

      {/* Per-tool breakdown */}
      <div className="mt-5">
        <h4 className="mb-2 text-xs font-medium text-gray-500">
          Per-tool breakdown
        </h4>
        <DataTable
          columns={columns}
          data={perTool}
          keyExtractor={(row) => row.tool}
        />
      </div>

      {/* Unit economics */}
      <div className="mt-5">
        <h4 className="mb-3 text-xs font-medium text-gray-500">
          Unit Economics
        </h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Revenue / submission</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {unitEconomics.revenuePerSubmission}
            </p>
          </div>
          <div
            className={`rounded-lg p-3 ${unitEconomics.isNegative ? "bg-red-50" : "bg-gray-50"}`}
          >
            <p className="text-xs text-gray-500">Cost / submission</p>
            <p
              className={`mt-1 text-lg font-semibold ${unitEconomics.isNegative ? "text-red-700" : "text-gray-900"}`}
            >
              {unitEconomics.costPerSubmission}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Margin target</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {unitEconomics.marginTarget}
            </p>
          </div>
        </div>
        {unitEconomics.isNegative && (
          <div className="mt-3 flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>
              Negative margin: cost per submission exceeds revenue. Review
              pricing or optimize prompt costs.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
