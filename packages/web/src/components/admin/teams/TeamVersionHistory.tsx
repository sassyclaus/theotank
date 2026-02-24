import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { useTeamSnapshots } from "@/hooks/useAdminTeams";
import type { TeamSnapshot } from "@/data/admin/team-types";

const TRADITION_COLORS: Record<string, string> = {
  Reformed: "#5A7A62",
  Catholic: "#1B6B6D",
  Orthodox: "#6B6560",
  Lutheran: "#B8963E",
  Anglican: "#2E5D7A",
  Methodist: "#1B6B6D",
  Baptist: "#5A7A62",
  Puritan: "#4A4540",
  "Neo-Orthodox": "#6B6560",
};

function colorForTradition(tradition: string | null): string {
  if (!tradition) return "#B8963E";
  return TRADITION_COLORS[tradition] ?? "#B8963E";
}

type SnapshotMember = TeamSnapshot["members"][number];

interface MemberDiff {
  added: SnapshotMember[];
  removed: SnapshotMember[];
}

function computeDiff(
  current: SnapshotMember[],
  previous: SnapshotMember[],
): MemberDiff {
  const prevIds = new Set(previous.map((m) => m.theologianId));
  const currIds = new Set(current.map((m) => m.theologianId));

  return {
    added: current.filter((m) => !prevIds.has(m.theologianId)),
    removed: previous.filter((m) => !currIds.has(m.theologianId)),
  };
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }) +
    " at " +
    d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
}

function MemberChip({ member }: { member: SnapshotMember }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 py-1 pl-1 pr-2 text-xs text-gray-700">
      <span
        className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
        style={{ backgroundColor: colorForTradition(member.tradition) }}
      >
        {member.initials}
      </span>
      {member.name}
    </span>
  );
}

function VersionRow({
  snapshot,
  previousSnapshot,
  isFirst,
}: {
  snapshot: TeamSnapshot;
  previousSnapshot: TeamSnapshot | null;
  isFirst: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const diff = useMemo(() => {
    if (!previousSnapshot) return null;
    return computeDiff(snapshot.members, previousSnapshot.members);
  }, [snapshot, previousSnapshot]);

  const hasDiff = diff && (diff.added.length > 0 || diff.removed.length > 0);

  return (
    <div className="border-b border-admin-border last:border-b-0">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start gap-2 px-4 py-3 text-left hover:bg-gray-50"
      >
        {expanded ? (
          <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
        ) : (
          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium text-gray-900">
              Version {snapshot.version}
            </span>
            <span className="text-xs text-gray-500">
              {formatDate(snapshot.createdAt)}
            </span>
            {isFirst && (
              <span className="text-xs text-gray-400">(initial)</span>
            )}
          </div>
          <div className="mt-0.5 text-xs text-gray-500">
            {snapshot.members.length} member{snapshot.members.length !== 1 && "s"}
            {hasDiff && (
              <span className="ml-2">
                {diff.added.length > 0 && (
                  <span className="text-green-700">
                    +{diff.added.length} added
                  </span>
                )}
                {diff.added.length > 0 && diff.removed.length > 0 && ", "}
                {diff.removed.length > 0 && (
                  <span className="text-red-700">
                    -{diff.removed.length} removed
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-admin-border bg-gray-50/50 px-4 py-3 pl-10">
          {hasDiff && (
            <div className="mb-3 space-y-1.5">
              {diff.added.length > 0 && (
                <div className="text-xs">
                  <span className="font-medium text-green-700">+ Added: </span>
                  <span className="text-gray-700">
                    {diff.added.map((m) => m.name).join(", ")}
                  </span>
                </div>
              )}
              {diff.removed.length > 0 && (
                <div className="text-xs">
                  <span className="font-medium text-red-700">− Removed: </span>
                  <span className="text-gray-700">
                    {diff.removed.map((m) => m.name).join(", ")}
                  </span>
                </div>
              )}
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            {snapshot.members.map((m) => (
              <MemberChip key={m.theologianId} member={m} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function TeamVersionHistory({ teamId }: { teamId: string }) {
  const { data: snapshots, isLoading } = useTeamSnapshots(teamId);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-admin-border bg-white">
        <div className="border-b border-admin-border px-5 py-3">
          <h3 className="text-sm font-semibold text-gray-900">
            Version History
          </h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!snapshots || snapshots.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-admin-border bg-white">
      <div className="border-b border-admin-border px-5 py-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Version History ({snapshots.length} version{snapshots.length !== 1 && "s"})
        </h3>
      </div>
      <div>
        {snapshots.map((snapshot, i) => (
          <VersionRow
            key={snapshot.id}
            snapshot={snapshot}
            previousSnapshot={snapshots[i + 1] ?? null}
            isFirst={i === snapshots.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
