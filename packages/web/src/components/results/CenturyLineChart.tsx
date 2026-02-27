// 6-color palette optimized for visual distinction on thin chart lines.
// Hues are spread ~60 deg apart around the color wheel to avoid confusion.
export const OPTION_COLORS_HEX = [
  "#1B6B6D", // teal (brand)
  "#B8963E", // gold (brand)
  "#7A2E2E", // oxblood (brand)
  "#3D6DAA", // cobalt
  "#9B5FC0", // amethyst
  "#C4573A", // terracotta (brand)
];

export const OPTION_COLORS_BG = [
  "bg-teal",
  "bg-gold",
  "bg-oxblood",
  "bg-[#3D6DAA]",
  "bg-[#9B5FC0]",
  "bg-terracotta",
];

// ── Catmull-Rom to cubic bezier conversion ─────────────────────────

export function catmullRomPath(
  points: { x: number; y: number }[],
  tension = 0.5,
): string {
  if (points.length < 2) return "";
  if (points.length === 2) {
    return `M${points[0].x},${points[0].y}L${points[1].x},${points[1].y}`;
  }

  const alpha = 1 - tension;
  let d = `M${points[0].x},${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];

    const cp1x = p1.x + ((p2.x - p0.x) * alpha) / 6;
    const cp1y = p1.y + ((p2.y - p0.y) * alpha) / 6;
    const cp2x = p2.x - ((p3.x - p1.x) * alpha) / 6;
    const cp2y = p2.y - ((p3.y - p1.y) * alpha) / 6;

    d += `C${cp1x},${cp1y},${cp2x},${cp2y},${p2.x},${p2.y}`;
  }

  return d;
}

// ── SVG Multi-line Chart ────────────────────────────────────────────

interface CenturyTrendEntry {
  era: string;
  options: { label: string; percentage: number }[];
}

interface CenturyLineChartProps {
  centuryTrend: CenturyTrendEntry[];
  optionLabels: string[];
}

export function CenturyLineChart({ centuryTrend, optionLabels }: CenturyLineChartProps) {
  const eras = centuryTrend.map((e) => e.era);

  // Chart dimensions
  const width = 600;
  const height = 280;
  const paddingLeft = 40;
  const paddingRight = 16;
  const paddingTop = 16;
  const paddingBottom = 48;
  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  // Y axis: 0-100%
  const yTicks = [0, 25, 50, 75, 100];

  // X positions for each era
  const xPositions = eras.map(
    (_, i) => paddingLeft + (i / Math.max(eras.length - 1, 1)) * chartW,
  );

  // Build smooth-curve points per option
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
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      preserveAspectRatio="xMidYMid meet"
    >
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

      {/* X axis labels */}
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

      {/* Smooth lines + dots */}
      {lines.map(({ optIdx, points }) => {
        const color =
          OPTION_COLORS_HEX[optIdx % OPTION_COLORS_HEX.length];
        const d = catmullRomPath(points);
        return (
          <g key={optIdx}>
            <path
              d={d}
              fill="none"
              stroke={color}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
            {points.map((p, pi) => (
              <circle
                key={pi}
                cx={p.x}
                cy={p.y}
                r={3}
                fill={color}
                stroke="white"
                strokeWidth={1.5}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
}
