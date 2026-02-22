import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toolTypeFilters, teamFilters } from "@/data/mock-library";

interface LibrarySearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTool: string;
  onToolChange: (tool: string) => void;
  selectedTeam: string;
  onTeamChange: (team: string) => void;
}

export function LibrarySearchBar({
  searchQuery,
  onSearchChange,
  selectedTool,
  onToolChange,
  selectedTeam,
  onTeamChange,
}: LibrarySearchBarProps) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary/60" />
        <Input
          placeholder="Search your library..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          {toolTypeFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => onToolChange(filter.id)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                selectedTool === filter.id
                  ? "bg-gold/10 text-gold"
                  : "bg-surface text-text-secondary hover:text-text-primary",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <select
          value={selectedTeam}
          onChange={(e) => onTeamChange(e.target.value)}
          className="ml-auto rounded-lg border border-surface bg-white px-3 py-1.5 text-xs text-text-secondary transition-colors focus:border-teal focus:outline-none"
        >
          {teamFilters.map((filter) => (
            <option key={filter.id} value={filter.id}>
              {filter.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
