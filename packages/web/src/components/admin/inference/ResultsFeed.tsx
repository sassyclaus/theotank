import { useState } from "react";
import { useAdminInferenceResults } from "@/hooks/useAdminInferenceResults";
import { SearchFilter } from "@/components/admin/ui/SearchFilter";
import { ResultsFeedTable } from "./ResultsFeedTable";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown } from "lucide-react";

const PAGE_SIZE = 25;

const TOOL_OPTIONS = [
  { label: "All Tools", value: "" },
  { label: "Ask", value: "ask" },
  { label: "Poll", value: "poll" },
  { label: "Super Poll", value: "super_poll" },
  { label: "Review", value: "review" },
  { label: "Research", value: "research" },
];

interface ResultsFeedProps {
  period: number;
}

export function ResultsFeed({ period }: ResultsFeedProps) {
  const [search, setSearch] = useState("");
  const [toolType, setToolType] = useState("");
  const [sort, setSort] = useState<"createdAt" | "cost">("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [offset, setOffset] = useState(0);

  const { data, isLoading, error } = useAdminInferenceResults({
    period,
    toolType: toolType || undefined,
    search: search || undefined,
    sort,
    order,
    limit: PAGE_SIZE,
    offset,
  });

  const total = data?.total ?? 0;
  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  function handleSearchChange(value: string) {
    setSearch(value);
    setOffset(0);
  }

  function handleToolChange(value: string) {
    setToolType(value);
    setOffset(0);
  }

  function toggleSort(field: "createdAt" | "cost") {
    if (sort === field) {
      setOrder((prev) => (prev === "desc" ? "asc" : "desc"));
    } else {
      setSort(field);
      setOrder("desc");
    }
    setOffset(0);
  }

  const OrderIcon = order === "desc" ? ArrowDown : ArrowUp;

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-64">
          <SearchFilter
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by title..."
          />
        </div>

        <select
          value={toolType}
          onChange={(e) => handleToolChange(e.target.value)}
          className="rounded-lg border border-admin-border bg-white px-3 py-2 text-sm text-gray-700 focus:border-admin-accent focus:outline-none focus:ring-1 focus:ring-admin-accent"
        >
          {TOOL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="flex rounded-lg border border-admin-border">
          <button
            onClick={() => toggleSort("createdAt")}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 text-sm font-medium transition-colors",
              sort === "createdAt"
                ? "bg-admin-accent text-white"
                : "text-gray-600 hover:bg-gray-50",
            )}
          >
            Date
            {sort === "createdAt" && <OrderIcon className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => toggleSort("cost")}
            className={cn(
              "flex items-center gap-1 border-l border-admin-border px-3 py-1.5 text-sm font-medium transition-colors",
              sort === "cost"
                ? "bg-admin-accent text-white"
                : "text-gray-600 hover:bg-gray-50",
            )}
          >
            Cost
            {sort === "cost" && <OrderIcon className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Table */}
      {isLoading && (
        <p className="text-sm text-gray-400">Loading results...</p>
      )}

      {error && (
        <p className="text-sm text-red-500">
          Failed to load results: {(error as Error).message}
        </p>
      )}

      {data && data.results.length === 0 && (
        <p className="py-8 text-center text-sm text-gray-400">
          No results found for this period.
        </p>
      )}

      {data && data.results.length > 0 && (
        <>
          <ResultsFeedTable data={data.results} />

          {/* Pagination */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of{" "}
              {total.toLocaleString()}
            </span>
            <div className="flex gap-2">
              <button
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                className="rounded-md border border-admin-border px-3 py-1.5 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Prev
              </button>
              <span className="flex items-center px-2 text-gray-500">
                {page} / {totalPages}
              </span>
              <button
                disabled={offset + PAGE_SIZE >= total}
                onClick={() => setOffset(offset + PAGE_SIZE)}
                className="rounded-md border border-admin-border px-3 py-1.5 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
