import { DataTable } from "@/components/admin/ui/DataTable";
import { Badge } from "@/components/admin/ui/Badge";
import type { AdminCollection } from "@/data/admin/collection-types";

interface CollectionTableProps {
  collections: AdminCollection[];
  onCollectionClick: (c: AdminCollection) => void;
}

export function CollectionTable({
  collections,
  onCollectionClick,
}: CollectionTableProps) {
  return (
    <DataTable
      columns={[
        {
          key: "title",
          header: "Collection",
          render: (c) => (
            <div>
              <p className="font-medium text-gray-900">{c.title}</p>
              {c.subtitle && (
                <p className="mt-0.5 text-xs text-gray-500">{c.subtitle}</p>
              )}
            </div>
          ),
        },
        {
          key: "resultCount",
          header: "Results",
          className: "w-24 text-right",
          render: (c) => (
            <span className="tabular-nums">{c.resultCount}</span>
          ),
        },
        {
          key: "status",
          header: "Status",
          className: "w-28",
          render: (c) => (
            <Badge variant={c.status === "live" ? "success" : "neutral"}>
              {c.status === "live" ? "Live" : "Draft"}
            </Badge>
          ),
        },
        {
          key: "position",
          header: "Position",
          className: "w-24 text-right",
          render: (c) => (
            <span className="tabular-nums text-gray-500">
              {c.position ?? "\u2014"}
            </span>
          ),
        },
      ]}
      data={collections}
      onRowClick={onCollectionClick}
      keyExtractor={(c) => c.id}
    />
  );
}
