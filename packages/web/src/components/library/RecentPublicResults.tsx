import { useNavigate } from "react-router";
import { ArrowRight, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TOOL_LABELS, TOOL_COLORS } from "@/data/mock-library";
import type { PublicResultListItem, PublicSearchResult } from "@/data/result-types";

interface RecentPublicResultsProps {
  results: (PublicResultListItem | PublicSearchResult)[];
  isLoading?: boolean;
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
  hasMore?: boolean;
  isFetchingMore?: boolean;
  onLoadMore?: () => void;
}

export function RecentPublicResults({
  results,
  isLoading,
  title = "Recent Public Results",
  subtitle = "Browse what the community has been exploring.",
  emptyMessage = "No public results yet. Results will appear here once the community starts sharing.",
  hasMore,
  isFetchingMore,
  onLoadMore,
}: RecentPublicResultsProps) {
  return (
    <div>
      <h3 className="font-serif text-lg font-semibold text-text-primary">
        {title}
      </h3>
      <p className="mt-1 text-sm text-text-secondary">
        {subtitle}
      </p>

      <div className="mt-4 space-y-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent>
                  <div className="mb-2 flex items-center gap-2">
                    <div className="h-5 w-12 rounded-full bg-surface" />
                    <div className="h-3 w-24 rounded bg-surface" />
                  </div>
                  <div className="h-4 w-3/4 rounded bg-surface" />
                  <div className="mt-2 h-3 w-full rounded bg-surface" />
                  <div className="mt-1 h-3 w-2/3 rounded bg-surface" />
                </CardContent>
              </Card>
            ))
          : results.length > 0
            ? results.map((result) => (
                <PublicResultCard key={result.id} result={result} />
              ))
            : (
                <div className="rounded-lg border border-surface px-4 py-8 text-center text-sm text-text-secondary">
                  {emptyMessage}
                </div>
              )}

        {hasMore && onLoadMore && (
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isFetchingMore}
            className="mt-4 w-full rounded-lg border border-surface bg-white px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface hover:text-text-primary disabled:opacity-50"
          >
            {isFetchingMore ? "Loading..." : "Load more results"}
          </button>
        )}
      </div>
    </div>
  );
}

function PublicResultCard({ result }: { result: PublicResultListItem | PublicSearchResult }) {
  const navigate = useNavigate();
  const colors = TOOL_COLORS[result.toolType];
  const formattedDate = new Date(result.createdAt).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" }
  );

  return (
    <Card
      className="group cursor-pointer transition-shadow hover:shadow-md"
      onClick={() => navigate(`/share/${result.id}`)}
    >
      <CardContent>
        <div className="mb-2 flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-medium",
              colors.bg,
              colors.text
            )}
          >
            {TOOL_LABELS[result.toolType]}
          </span>
          <span className="text-xs text-text-secondary">
            {result.teamName ?? "Individual"}
          </span>
          <span className="ml-auto text-xs text-text-secondary/60">
            {formattedDate}
          </span>
        </div>

        <h3 className="text-sm font-medium text-text-primary">
          {result.title}
        </h3>
        {result.previewExcerpt && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-text-secondary">
            {result.previewExcerpt}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-text-secondary/60">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {result.viewCount.toLocaleString()}
            </span>
          </div>

          <span className="flex items-center gap-1 text-xs font-medium text-teal hover:text-teal/80">
            Open <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
