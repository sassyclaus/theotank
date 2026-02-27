import { Card, CardContent } from "@/components/ui/card";
import { CenturyLineChart, OPTION_COLORS_BG } from "@/components/results/CenturyLineChart";
import type { PollContentResponse } from "@/data/result-types";

// ── Era helpers (mirrored from worker) ──────────────────────────────

function birthYearToEra(born: number): string {
  if (born < 600) return "Patristic";
  if (born < 1400) return "Medieval";
  if (born < 1600) return "Reformation";
  if (born < 1800) return "Post-Reformation";
  return "Modern";
}

const ERA_ORDER = ["Patristic", "Medieval", "Reformation", "Post-Reformation", "Modern"];

// ── Compute aggregated data from theologianSelections ────────────────

function computeAggregates(content: PollContentResponse) {
  const { optionLabels, theologianSelections } = content;
  const totalPolled = theologianSelections.length;

  // Option counts
  const countMap: Record<string, number> = {};
  for (const label of optionLabels) countMap[label] = 0;
  for (const s of theologianSelections) countMap[s.selection] = (countMap[s.selection] ?? 0) + 1;

  const options = optionLabels.map((label) => ({
    label,
    count: countMap[label] ?? 0,
    percentage: totalPolled > 0 ? Math.round(((countMap[label] ?? 0) / totalPolled) * 100) : 0,
  }));

  // Century trend
  const eraMap: Record<string, Record<string, number>> = {};
  for (const s of theologianSelections) {
    const born = s.theologian.born;
    if (born === null) continue;
    const era = birthYearToEra(born);
    if (!eraMap[era]) {
      eraMap[era] = {};
      for (const label of optionLabels) eraMap[era][label] = 0;
    }
    eraMap[era][s.selection] = (eraMap[era][s.selection] ?? 0) + 1;
  }

  const centuryTrend = ERA_ORDER.filter((era) => eraMap[era]).map((era) => {
    const counts = eraMap[era];
    const eraTotal = Object.values(counts).reduce((a, b) => a + b, 0);
    return {
      era,
      options: optionLabels.map((label) => ({
        label,
        percentage: eraTotal > 0 ? Math.round((counts[label] / eraTotal) * 100) : 0,
      })),
    };
  });

  return { totalPolled, options, centuryTrend };
}

// ── Component ───────────────────────────────────────────────────────

interface SharedPollBodyProps {
  content: PollContentResponse;
}

export function SharedPollBody({ content }: SharedPollBodyProps) {
  const { totalPolled, options, centuryTrend } = computeAggregates(content);

  return (
    <div className="space-y-8">
      {/* Poll Summary */}
      <Card>
        <CardContent>
          <h2 className="mb-3 font-serif text-xl font-semibold">
            Poll Summary
          </h2>
          <p className="text-base leading-relaxed text-text-secondary">
            {content.summary}
          </p>
        </CardContent>
      </Card>

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

      {/* Century Trend */}
      {centuryTrend.length > 0 && (
        <Card>
          <CardContent>
            <h2 className="mb-6 font-serif text-xl font-semibold">
              How responses vary across time
            </h2>
            <CenturyLineChart
              centuryTrend={centuryTrend}
              optionLabels={content.optionLabels}
            />

            {/* Legend */}
            <div className="mt-6 flex flex-wrap gap-4">
              {options.map((opt, i) => (
                <div
                  key={opt.label}
                  className="flex items-center gap-1.5 text-xs text-text-secondary"
                >
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${OPTION_COLORS_BG[i % OPTION_COLORS_BG.length]}`}
                  />
                  {opt.label}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
