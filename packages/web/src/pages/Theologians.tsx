import { useState, useMemo, useCallback } from "react";
import { allTheologians } from "@/data/mock-theologians";
import type { Tradition } from "@/data/mock-theologians";
import { TheologianFilters } from "@/components/theologians/TheologianFilters";
import { TheologianGrid } from "@/components/theologians/TheologianGrid";

const TIME_MIN = 100;
const TIME_MAX = 2025;

export default function Theologians() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedTraditions, setSelectedTraditions] = useState<Set<Tradition>>(
    new Set(),
  );
  const [timeRange, setTimeRange] = useState<[number, number]>([
    TIME_MIN,
    TIME_MAX,
  ]);

  const toggleTradition = useCallback((t: Tradition) => {
    setSelectedTraditions((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setSelectedTraditions(new Set());
    setTimeRange([TIME_MIN, TIME_MAX]);
  }, []);

  const filtered = useMemo(() => {
    return allTheologians.filter((t) => {
      // Tradition filter — null-tradition theologians excluded when filtering
      if (selectedTraditions.size > 0) {
        if (t.tradition === null || !selectedTraditions.has(t.tradition))
          return false;
      }

      // Time range filter — theologian's lifespan must overlap the slider range
      const died = t.died ?? 2025;
      if (died < timeRange[0] || t.born > timeRange[1]) return false;

      return true;
    });
  }, [selectedTraditions, timeRange]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-bold">Theologians</h1>
        <p className="mt-2 text-text-secondary">
          350+ voices across 2,000 years of church history.
        </p>
      </div>

      <div className="mb-6">
        <TheologianFilters
          open={filtersOpen}
          onToggle={() => setFiltersOpen((o) => !o)}
          selectedTraditions={selectedTraditions}
          onToggleTradition={toggleTradition}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          onClearAll={clearAll}
        />
      </div>

      <p className="mb-6 text-sm text-text-secondary">
        {filtered.length} theologian{filtered.length !== 1 ? "s" : ""}
      </p>

      <TheologianGrid theologians={filtered} />
    </div>
  );
}
