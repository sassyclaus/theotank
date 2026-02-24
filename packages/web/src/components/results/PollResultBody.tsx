import { Card, CardContent } from "@/components/ui/card";
import { TheologianHeader } from "./AskResultBody";
import type { PollResult } from "@/data/mock-results";

const OPTION_COLORS_BG = [
  "bg-teal",
  "bg-gold",
  "bg-text-secondary/40",
  "bg-oxblood",
];

const OPTION_COLORS_STROKE = [
  "#1B6B6D",
  "#B8963E",
  "#9CA3AF",
  "#7A2E2E",
];

const OPTION_COLORS_DOT = [
  "fill-teal",
  "fill-gold",
  "fill-text-secondary/60",
  "fill-oxblood",
];

interface PollResultBodyProps {
  result: PollResult;
}

export function PollResultBody({ result }: PollResultBodyProps) {
  return (
    <div className="space-y-8">
      {/* Poll Summary */}
      <Card>
        <CardContent>
          <h2 className="mb-3 font-serif text-xl font-semibold">Poll Summary</h2>
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
            How responses vary across eras
          </h2>
          <CenturyLineChart result={result} />

          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-4">
            {result.options.map((opt, i) => (
              <div key={opt.label} className="flex items-center gap-1.5 text-xs text-text-secondary">
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
      <h2 className="font-serif text-xl font-semibold">Individual Selections</h2>
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

// ── SVG Multi-line Chart ────────────────────────────────────────────

function CenturyLineChart({ result }: { result: PollResult }) {
  const { centuryTrend, options } = result;
  const eras = centuryTrend.map((e) => e.era);
  const optionLabels = options.map((o) => o.label);

  // Chart dimensions
  const width = 600;
  const height = 280;
  const paddingLeft = 40;
  const paddingRight = 16;
  const paddingTop = 16;
  const paddingBottom = 48;
  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  // Y axis: 0–100%
  const yTicks = [0, 25, 50, 75, 100];

  // X positions for each era
  const xPositions = eras.map(
    (_, i) => paddingLeft + (i / (eras.length - 1)) * chartW,
  );

  // Build polyline points per option
  const lines = optionLabels.map((label, optIdx) => {
    const points = centuryTrend.map((entry, eraIdx) => {
      const opt = entry.options.find((o) => o.label === label);
      const pct = opt?.percentage ?? 0;
      const x = xPositions[eraIdx];
      const y = paddingTop + chartH - (pct / 100) * chartH;
      return { x, y, pct };
    });
    return { label, optIdx, points };
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {/* Y grid lines + labels */}
      {yTicks.map((tick) => {
        const y = paddingTop + chartH - (tick / 100) * chartH;
        return (
          <g key={tick}>
            <line
              x1={paddingLeft}
              x2={width - paddingRight}
              y1={y}
              y2={y}
              className="stroke-surface"
              strokeWidth={1}
            />
            <text
              x={paddingLeft - 8}
              y={y + 4}
              textAnchor="end"
              className="fill-text-secondary"
              fontSize={10}
            >
              {tick}%
            </text>
          </g>
        );
      })}

      {/* X axis labels (era names) */}
      {eras.map((era, i) => (
        <text
          key={era}
          x={xPositions[i]}
          y={height - 8}
          textAnchor="middle"
          className="fill-text-secondary"
          fontSize={10}
        >
          {era}
        </text>
      ))}

      {/* Lines + dots */}
      {lines.map(({ optIdx, points }) => {
        const color = OPTION_COLORS_STROKE[optIdx % OPTION_COLORS_STROKE.length];
        const dotClass = OPTION_COLORS_DOT[optIdx % OPTION_COLORS_DOT.length];
        const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
        return (
          <g key={optIdx}>
            <polyline
              points={polyline}
              fill="none"
              stroke={color}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {points.map((p, pi) => (
              <circle
                key={pi}
                cx={p.x}
                cy={p.y}
                r={4}
                className={dotClass}
                stroke="white"
                strokeWidth={2}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
}
