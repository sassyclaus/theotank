import { Card, CardContent } from "@/components/ui/card";
import { OPTION_COLORS_BG } from "@/components/results/CenturyLineChart";
import type { PollContentResponse } from "@/data/result-types";

// ── Compute aggregated data from theologianSelections ────────────────

function computeAggregates(content: PollContentResponse) {
  const { optionLabels, theologianSelections } = content;
  const totalPolled = theologianSelections.length;

  const countMap: Record<string, number> = {};
  for (const label of optionLabels) countMap[label] = 0;
  for (const s of theologianSelections) countMap[s.selection] = (countMap[s.selection] ?? 0) + 1;

  const options = optionLabels.map((label) => ({
    label,
    count: countMap[label] ?? 0,
    percentage: totalPolled > 0 ? Math.round(((countMap[label] ?? 0) / totalPolled) * 100) : 0,
  }));

  return { totalPolled, options };
}

// ── Component ───────────────────────────────────────────────────────

interface SharedPollBodyProps {
  content: PollContentResponse;
}

export function SharedPollBody({ content }: SharedPollBodyProps) {
  const { totalPolled, options } = computeAggregates(content);

  return (
    <div className="space-y-8">
      {/* Headline Bar Chart */}
      <Card>
        <CardContent>
          <p className="mb-6 text-sm text-text-secondary">
            {totalPolled} theologians polled across 2,000 years
          </p>
          <div className="space-y-4">
            {options.map((opt, i) => (
              <div key={opt.label}>
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="text-sm font-medium text-text-primary">
                    {opt.label}
                  </span>
                  <span className="text-sm text-text-secondary">
                    {opt.count} ({opt.percentage}%)
                  </span>
                </div>
                <div className="h-6 w-full overflow-hidden rounded-full bg-surface">
                  <div
                    className={`h-full rounded-full ${OPTION_COLORS_BG[i % OPTION_COLORS_BG.length]}`}
                    style={{ width: `${opt.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
