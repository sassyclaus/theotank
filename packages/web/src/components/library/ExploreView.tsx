import { useState, useEffect, useRef } from "react";
import { Search, ArrowRight, Eye, Bookmark, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ExploreSortOption } from "@/data/mock-library";
import { toolTypeFilters } from "@/data/mock-library";
import type { PublicResultSort, PublicSearchSort, PublicSearchResult } from "@/data/result-types";
import { CuratedCollections } from "./CuratedCollections";
import { RecentPublicResults } from "./RecentPublicResults";
import { TopResultsList } from "./TopResultsList";
import { usePublicResults } from "@/hooks/usePublicResults";
import { usePublicSearch } from "@/hooks/usePublicSearch";

const browseSortOptions: { id: ExploreSortOption; label: string }[] = [
  { id: "recent", label: "Most recent" },
  { id: "most-viewed", label: "Most viewed" },
  { id: "most-saved", label: "Most saved" },
];

const searchSortOptions: { id: ExploreSortOption; label: string }[] = [
  { id: "relevance", label: "Relevance" },
  { id: "recent", label: "Most recent" },
  { id: "most-viewed", label: "Most viewed" },
  { id: "most-saved", label: "Most saved" },
];

/** Map UI sort pills to the existing public/results API sort params */
const sortToApiSort: Record<ExploreSortOption, PublicResultSort> = {
  "relevance": "recent", // not used in browse mode, but satisfies the type
  "recent": "recent",
  "most-viewed": "views_week",
  "most-saved": "saves_week",
};

/** Map UI sort pills to the new public/search API sort params */
const sortToSearchSort: Record<ExploreSortOption, PublicSearchSort> = {
  "relevance": "relevance",
  "recent": "recent",
  "most-viewed": "views",
  "most-saved": "saves",
};

/** Tool filter pills for explore (exclude research from public browse) */
const exploreToolFilters = toolTypeFilters.filter((f) => f.id !== "research");

interface ExploreViewProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: ExploreSortOption;
  onSortChange: (sort: ExploreSortOption) => void;
  selectedTool: string;
  onToolChange: (tool: string) => void;
}

export function ExploreView({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  selectedTool,
  onToolChange,
}: ExploreViewProps) {
  // Submitted query — only updates on Enter / button click, not on every keystroke
  const [submittedQuery, setSubmittedQuery] = useState("");
  const isSearching = !!submittedQuery;

  // Pagination state for search results
  const [offset, setOffset] = useState(0);
  const [accumulatedResults, setAccumulatedResults] = useState<PublicSearchResult[]>([]);
  const prevDataRef = useRef<PublicSearchResult[] | undefined>(undefined);

  // Reset pagination when search params change
  useEffect(() => {
    setOffset(0);
    setAccumulatedResults([]);
  }, [submittedQuery, sortBy, selectedTool]);

  function handleSubmit() {
    const trimmed = searchQuery.trim();
    setSubmittedQuery(trimmed);
    if (trimmed) {
      onSortChange("relevance");
    }
  }

  function handleClearSearch() {
    onSearchChange("");
    setSubmittedQuery("");
    setOffset(0);
    setAccumulatedResults([]);
    onSortChange("recent");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleSubmit();
    }
  }

  // Use hybrid search endpoint when there's a query or tool filter
  const searchSort = sortToSearchSort[sortBy];
  const {
    data: searchData,
    isLoading: searchLoading,
    isFetching: searchFetching,
  } = usePublicSearch({
    q: submittedQuery || undefined,
    tool: selectedTool !== "all" ? selectedTool : undefined,
    sort: searchSort,
    limit: 20,
    offset,
  });

  // Accumulate results as new pages arrive
  useEffect(() => {
    const newResults = searchData?.results;
    if (newResults && newResults !== prevDataRef.current) {
      prevDataRef.current = newResults;
      if (offset === 0) {
        setAccumulatedResults(newResults);
      } else {
        setAccumulatedResults((prev) => [...prev, ...newResults]);
      }
    }
  }, [searchData?.results, offset]);

  function handleLoadMore() {
    setOffset((prev) => prev + 20);
  }

  // Use existing browse endpoint for default view (no query, no tool filter)
  const showBrowse = !isSearching && selectedTool === "all";
  const apiSort = sortToApiSort[sortBy];
  const { data: browseResults, isLoading: browseLoading } = usePublicResults({
    sort: apiSort,
    limit: 20,
    ...(showBrowse ? {} : { search: "__skip__" }), // skip query when not used
  });

  // Choose which data to display
  const results = showBrowse
    ? (browseResults ?? [])
    : isSearching
      ? accumulatedResults
      : (searchData?.results ?? []);
  const isLoading = showBrowse ? browseLoading : (searchLoading && offset === 0);
  const hasMore = isSearching ? (searchData?.hasMore ?? false) : false;
  const isFetchingMore = isSearching && searchFetching && offset > 0;

  // Pick sort pills based on mode
  const activeSortOptions = isSearching ? searchSortOptions : browseSortOptions;

  // Build subtitle
  const subtitle = isSearching
    ? `Showing ${accumulatedResults.length} result${accumulatedResults.length !== 1 ? "s" : ""} for "${submittedQuery}"`
    : "Browse what the community has been exploring.";

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary/60" />
          <Input
            placeholder="Search public results..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cn("pl-10", searchQuery ? "pr-28" : "pr-20")}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-18 top-1/2 -translate-y-1/2 rounded-full p-1 text-text-secondary/60 transition-colors hover:bg-surface hover:text-text-primary"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-teal px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-teal/90"
          >
            Search
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {exploreToolFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => onToolChange(filter.id)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                selectedTool === filter.id
                  ? "bg-teal/10 text-teal"
                  : "bg-surface text-text-secondary hover:text-text-primary",
              )}
            >
              {filter.label}
            </button>
          ))}

          <span className="mx-1 self-center text-text-secondary/30">|</span>

          {activeSortOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => onSortChange(option.id)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                sortBy === option.id
                  ? "bg-gold/10 text-gold"
                  : "bg-surface text-text-secondary hover:text-text-primary",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-oxblood/20 bg-oxblood/5 px-4 py-3">
        <p className="text-sm text-oxblood">
          Looking for cited primary sources?{" "}
          <a
            href="/research"
            className="inline-flex items-center gap-1 font-medium underline hover:text-oxblood/80"
          >
            Explore Research <ArrowRight className="h-3 w-3" />
          </a>
        </p>
      </div>

      {!isSearching && selectedTool === "all" && <CuratedCollections />}

      <RecentPublicResults
        results={results}
        isLoading={isLoading}
        title={isSearching ? "Search Results" : "Recent Public Results"}
        subtitle={subtitle}
        emptyMessage={
          isSearching
            ? "No results found. Try a different search term or broaden your filters."
            : "No public results yet. Results will appear here once the community starts sharing."
        }
        hasMore={hasMore}
        isFetchingMore={isFetchingMore}
        onLoadMore={handleLoadMore}
      />

      {!isSearching && selectedTool === "all" && (
        <div className="grid gap-8 md:grid-cols-2">
          <TopResultsList
            title="Most Viewed This Week"
            subtitle="The most-viewed results across the community."
            sort="views_week"
            metricKey="weeklyViews"
            icon={Eye}
          />
          <TopResultsList
            title="Most Saved This Week"
            subtitle="Results the community is bookmarking."
            sort="saves_week"
            metricKey="weeklySaves"
            icon={Bookmark}
          />
        </div>
      )}
    </div>
  );
}
