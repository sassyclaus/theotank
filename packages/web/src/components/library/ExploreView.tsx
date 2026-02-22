import { Search, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ExploreSortOption } from "@/data/mock-library";
import { publicResults } from "@/data/mock-library";
import { CuratedCollections } from "./CuratedCollections";
import { RecentPublicResults } from "./RecentPublicResults";
import { TrendingThisWeek } from "./TrendingThisWeek";
import { useMemo } from "react";

const sortOptions: { id: ExploreSortOption; label: string }[] = [
  { id: "recent", label: "Most recent" },
  { id: "most-viewed", label: "Most viewed" },
  { id: "most-saved", label: "Most saved" },
];

interface ExploreViewProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: ExploreSortOption;
  onSortChange: (sort: ExploreSortOption) => void;
}

export function ExploreView({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
}: ExploreViewProps) {
  const sortedResults = useMemo(() => {
    let results = [...publicResults];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter((r) => r.title.toLowerCase().includes(q));
    }

    switch (sortBy) {
      case "most-viewed":
        results.sort((a, b) => b.viewCount - a.viewCount);
        break;
      case "most-saved":
        results.sort((a, b) => b.saveCount - a.saveCount);
        break;
      case "recent":
      default:
        break;
    }

    return results;
  }, [searchQuery, sortBy]);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary/60" />
          <Input
            placeholder="Search 2,400+ results..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {sortOptions.map((option) => (
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

      <CuratedCollections />
      <RecentPublicResults results={sortedResults} />
      <TrendingThisWeek />
    </div>
  );
}
