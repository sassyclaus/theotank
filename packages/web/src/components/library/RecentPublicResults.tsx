import { useState } from "react";
import { Bookmark, Eye, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TOOL_LABELS, TOOL_COLORS } from "@/data/mock-library";
import type { PublicResultItem } from "@/data/mock-library";

interface RecentPublicResultsProps {
  results: PublicResultItem[];
}

export function RecentPublicResults({ results }: RecentPublicResultsProps) {
  return (
    <div>
      <h3 className="font-serif text-lg font-semibold text-text-primary">
        Recent Public Results
      </h3>
      <p className="mt-1 text-sm text-text-secondary">
        Browse what the community has been exploring.
      </p>

      <div className="mt-4 space-y-3">
        {results.map((result) => (
          <PublicResultCard key={result.id} result={result} />
        ))}
      </div>
    </div>
  );
}

function PublicResultCard({ result }: { result: PublicResultItem }) {
  const [saved, setSaved] = useState(result.isSaved);
  const colors = TOOL_COLORS[result.tool];

  return (
    <Card className="transition-shadow hover:shadow-sm">
      <CardContent>
        <div className="mb-2 flex items-center gap-2">
          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", colors.bg, colors.text)}>
            {TOOL_LABELS[result.tool]}
          </span>
          <span className="text-xs text-text-secondary">{result.team}</span>
          <span className="ml-auto text-xs text-text-secondary/60">{result.date}</span>
        </div>

        <h3 className="text-sm font-medium text-text-primary">{result.title}</h3>
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-text-secondary">
          {result.previewExcerpt}
        </p>

        <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs text-text-secondary">
          <Lock className="h-3 w-3" />
          Full report: use 1 credit or upgrade to unlock
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-text-secondary/60">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {result.viewCount.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <Bookmark className="h-3 w-3" />
              {(saved ? result.saveCount + (result.isSaved ? 0 : 1) : result.saveCount - (result.isSaved ? 1 : 0)).toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSaved(!saved)}
              className={cn(
                "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                saved
                  ? "bg-gold/10 text-gold"
                  : "text-text-secondary hover:text-gold",
              )}
            >
              <Bookmark className={cn("h-3 w-3", saved && "fill-current")} />
              {saved ? "Saved" : "Save"}
            </button>
            <Button variant="outline" size="sm">
              View preview
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
