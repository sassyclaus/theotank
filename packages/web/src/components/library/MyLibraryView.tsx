import { useMemo, useCallback } from "react";
import { useNavigate } from "react-router";
import { useResults, useRetryResult } from "@/hooks/useResults";
import { teamFilters } from "@/data/mock-library";
import type { MyLibraryItem, LibraryToolType, LibraryItemStatus, LibraryPreview } from "@/data/mock-library";
import type { ResultSummary } from "@/data/result-types";
import { LibrarySearchBar } from "./LibrarySearchBar";
import { LibraryResultCard } from "./LibraryResultCard";

interface MyLibraryViewProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTool: string;
  onToolChange: (tool: string) => void;
  selectedTeam: string;
  onTeamChange: (team: string) => void;
}

function mapStatus(status: ResultSummary["status"]): LibraryItemStatus {
  if (status === "completed") return "complete";
  if (status === "failed") return "failed";
  return "processing";
}

function mapPreview(r: ResultSummary): LibraryPreview {
  if (r.previewData && typeof r.previewData === "object") {
    const pd = r.previewData as Record<string, unknown>;
    if (pd.type === "ask") return { type: "ask", conclusion: (pd.conclusion as string) ?? "" };
    if (pd.type === "poll") return { type: "poll", bars: (pd.bars as Array<{ label: string; percentage: number }>) ?? [] };
    if (pd.type === "review") return { type: "review", grade: (pd.overallGrade as string) ?? (pd.grade as string) ?? "" };
    if (pd.type === "research") return { type: "research", citedSourcesCount: (pd.citedSourcesCount as number) ?? 0 };
  }
  return { type: r.toolType as "ask", conclusion: r.previewExcerpt ?? "" };
}

function mapToLibraryItem(r: ResultSummary): MyLibraryItem {
  return {
    id: r.id,
    title: r.title,
    tool: r.toolType as LibraryToolType,
    team: r.teamName ?? "Panel",
    date: new Date(r.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    status: mapStatus(r.status),
    preview: mapPreview(r),
  };
}

export function MyLibraryView({
  searchQuery,
  onSearchChange,
  selectedTool,
  onToolChange,
  selectedTeam,
  onTeamChange,
}: MyLibraryViewProps) {
  const navigate = useNavigate();
  const { data: apiResults, isLoading } = useResults();
  const retryMutation = useRetryResult();

  const handleRetry = useCallback(
    async (id: string) => {
      try {
        const newResult = await retryMutation.mutateAsync(id);
        navigate(`/library/${newResult.id}`);
      } catch {
        // Error is surfaced by React Query
      }
    },
    [retryMutation, navigate],
  );

  const items: MyLibraryItem[] = useMemo(() => {
    return apiResults ? apiResults.map(mapToLibraryItem) : [];
  }, [apiResults]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (selectedTool !== "all" && item.tool !== selectedTool) return false;

      if (selectedTeam !== "all") {
        const teamLabel = teamFilters.find((f) => f.id === selectedTeam)?.label;
        if (teamLabel && item.team !== teamLabel) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!item.title.toLowerCase().includes(q)) return false;
      }

      return true;
    });
  }, [items, selectedTool, selectedTeam, searchQuery]);

  return (
    <div className="space-y-4">
      <LibrarySearchBar
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        selectedTool={selectedTool}
        onToolChange={onToolChange}
        selectedTeam={selectedTeam}
        onTeamChange={onTeamChange}
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-surface" />
          ))}
        </div>
      ) : (
        <>
          <p className="text-sm text-text-secondary">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </p>

          {filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-text-secondary">
              No results match your filters.
            </p>
          ) : (
            <div className="space-y-3">
              {filtered.map((item) => (
                <LibraryResultCard key={item.id} item={item} onRetry={handleRetry} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
