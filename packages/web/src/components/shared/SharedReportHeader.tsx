import { TOOL_LABELS, TOOL_COLORS, TOOL_ICONS } from "@/data/mock-library";
import { TeamPanel } from "@/components/results/TeamPanel";
import type { PublicResultMeta } from "@/data/result-types";

interface SharedReportHeaderProps {
  meta: PublicResultMeta;
}

export function SharedReportHeader({ meta }: SharedReportHeaderProps) {
  const colors = TOOL_COLORS[meta.toolType];
  const Icon = TOOL_ICONS[meta.toolType];

  const formattedDate = new Date(meta.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="mb-10">
      <div className="mb-6 flex items-center gap-2 text-sm text-text-secondary">
        <span className="font-serif font-semibold text-teal">TheoTank</span>
        <span className="text-text-secondary/40">|</span>
        <span>Shared Result</span>
      </div>

      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${colors.bg}`}
        >
          <Icon className={`h-6 w-6 ${colors.text}`} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}
            >
              {TOOL_LABELS[meta.toolType]}
            </span>
            {meta.teamName && (
              <span className="text-xs text-text-secondary">{meta.teamName}</span>
            )}
            <span className="text-xs text-text-secondary/60">{formattedDate}</span>
          </div>

          <h1 className="mt-2 font-serif text-2xl font-bold lg:text-3xl">
            {meta.title}
          </h1>

          {meta.teamMembers && meta.teamMembers.length > 0 && meta.teamName && (
            <TeamPanel teamName={meta.teamName} members={meta.teamMembers} />
          )}
        </div>
      </div>
    </div>
  );
}
