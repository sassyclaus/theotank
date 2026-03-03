import { useState, useMemo, useCallback, useEffect } from "react";
import type { PollResult, PollOption, CenturyTrendEntry, PollTheologianSelection } from "@/data/mock-results";
import type { PollContentResponse } from "@/data/result-types";
import type { NativeTeamSummary } from "@/data/team-types";

interface PollFilters {
  traditions: Set<string>;
  timeRange: [number, number];
  teamId: string | null;
}

interface UsePollFiltersReturn {
  filteredResult: PollResult;
  filters: PollFilters;
  setTraditions: (traditions: Set<string>) => void;
  toggleTradition: (tradition: string) => void;
  setTimeRange: (range: [number, number]) => void;
  setTeamId: (teamId: string | null) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  filteredCount: number;
  totalCount: number;
  visibleSelections: PollTheologianSelection[];
  showMoreCount: number;
  showMore: () => void;
}

function birthYearToCentury(born: number): string {
  const century = Math.ceil(born / 100);
  const suffix =
    century % 10 === 1 && century !== 11
      ? "st"
      : century % 10 === 2 && century !== 12
        ? "nd"
        : century % 10 === 3 && century !== 13
          ? "rd"
          : "th";
  return `${century}${suffix} c.`;
}

export function usePollFilters(
  baseResult: PollResult,
  rawSelections: PollContentResponse["theologianSelections"],
  nativeTeams: NativeTeamSummary[],
): UsePollFiltersReturn {
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
    // Round to nearest 25
    min = Math.floor(min / 25) * 25;
    max = Math.ceil(max / 25) * 25;
    return [min || 0, max || 2025];
  }, [rawSelections]);

  const [traditions, setTraditions] = useState<Set<string>>(new Set());
  const [timeRange, setTimeRange] = useState<[number, number]>([dataMin, dataMax]);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(20);

  // Update timeRange if data bounds change
  useEffect(() => {
    setTimeRange([dataMin, dataMax]);
  }, [dataMin, dataMax]);

  const toggleTradition = useCallback((tradition: string) => {
    setTraditions((prev) => {
      const next = new Set(prev);
      if (next.has(tradition)) {
        next.delete(tradition);
      } else {
        next.add(tradition);
      }
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setTraditions(new Set());
    setTimeRange([dataMin, dataMax]);
    setTeamId(null);
  }, [dataMin, dataMax]);

  const hasActiveFilters =
    traditions.size > 0 ||
    timeRange[0] !== dataMin ||
    timeRange[1] !== dataMax ||
    teamId !== null;

  // Build team member name set
  const teamMemberNames = useMemo(() => {
    if (!teamId) return null;
    const team = nativeTeams.find((t) => t.id === teamId);
    if (!team) return null;
    return new Set(team.members.map((m) => m.name));
  }, [teamId, nativeTeams]);

  // Filter raw selections
  const filteredSelections = useMemo(() => {
    return rawSelections.filter((s) => {
      // Team filter
      if (teamMemberNames && !teamMemberNames.has(s.theologian.name)) {
        return false;
      }
      // Tradition filter
      if (traditions.size > 0 && !traditions.has(s.theologian.tradition)) {
        return false;
      }
      // Time range filter
      if (s.theologian.born !== null) {
        if (s.theologian.born < timeRange[0] || s.theologian.born > timeRange[1]) {
          return false;
        }
      }
      return true;
    });
  }, [rawSelections, teamMemberNames, traditions, timeRange]);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(20);
  }, [traditions, timeRange, teamId]);

  // Recompute PollResult from filtered selections
  const filteredResult = useMemo((): PollResult => {
    const totalPolled = filteredSelections.length;
    const optionLabels = baseResult.options.map((o) => o.label);

    // Aggregate option counts
    const countMap: Record<string, number> = {};
    for (const label of optionLabels) countMap[label] = 0;
    for (const s of filteredSelections) {
      countMap[s.selection] = (countMap[s.selection] ?? 0) + 1;
    }
    const options: PollOption[] = optionLabels.map((label) => ({
      label,
      count: countMap[label],
      percentage: totalPolled > 0 ? Math.round((countMap[label] / totalPolled) * 100) : 0,
    }));

    // Compute century trend from birth years
    const centuryMap: Record<string, Record<string, number>> = {};
    for (const s of filteredSelections) {
      if (s.theologian.born === null) continue;
      const century = birthYearToCentury(s.theologian.born);
      if (!centuryMap[century]) {
        centuryMap[century] = {};
        for (const label of optionLabels) centuryMap[century][label] = 0;
      }
      centuryMap[century][s.selection] = (centuryMap[century][s.selection] ?? 0) + 1;
    }
    const centuryTrend: CenturyTrendEntry[] = Object.keys(centuryMap)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map((century) => {
        const counts = centuryMap[century];
        const total = Object.values(counts).reduce((a, b) => a + b, 0);
        return {
          era: century,
          options: optionLabels.map((label) => ({
            label,
            percentage: total > 0 ? Math.round((counts[label] / total) * 100) : 0,
          })),
        };
      });

    return {
      ...baseResult,
      totalPolled,
      options,
      centuryTrend,
      theologianSelections: filteredSelections.map((s) => ({
        theologian: {
          name: s.theologian.name,
          initials: s.theologian.initials,
          dates: s.theologian.dates,
          tradition: s.theologian.tradition,
          color: s.theologian.color,
        },
        selection: s.selection,
        justification: s.justification,
      })),
    };
  }, [filteredSelections, baseResult]);

  const visibleSelections = filteredResult.theologianSelections.slice(0, visibleCount);
  const showMoreCount = Math.max(0, filteredResult.theologianSelections.length - visibleCount);

  const showMore = useCallback(() => {
    setVisibleCount((prev) => prev + 20);
  }, []);

  return {
    filteredResult,
    filters: { traditions, timeRange, teamId },
    setTraditions,
    toggleTradition,
    setTimeRange,
    setTeamId,
    clearFilters,
    hasActiveFilters,
    filteredCount: filteredSelections.length,
    totalCount: rawSelections.length,
    visibleSelections,
    showMoreCount,
    showMore,
  };
}
