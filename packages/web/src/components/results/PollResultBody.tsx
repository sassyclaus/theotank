import { Card, CardContent } from "@/components/ui/card";
import type { PollResult } from "@/data/mock-results";

const OPTION_COLORS = [
  "bg-teal",
  "bg-gold",
  "bg-text-secondary/40",
  "bg-oxblood",
];

interface PollResultBodyProps {
  result: PollResult;
}

export function PollResultBody({ result }: PollResultBodyProps) {
  return (
    <div className="space-y-8">
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
                    className={`h-full rounded-full ${OPTION_COLORS[i % OPTION_COLORS.length]}`}
                    style={{ width: `${opt.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Century Trend */}
      <Card>
        <CardContent>
          <h2 className="mb-6 font-serif text-xl font-semibold">
            How responses vary across eras
          </h2>
          <div className="space-y-5">
            {result.centuryTrend.map((entry) => (
              <div key={entry.era}>
                <p className="mb-2 text-sm font-medium text-text-primary">
                  {entry.era}
                </p>
                <div className="flex items-center gap-1">
                  {entry.options.map((opt, i) => (
                    <div
                      key={opt.label}
                      className={`h-5 rounded ${OPTION_COLORS[i % OPTION_COLORS.length]}`}
                      style={{ width: `${opt.percentage}%` }}
                      title={`${opt.label}: ${opt.percentage}%`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-4">
            {result.options.map((opt, i) => (
              <div key={opt.label} className="flex items-center gap-1.5 text-xs text-text-secondary">
                <div
                  className={`h-2.5 w-2.5 rounded-full ${OPTION_COLORS[i % OPTION_COLORS.length]}`}
                />
                {opt.label}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
