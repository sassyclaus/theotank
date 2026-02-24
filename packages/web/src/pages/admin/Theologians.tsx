import { useState } from "react";
import { useNavigate } from "react-router";
import { SearchFilter } from "@/components/admin/ui/SearchFilter";
import { TheologianTable } from "@/components/admin/theologians/TheologianTable";
import { useAdminTheologians } from "@/hooks/useAdminTheologians";
import type { AdminTheologian } from "@/data/admin/theologian-types";

export default function Theologians() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { data: theologians, isLoading } = useAdminTheologians();

  const filteredTheologians = (theologians ?? []).filter((t) => {
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      (t.era?.toLowerCase().includes(q) ?? false) ||
      (t.tradition?.toLowerCase().includes(q) ?? false)
    );
  });

  function handleTheologianClick(theologian: AdminTheologian) {
    navigate(`/admin/theologians/${theologian.id}`);
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-32 animate-pulse rounded bg-gray-200" />
        <div className="h-10 w-64 animate-pulse rounded bg-gray-200" />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Theologians</h1>
        <span className="text-sm text-gray-500">
          {filteredTheologians.length} theologian
          {filteredTheologians.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="max-w-sm">
        <SearchFilter
          value={search}
          onChange={setSearch}
          placeholder="Search by name, era, or tradition..."
        />
      </div>

      <TheologianTable
        theologians={filteredTheologians}
        onTheologianClick={handleTheologianClick}
      />
    </div>
  );
}
