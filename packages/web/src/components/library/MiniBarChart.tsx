import type { PollBar } from "@/data/mock-library";

interface MiniBarChartProps {
  bars: PollBar[];
}

export function MiniBarChart({ bars }: MiniBarChartProps) {
  return (
    <div className="space-y-1.5">
      {bars.map((bar) => (
        <div key={bar.label} className="flex items-center gap-2 text-xs">
          <span className="w-16 shrink-0 truncate text-text-secondary">
            {bar.label}
          </span>
          <div className="h-2 flex-1 rounded-full bg-surface">
            <div
              className="h-2 rounded-full bg-teal"
              style={{ width: `${bar.percentage}%` }}
            />
          </div>
          <span className="w-8 shrink-0 text-right text-text-secondary">
            {bar.percentage}%
          </span>
        </div>
      ))}
    </div>
  );
}
