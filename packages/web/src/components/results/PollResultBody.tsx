import { Card, CardContent } from "@/components/ui/card";
import { TheologianHeader } from "./AskResultBody";
import { CenturyLineChart, OPTION_COLORS_BG } from "./CenturyLineChart";
import type { PollResult } from "@/data/mock-results";

interface PollResultBodyProps {
  result: PollResult;
}

export function PollResultBody({ result }: PollResultBodyProps) {
  return (
    <div className="space-y-8">
      {/* Poll Summary */}
      <Card>
        <CardContent>
          <h2 className="mb-3 font-serif text-xl font-semibold">
            Poll Summary
          </h2>
          <p className="text-base leading-relaxed text-text-secondary">
            {result.summary}
          </p>
        </CardContent>
      </Card>

      {/* Headline Bar Chart */}
      <Card>
        <CardContent>
          <p className="mb-6 text-sm text-text-secondary">
            {result.totalPolled} theologians polled across 2,000 years
          </p>
          <div className="space-y-4">
            {result.options.map((opt, i) => (
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

      {/* Century Trend — Multi-line Chart */}
      <Card>
        <CardContent>
          <h2 className="mb-6 font-serif text-xl font-semibold">
            How responses vary across time
          </h2>
          <CenturyLineChart
            centuryTrend={result.centuryTrend}
            optionLabels={result.options.map((o) => o.label)}
          />

          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-4">
            {result.options.map((opt, i) => (
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

      {/* Individual Theologian Selections */}
      <h2 className="font-serif text-xl font-semibold">
        Individual Selections
      </h2>
      <div className="space-y-6">
        {result.theologianSelections.map((sel) => (
          <Card key={sel.theologian.name}>
            <CardContent>
              <div className="flex items-start justify-between gap-4">
                <TheologianHeader theologian={sel.theologian} />
                <span className="shrink-0 rounded-full bg-teal/10 px-3 py-1 text-sm font-semibold text-teal">
                  {sel.selection}
                </span>
              </div>
              <p className="mt-4 text-base leading-relaxed text-text-primary">
                {sel.justification}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
