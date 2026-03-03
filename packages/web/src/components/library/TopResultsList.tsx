import { Link } from "react-router";
import { ArrowRight, Eye, Bookmark, type LucideIcon } from "lucide-react";
import { TOOL_LABELS } from "@/data/mock-library";
import { usePublicResults } from "@/hooks/usePublicResults";
import type { PublicResultSort } from "@/data/result-types";

interface TopResultsListProps {
  title: string;
  subtitle: string;
  sort: PublicResultSort;
  metricKey: "weeklyViews" | "weeklySaves";
  icon: LucideIcon;
}

export function TopResultsList({
  title,
  subtitle,
  sort,
  metricKey,
  icon: Icon,
}: TopResultsListProps) {
  const { data: items, isLoading } = usePublicResults({ sort, limit: 10 });

  return (
    <div>
      <h3 className="font-serif text-lg font-semibold text-text-primary">
        {title}
      </h3>
      <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>

      <div className="mt-4 divide-y divide-surface rounded-xl border border-surface bg-white">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-5 py-4 animate-pulse"
              >
                <span className="h-6 w-4 rounded bg-surface" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-surface" />
                  <div className="h-3 w-1/3 rounded bg-surface" />
                </div>
              </div>
            ))
          : items && items.length > 0
            ? items.map((item, index) => (
                <Link
                  key={item.id}
                  to={`/share/${item.id}`}
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
                      {TOOL_LABELS[item.toolType]} &middot;{" "}
                      {item.teamName ?? "Individual"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="flex items-center gap-1 text-xs text-text-secondary/60">
                      <Icon className="h-3 w-3" />
                      {(item[metricKey] ?? 0).toLocaleString()}
                    </span>
                    <ArrowRight className="h-4 w-4 text-text-secondary/50" />
                  </div>
                </Link>
              ))
            : (
                <div className="px-5 py-8 text-center text-sm text-text-secondary">
                  No results yet this week.
                </div>
              )}
      </div>
    </div>
  );
}
