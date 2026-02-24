import { useNavigate } from "react-router";
import { DataTable } from "@/components/admin/ui/DataTable";
import { Badge } from "@/components/admin/ui/Badge";
import {
  useAdminNativeTeams,
  useAdminReorderNativeTeams,
} from "@/hooks/useAdminTeams";
import type { AdminNativeTeam } from "@/data/admin/team-types";
import { ChevronUp, ChevronDown, Loader2 } from "lucide-react";

export function NativeTeams() {
  const navigate = useNavigate();
  const { data: nativeTeams, isLoading } = useAdminNativeTeams();
  const reorderMutation = useAdminReorderNativeTeams();

  const sorted = nativeTeams
    ? [...nativeTeams].sort((a, b) => a.displayOrder - b.displayOrder)
    : [];

  function handleMoveUp(team: AdminNativeTeam) {
    const idx = sorted.findIndex((t) => t.id === team.id);
    if (idx <= 0) return;
    const prev = sorted[idx - 1];
    reorderMutation.mutate({
      orders: [
        { id: team.id, displayOrder: prev.displayOrder },
        { id: prev.id, displayOrder: team.displayOrder },
      ],
    });
  }

  function handleMoveDown(team: AdminNativeTeam) {
    const idx = sorted.findIndex((t) => t.id === team.id);
    if (idx < 0 || idx >= sorted.length - 1) return;
    const next = sorted[idx + 1];
    reorderMutation.mutate({
      orders: [
        { id: team.id, displayOrder: next.displayOrder },
        { id: next.id, displayOrder: team.displayOrder },
      ],
    });
  }

  const columns = [
    {
      key: "name",
      header: "Team Name",
      render: (row: AdminNativeTeam) => (
        <div>
          <p className="font-medium text-gray-900">{row.name}</p>
          <p className="mt-0.5 text-xs text-gray-500">{row.description}</p>
        </div>
      ),
    },
    {
      key: "members",
      header: "Members",
      render: (row: AdminNativeTeam) => (
        <span className="tabular-nums">{row.memberCount.toLocaleString()}</span>
      ),
    },
    {
      key: "displayOrder",
      header: "Display Order",
      render: (row: AdminNativeTeam) => (
        <span className="inline-flex items-center gap-1">
          <span className="tabular-nums">{row.displayOrder}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleMoveUp(row);
            }}
            className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label={`Move ${row.name} up`}
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleMoveDown(row);
            }}
            className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label={`Move ${row.name} down`}
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </span>
      ),
    },
    {
      key: "visible",
      header: "Visible",
      render: (row: AdminNativeTeam) => (
        <Badge variant={row.visible ? "success" : "neutral"}>
          {row.visible ? "Visible" : "Hidden"}
        </Badge>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-gray-500">
        No native teams yet. Create one to get started.
      </p>
    );
  }

  return (
    <DataTable<AdminNativeTeam>
      columns={columns}
      data={sorted}
      keyExtractor={(row) => row.id}
      onRowClick={(row) => navigate(`/admin/teams/${row.id}`)}
    />
  );
}
