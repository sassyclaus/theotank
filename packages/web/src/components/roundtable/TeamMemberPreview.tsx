import { useState } from "react";
import { Link } from "react-router";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TeamMember } from "@/data/team-types";

interface TeamMemberPreviewProps {
  members: TeamMember[];
  totalCount: number;
}

const PREVIEW_COUNT = 6;

export function TeamMemberPreview({ members, totalCount }: TeamMemberPreviewProps) {
  const [expanded, setExpanded] = useState(false);

  if (members.length === 0) return null;

  const previewMembers = members.slice(0, PREVIEW_COUNT);
  const remaining = totalCount - PREVIEW_COUNT;

  return (
    <div className="space-y-2">
      {/* Compact preview strip */}
      <div className="flex items-center gap-1.5">
        {previewMembers.map((m) => (
          <Link
            key={m.theologianId}
            to={`/theologians/${m.slug}`}
            title={m.name}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white transition-transform hover:scale-110"
            style={{ backgroundColor: m.color }}
          >
            {m.initials}
          </Link>
        ))}
        {remaining > 0 && (
          <span className="ml-1 text-xs text-text-secondary">
            +{remaining} more
          </span>
        )}
        {members.length > PREVIEW_COUNT && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="ml-auto flex items-center gap-1 text-xs text-teal hover:text-teal/80"
          >
            {expanded ? "Hide" : "Show all"}
            {expanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
        )}
      </div>

      {/* Expanded grid */}
      <div
        className={cn(
          "grid grid-cols-2 gap-1.5 overflow-hidden transition-[grid-template-rows] duration-200 sm:grid-cols-3",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="col-span-full grid grid-cols-2 gap-1.5 overflow-hidden sm:grid-cols-3">
          {members.map((m) => (
            <Link
              key={m.theologianId}
              to={`/theologians/${m.slug}`}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-surface"
            >
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: m.color }}
              >
                {m.initials}
              </span>
              <span className="truncate text-xs text-text-primary">{m.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
