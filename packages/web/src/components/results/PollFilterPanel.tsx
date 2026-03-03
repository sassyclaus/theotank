import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TimeRangeSlider } from "@/components/theologians/TimeRangeSlider";
import { TRADITION_COLORS } from "@/data/mock-theologians";
import type { Tradition } from "@/data/mock-theologians";
import type { PollContentResponse } from "@/data/result-types";
import type { NativeTeamSummary } from "@/data/team-types";

interface PollFilterPanelProps {
  rawSelections: PollContentResponse["theologianSelections"];
  nativeTeams: NativeTeamSummary[];
  traditions: Set<string>;
  onToggleTradition: (tradition: string) => void;
  timeRange: [number, number];
  onTimeRangeChange: (range: [number, number]) => void;
  teamId: string | null;
  onTeamChange: (teamId: string | null) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  filteredCount: number;
  totalCount: number;
}

export function PollFilterPanel({
  rawSelections,
  nativeTeams,
  traditions,
  onToggleTradition,
  timeRange,
  onTimeRangeChange,
  teamId,
  onTeamChange,
  hasActiveFilters,
  onClearFilters,
  filteredCount,
  totalCount,
}: PollFilterPanelProps) {
  const [expanded, setExpanded] = useState(true);

  // Derive available traditions from actual data
  const availableTraditions = useMemo(() => {
    const set = new Set<string>();
    for (const s of rawSelections) {
      if (s.theologian.tradition) set.add(s.theologian.tradition);
    }
    return Array.from(set).sort();
  }, [rawSelections]);

  // Derive time bounds from data
  const [dataMin, dataMax] = useMemo(() => {
    let min = 9999;
    let max = 0;
    for (const s of rawSelections) {
      if (s.theologian.born !== null) {
        if (s.theologian.born < min) min = s.theologian.born;
        if (s.theologian.born > max) max = s.theologian.born;
      }
    }
    min = Math.floor(min / 25) * 25;
    max = Math.ceil(max / 25) * 25;
    return [min || 0, max || 2025];
  }, [rawSelections]);

  return (
    <Card>
      <CardContent className="space-y-0">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-lg font-semibold">Filters</h2>
            {hasActiveFilters && (
              <span className="rounded-full bg-teal/10 px-2.5 py-0.5 text-xs font-medium text-teal">
                Showing {filteredCount} of {totalCount}
              </span>
            )}
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-text-secondary" />
          ) : (
            <ChevronDown className="h-4 w-4 text-text-secondary" />
          )}
        </button>

        {expanded && (
          <div className="mt-5 space-y-5">
            {/* Team dropdown */}
            {nativeTeams.length > 0 && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                  Team
                </label>
                <select
                  value={teamId ?? ""}
                  onChange={(e) => onTeamChange(e.target.value || null)}
                  className="w-full rounded-lg border border-surface bg-white px-3 py-2 text-sm text-text-primary focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
                >
                  <option value="">All Theologians</option>
                  {nativeTeams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name} ({team.memberCount})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Tradition badges */}
            {availableTraditions.length > 1 && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                  Tradition
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {availableTraditions.map((tradition) => {
                    const selected = traditions.has(tradition);
                    const color =
                      TRADITION_COLORS[tradition as Tradition] ?? "#6B6560";
                    return (
                      <button
                        key={tradition}
                        type="button"
                        onClick={() => onToggleTradition(tradition)}
                        className="rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:opacity-80"
                        style={{
                          borderColor: color,
                          backgroundColor: selected ? color : "transparent",
                          color: selected ? "#fff" : color,
                        }}
                      >
                        {tradition}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Time range slider */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                Time Period
              </label>
              <TimeRangeSlider
                min={dataMin}
                max={dataMax}
                value={timeRange}
                onChange={onTimeRangeChange}
              />
            </div>

            {/* Clear all */}
            {hasActiveFilters && (
              <button
                onClick={onClearFilters}
                className="flex items-center gap-1 text-xs font-medium text-teal hover:underline"
              >
                <X className="h-3 w-3" />
                Clear all filters
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
