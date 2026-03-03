import { ChartPlaceholder } from "@/components/admin/ui/ChartPlaceholder";
import type { InferenceDailyTrend } from "@/data/admin/inference-types";

interface Props {
  data: InferenceDailyTrend[];
}

export function DailyCostTrend({ data }: Props) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-gray-700">Daily Token Usage</h3>
      {data.length === 0 ? (
        <p className="text-sm text-gray-400">No data yet for this period.</p>
      ) : (
        <ChartPlaceholder
          label={`${data.length} data points — chart coming soon`}
          height="h-56"
        />
      )}
    </div>
  );
}
