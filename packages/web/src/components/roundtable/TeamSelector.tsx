import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNativeTeams, useMyTeams } from "@/hooks/useTeams";

interface TeamSelectorProps {
  value: string | null;
  onChange: (teamId: string) => void;
  onManageTeams: () => void;
}

export function TeamSelector({ value, onChange, onManageTeams }: TeamSelectorProps) {
  const { data: nativeTeams, isLoading: nativeLoading } = useNativeTeams();
  const { data: myTeams, isLoading: myLoading } = useMyTeams();

  const isLoading = nativeLoading || myLoading;

  return (
    <div className="flex items-center gap-3">
      <label
        htmlFor="team-select"
        className="shrink-0 text-sm font-medium text-text-secondary"
      >
        Panel
      </label>
      <div className="relative flex-1">
        {isLoading ? (
          <div className="h-10 w-full animate-pulse rounded-lg bg-surface" />
        ) : (
          <>
            <select
              id="team-select"
              value={value ?? ""}
              onChange={(e) => onChange(e.target.value)}
              className="h-10 w-full appearance-none rounded-lg border border-surface bg-white py-2 pl-3 pr-9 text-sm text-text-primary transition-colors focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
            >
              <option value="" disabled>
                Select a panel…
              </option>
              {nativeTeams && nativeTeams.length > 0 && (
                <optgroup label="Native Teams">
                  {nativeTeams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name} ({team.memberCount})
                    </option>
                  ))}
                </optgroup>
              )}
              {myTeams && myTeams.length > 0 && (
                <optgroup label="My Teams">
                  {myTeams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name} ({team.members.length})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          </>
        )}
      </div>
      <Button variant="outline" size="sm" onClick={onManageTeams}>
        Manage Teams
      </Button>
    </div>
  );
}
