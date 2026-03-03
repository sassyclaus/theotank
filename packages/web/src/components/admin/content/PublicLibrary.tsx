import { useState } from "react";
import { Badge } from "@/components/admin/ui/Badge";
import { SearchFilter } from "@/components/admin/ui/SearchFilter";
import { DataTable } from "@/components/admin/ui/DataTable";
import { StatCard } from "@/components/admin/ui/StatCard";
import { useAdminPublicLibrary } from "@/hooks/useAdminContent";
import type { PublicLibraryItem } from "@/data/admin/content-types";

const toolVariant: Record<string, "info" | "success" | "warning" | "neutral"> =
  {
    ask: "info",
    poll: "success",
    review: "warning",
    super_poll: "info",
    research: "neutral",
  };

const toolLabel: Record<string, string> = {
  ask: "Ask",
  poll: "Poll",
  review: "Review",
  super_poll: "Super Poll",
  research: "Research",
};

const statusVariant: Record<string, "success" | "danger" | "warning"> = {
  approved: "success",
  removed: "danger",
  pending_review: "warning",
};

const statusLabel: Record<string, string> = {
  approved: "Public",
  removed: "Removed",
  pending_review: "Flagged",
};

const columns = [
  {
    key: "title",
    header: "Title",
    className: "min-w-[280px]",
    render: (row: PublicLibraryItem) => (
      <span className="font-medium text-gray-900">{row.title}</span>
    ),
  },
  {
    key: "toolType",
    header: "Tool",
    render: (row: PublicLibraryItem) => (
      <Badge variant={toolVariant[row.toolType] ?? "neutral"}>
        {toolLabel[row.toolType] ?? row.toolType}
      </Badge>
    ),
  },
  {
    key: "viewCount",
    header: "Views",
    render: (row: PublicLibraryItem) => row.viewCount.toLocaleString(),
  },
  {
    key: "saveCount",
    header: "Saves",
    render: (row: PublicLibraryItem) => row.saveCount.toLocaleString(),
  },
  {
    key: "moderationStatus",
    header: "Status",
    render: (row: PublicLibraryItem) => (
      <Badge variant={statusVariant[row.moderationStatus] ?? "neutral"}>
        {statusLabel[row.moderationStatus] ?? row.moderationStatus}
      </Badge>
    ),
  },
];

export function PublicLibrary() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useAdminPublicLibrary({ search: search || undefined });

  const items = data?.items ?? [];
  const stats = data?.stats;

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Items"
          value={stats ? stats.total.toLocaleString() : "—"}
        />
        <StatCard
          label="Added This Week"
          value={stats ? `+${stats.addedThisWeek}` : "—"}
          change={stats ? `${stats.addedThisWeek} new` : undefined}
          changeType="positive"
        />
        <StatCard
          label="Removed This Week"
          value={stats ? String(stats.removedThisWeek) : "—"}
          change={stats ? `${stats.removedThisWeek} removed` : undefined}
          changeType="negative"
        />
        <StatCard label="Opt-Out Rate" value={stats?.privateRate ?? "—"} />
      </div>

      {/* Search */}
      <SearchFilter
        value={search}
        onChange={setSearch}
        placeholder="Search library items..."
      />

      {/* Table */}
      {isLoading ? (
        <div className="py-8 text-center text-sm text-gray-500">Loading...</div>
      ) : (
        <DataTable<PublicLibraryItem>
          columns={columns}
          data={items}
          keyExtractor={(row) => row.id}
        />
      )}
    </div>
  );
}
