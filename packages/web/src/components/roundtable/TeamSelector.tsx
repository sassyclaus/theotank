import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { nativeTeams } from "@/data/mock-roundtable";

interface TeamSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function TeamSelector({ value, onChange }: TeamSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <label
        htmlFor="team-select"
        className="shrink-0 text-sm font-medium text-text-secondary"
      >
        Panel
      </label>
      <div className="relative flex-1">
        <select
          id="team-select"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-full appearance-none rounded-lg border border-surface bg-white py-2 pl-3 pr-9 text-sm text-text-primary transition-colors focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
        >
          {nativeTeams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
      </div>
      <Button variant="outline" size="sm">
        Customize
      </Button>
    </div>
  );
}
