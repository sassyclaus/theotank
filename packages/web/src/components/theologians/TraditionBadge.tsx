import { cn } from "@/lib/utils";
import type { Tradition } from "@/data/mock-theologians";
import { TRADITION_COLORS } from "@/data/mock-theologians";

interface TraditionBadgeProps {
  tradition: Tradition;
  interactive?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

export function TraditionBadge({
  tradition,
  interactive = false,
  selected = false,
  onClick,
}: TraditionBadgeProps) {
  const color = TRADITION_COLORS[tradition];

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "rounded-full px-3 py-1 text-xs font-medium transition-colors border",
          selected ? "text-white" : "hover:opacity-80",
        )}
        style={{
          borderColor: color,
          backgroundColor: selected ? color : "transparent",
          color: selected ? "#fff" : color,
        }}
      >
        {tradition}
      </button>
    );
  }

  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: `${color}14`,
        color,
      }}
    >
      {tradition}
    </span>
  );
}
