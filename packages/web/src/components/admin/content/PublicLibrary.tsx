import { useState, useMemo } from "react";
import { Badge } from "@/components/admin/ui/Badge";
import { SearchFilter } from "@/components/admin/ui/SearchFilter";
import { DataTable } from "@/components/admin/ui/DataTable";
import { StatCard } from "@/components/admin/ui/StatCard";
import {
  publicLibraryItems,
  contentStats,
  type PublicLibraryItem,
} from "@/data/admin/mock-content";

const toolVariant: Record<string, "info" | "success" | "warning" | "neutral"> =
  {
    ask: "info",
    poll: "success",
    review: "warning",
    research: "neutral",
  };

const toolLabel: Record<string, string> = {
  ask: "Ask",
  poll: "Poll",
  review: "Review",
  research: "Research",
};

const statusVariant: Record<string, "success" | "danger" | "warning"> = {
  public: "success",
  removed: "danger",
  flagged: "warning",
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
    key: "tool",
    header: "Tool",
    render: (row: PublicLibraryItem) => (
      <Badge variant={toolVariant[row.tool]}>{toolLabel[row.tool]}</Badge>
    ),
  },
  {
    key: "views",
    header: "Views",
    render: (row: PublicLibraryItem) => row.views.toLocaleString(),
  },
  {
    key: "unlocks",
    header: "Unlocks",
    render: (row: PublicLibraryItem) => row.unlocks.toLocaleString(),
  },
  {
    key: "status",
    header: "Status",
    render: (row: PublicLibraryItem) => (
      <Badge variant={statusVariant[row.status]}>
        {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
      </Badge>
    ),
  },
];

export function PublicLibrary() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return publicLibraryItems;
    const q = search.toLowerCase();
    return publicLibraryItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.tool.toLowerCase().includes(q),
    );
  }, [search]);

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Items"
          value={contentStats.total.toLocaleString()}
        />
        <StatCard
          label="Added This Week"
          value={`+${contentStats.addedThisWeek}`}
          change={`${contentStats.addedThisWeek} new`}
          changeType="positive"
        />
        <StatCard
          label="Removed This Week"
          value={String(contentStats.removedThisWeek)}
          change={`${contentStats.removedThisWeek} removed`}
          changeType="negative"
        />
        <StatCard label="Opt-Out Rate" value={contentStats.optOutRate} />
      </div>

      {/* Search */}
      <SearchFilter
        value={search}
        onChange={setSearch}
        placeholder="Search library items..."
      />

      {/* Table */}
      <DataTable<PublicLibraryItem>
        columns={columns}
        data={filtered}
        keyExtractor={(row) => row.id}
      />
    </div>
  );
}
