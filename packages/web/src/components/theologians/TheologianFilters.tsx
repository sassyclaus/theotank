import { SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TRADITIONS } from "@/data/mock-theologians";
import type { Tradition } from "@/data/mock-theologians";
import { TraditionBadge } from "./TraditionBadge";
import { TimeRangeSlider } from "./TimeRangeSlider";

const TIME_MIN = 100;
const TIME_MAX = 2025;

interface TheologianFiltersProps {
  open: boolean;
  onToggle: () => void;
  selectedTraditions: Set<Tradition>;
  onToggleTradition: (t: Tradition) => void;
  timeRange: [number, number];
  onTimeRangeChange: (range: [number, number]) => void;
  onClearAll: () => void;
}

export function TheologianFilters({
  open,
  onToggle,
  selectedTraditions,
  onToggleTradition,
  timeRange,
  onTimeRangeChange,
  onClearAll,
}: TheologianFiltersProps) {
  const hasActiveFilters =
    selectedTraditions.size > 0 ||
    timeRange[0] !== TIME_MIN ||
    timeRange[1] !== TIME_MAX;

  return (
    <div>
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onToggle}>
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {open ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </Button>

        {!open && hasActiveFilters && (
          <p className="text-sm text-text-secondary">
            Showing:{" "}
            {selectedTraditions.size > 0
              ? Array.from(selectedTraditions).join(", ")
              : "All traditions"}
            {(timeRange[0] !== TIME_MIN || timeRange[1] !== TIME_MAX) &&
              ` \u00b7 ${timeRange[0]}–${timeRange[1]} AD`}
          </p>
        )}
      </div>

      {/* Collapsible panel */}
      <div
        className="overflow-hidden transition-[grid-template-rows] duration-300 ease-in-out"
        style={{
          display: "grid",
          gridTemplateRows: open ? "1fr" : "0fr",
        }}
      >
        <div className="overflow-hidden">
          <div className="pt-4 pb-2 space-y-5">
            {/* Tradition badges */}
            <div>
              <h4 className="mb-2 text-sm font-medium text-text-primary">
                Tradition
              </h4>
              <div className="flex flex-wrap gap-2">
                {TRADITIONS.map((t) => (
                  <TraditionBadge
                    key={t}
                    tradition={t}
                    interactive
                    selected={selectedTraditions.has(t)}
                    onClick={() => onToggleTradition(t)}
                  />
                ))}
              </div>
            </div>

            {/* Time range */}
            <div>
              <h4 className="mb-2 text-sm font-medium text-text-primary">
                Time Period
              </h4>
              <div className="max-w-md">
                <TimeRangeSlider
                  min={TIME_MIN}
                  max={TIME_MAX}
                  value={timeRange}
                  onChange={onTimeRangeChange}
                />
              </div>
            </div>

            {/* Clear all */}
            {hasActiveFilters && (
              <button
                onClick={onClearAll}
                className="text-sm font-medium text-teal hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
