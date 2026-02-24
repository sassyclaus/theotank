import { BarChart3 } from "lucide-react";

interface ChartPlaceholderProps {
  label: string;
  height?: string;
}

export function ChartPlaceholder({
  label,
  height = "h-48",
}: ChartPlaceholderProps) {
  return (
    <div
      className={`flex ${height} items-center justify-center rounded-lg border border-dashed border-admin-border bg-gray-50`}
    >
      <div className="flex flex-col items-center gap-2 text-gray-400">
        <BarChart3 className="h-8 w-8" />
        <span className="text-xs">{label}</span>
      </div>
    </div>
  );
}
