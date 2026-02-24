import { useState, useMemo, useCallback } from "react";
import { Search } from "lucide-react";
import { useTheologians } from "@/hooks/useTheologians";
import type { Tradition } from "@/data/mock-theologians";
import { TheologianFilters } from "@/components/theologians/TheologianFilters";
import { TheologianGrid } from "@/components/theologians/TheologianGrid";

const TIME_MIN = 100;
const TIME_MAX = 2025;

export default function Theologians() {
  const { data: allTheologians, isLoading, error } = useTheologians();

  const [search, setSearch] = useState("");
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
    if (!allTheologians) return [];
    return allTheologians.filter((t) => {
      // Search filter
      if (search) {
        const q = search.toLowerCase();
        const matches =
          t.name.toLowerCase().includes(q) ||
          (t.tradition?.toLowerCase().includes(q) ?? false) ||
          (t.era?.toLowerCase().includes(q) ?? false);
        if (!matches) return false;
      }

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
  }, [allTheologians, search, selectedTraditions, timeRange]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="mb-8">
          <div className="h-10 w-56 animate-pulse rounded bg-surface" />
          <div className="mt-3 h-5 w-80 animate-pulse rounded bg-surface" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-lg bg-surface"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center lg:px-8">
        <h1 className="font-serif text-3xl font-bold">Something went wrong</h1>
        <p className="mt-4 text-text-secondary">
          Failed to load theologians. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-bold">Theologians</h1>
        <p className="mt-2 text-text-secondary">
          350+ voices across 2,000 years of church history.
        </p>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, era, or tradition..."
          className="w-full rounded-lg border border-surface bg-white py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-secondary/60 focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
        />
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
