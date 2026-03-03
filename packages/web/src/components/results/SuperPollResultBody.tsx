import { useNativeTeams } from "@/hooks/useTeams";
import { usePollFilters } from "@/hooks/usePollFilters";
import { PollFilterPanel } from "./PollFilterPanel";
import { PollResultBody } from "./PollResultBody";
import type { PollResult } from "@/data/mock-results";
import type { PollContentResponse } from "@/data/result-types";

interface SuperPollResultBodyProps {
  pollResult: PollResult;
  rawSelections: PollContentResponse["theologianSelections"];
}

export function SuperPollResultBody({
  pollResult,
  rawSelections,
}: SuperPollResultBodyProps) {
  const { data: nativeTeams = [] } = useNativeTeams();

  const {
    filteredResult,
    filters,
    toggleTradition,
    setTimeRange,
    setTeamId,
    clearFilters,
    hasActiveFilters,
    filteredCount,
    totalCount,
    visibleSelections,
    showMoreCount,
    showMore,
  } = usePollFilters(pollResult, rawSelections, nativeTeams);

  return (
    <div className="space-y-8">
      <PollFilterPanel
        rawSelections={rawSelections}
        nativeTeams={nativeTeams}
        traditions={filters.traditions}
        onToggleTradition={toggleTradition}
        timeRange={filters.timeRange}
        onTimeRangeChange={setTimeRange}
        teamId={filters.teamId}
        onTeamChange={setTeamId}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        filteredCount={filteredCount}
        totalCount={totalCount}
      />

      {hasActiveFilters && (
        <p className="text-xs text-text-secondary">
          Summary reflects all responses; charts and selections reflect current filters.
        </p>
      )}

      <PollResultBody
        result={filteredResult}
        visibleSelections={visibleSelections}
        showMoreCount={showMoreCount}
        onShowMore={showMore}
      />
    </div>
  );
}
