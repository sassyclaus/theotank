import { StatCard } from "@/components/admin/ui/StatCard";
import type { InferenceOverview } from "@/data/admin/inference-types";

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

interface Props {
  overview: InferenceOverview;
}

export function InferenceOverviewCards({ overview }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Est. Total Spend"
        value={`$${overview.totalEstimatedCost.toFixed(2)}`}
      />
      <StatCard
        label="Avg Cost / Result"
        value={`$${overview.avgCostPerResult.toFixed(4)}`}
      />
      <StatCard
        label="Total Tokens"
        value={formatTokens(overview.totalTokens)}
        change={`${formatTokens(overview.totalPromptTokens)} in / ${formatTokens(overview.totalCompletionTokens)} out`}
      />
      <StatCard
        label="Results Tracked"
        value={String(overview.totalResults)}
      />
    </div>
  );
}
