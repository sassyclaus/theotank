import { ArrowRight, Eye } from "lucide-react";
import { trendingLibraryItems, TOOL_LABELS } from "@/data/mock-library";

export function TrendingThisWeek() {
  return (
    <div>
      <h3 className="font-serif text-lg font-semibold text-text-primary">
        Trending This Week
      </h3>
      <p className="mt-1 text-sm text-text-secondary">
        The most-viewed results across the community.
      </p>

      <div className="mt-4 divide-y divide-surface rounded-xl border border-surface bg-white">
        {trendingLibraryItems.map((item, index) => (
          <button
            key={item.id}
            className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-surface/50"
          >
            <span className="shrink-0 font-serif text-lg font-bold text-gold">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text-primary">
                {item.title}
              </p>
              <p className="mt-0.5 text-xs text-text-secondary">
                {TOOL_LABELS[item.tool]} &middot; {item.team}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="flex items-center gap-1 text-xs text-text-secondary/60">
                <Eye className="h-3 w-3" />
                {item.viewCount.toLocaleString()}
              </span>
              <ArrowRight className="h-4 w-4 text-text-secondary/50" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
