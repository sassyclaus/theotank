import { useMemo } from "react";
import { DataTable } from "@/components/admin/ui/DataTable";
import { Badge } from "@/components/admin/ui/Badge";
import type { AdminTheologian } from "@/data/admin/theologian-types";

interface TheologianTableProps {
  theologians: AdminTheologian[];
  onTheologianClick: (t: AdminTheologian) => void;
}

const completenessVariant = {
  full: "success",
  partial: "warning",
  minimal: "danger",
} as const;

const completenessLabel = {
  full: "Full",
  partial: "Partial",
  minimal: "Minimal",
} as const;

export function TheologianTable({
  theologians,
  onTheologianClick,
}: TheologianTableProps) {
  const columns = [
    {
      key: "name",
      header: "NAME",
      render: (t: AdminTheologian) => (
        <span className="font-medium text-gray-900">{t.name}</span>
      ),
    },
    {
      key: "era",
      header: "ERA",
      render: (t: AdminTheologian) => <>{t.era ?? "\u2014"}</>,
    },
    {
      key: "tradition",
      header: "TRADITION",
      render: (t: AdminTheologian) => <>{t.tradition ?? "\u2014"}</>,
    },
    {
      key: "hasPortrait",
      header: "PORTRAIT",
      className: "text-center",
      render: (t: AdminTheologian) => (
        <span className={t.imageKey ? "text-admin-success" : "text-gray-400"}>
          {t.imageKey ? "\u2713" : "\u2715"}
        </span>
      ),
    },
    {
      key: "hasResearch",
      header: "RESEARCH",
      className: "text-center",
      render: (t: AdminTheologian) => (
        <span
          className={t.hasResearch ? "text-admin-success" : "text-gray-400"}
        >
          {t.hasResearch ? "\u2713" : "\u2014"}
        </span>
      ),
    },
    {
      key: "profileCompleteness",
      header: "COMPLETENESS",
      render: (t: AdminTheologian) => (
        <Badge variant={completenessVariant[t.profileCompleteness]}>
          {completenessLabel[t.profileCompleteness]}
        </Badge>
      ),
    },
  ];

  const { full, partial, minimal, total } = useMemo(() => {
    let full = 0;
    let partial = 0;
    let minimal = 0;
    for (const t of theologians) {
      if (t.profileCompleteness === "full") full++;
      else if (t.profileCompleteness === "partial") partial++;
      else minimal++;
    }
    return { full, partial, minimal, total: theologians.length };
  }, [theologians]);

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={theologians}
        onRowClick={onTheologianClick}
        keyExtractor={(t) => t.id}
      />

      {/* Completeness summary */}
      {total > 0 && (
        <div className="rounded-lg border border-admin-border bg-white p-4">
          <p className="mb-2 text-xs font-medium tracking-wide text-gray-500">
            PROFILE COMPLETENESS ({total} theologians)
          </p>
          <div className="flex h-3 overflow-hidden rounded-full bg-gray-100">
            <div
              className="bg-admin-success"
              style={{ width: `${(full / total) * 100}%` }}
              title={`Full: ${full}`}
            />
            <div
              className="bg-admin-warning"
              style={{ width: `${(partial / total) * 100}%` }}
              title={`Partial: ${partial}`}
            />
            <div
              className="bg-admin-danger"
              style={{ width: `${(minimal / total) * 100}%` }}
              title={`Minimal: ${minimal}`}
            />
          </div>
          <div className="mt-2 flex gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-admin-success" />
              Full {full}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-admin-warning" />
              Partial {partial}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-admin-danger" />
              Minimal {minimal}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
