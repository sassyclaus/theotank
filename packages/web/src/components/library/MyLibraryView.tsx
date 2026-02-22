import { useMemo } from "react";
import { myLibraryItems, teamFilters } from "@/data/mock-library";
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

export function MyLibraryView({
  searchQuery,
  onSearchChange,
  selectedTool,
  onToolChange,
  selectedTeam,
  onTeamChange,
}: MyLibraryViewProps) {
  const filtered = useMemo(() => {
    return myLibraryItems.filter((item) => {
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
  }, [selectedTool, selectedTeam, searchQuery]);

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
            <LibraryResultCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
