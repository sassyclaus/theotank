import { Link } from "react-router";
import { ArrowLeft, X, Plus } from "lucide-react";
import { Badge } from "@/components/admin/ui/Badge";
import type { Collection } from "@/data/admin/mock-collections";

const toolVariant: Record<string, "info" | "warning" | "success"> = {
  ask: "info",
  poll: "warning",
  review: "success",
};

const suggestedAdditions = [
  {
    id: "sug-1",
    title: "What is Christus Victor and why is it making a comeback?",
    tool: "ask" as const,
  },
  {
    id: "sug-2",
    title: "Review: Crucifixion by Fleming Rutledge",
    tool: "review" as const,
  },
];

interface CollectionEditorProps {
  collection: Collection;
}

export function CollectionEditor({ collection }: CollectionEditorProps) {
  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        to="/admin/collections"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Collections
      </Link>

      {/* Header card */}
      <div className="rounded-lg border border-admin-border bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {collection.title}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {collection.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge
              variant={collection.status === "live" ? "success" : "neutral"}
            >
              {collection.status === "live" ? "Live" : "Draft"}
            </Badge>
          </div>
        </div>

        <div className="mt-4 flex gap-6 text-sm text-gray-500">
          <span>
            <span className="font-medium text-gray-700">
              {collection.resultCount}
            </span>{" "}
            results
          </span>
          <span>
            <span className="font-medium text-gray-700">
              {collection.views.toLocaleString()}
            </span>{" "}
            views
          </span>
          {collection.position && (
            <span>
              Position{" "}
              <span className="font-medium text-gray-700">
                #{collection.position}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Results in this collection */}
      <div className="rounded-lg border border-admin-border bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">
          Results in this collection
        </h2>
        <ol className="divide-y divide-admin-border">
          {collection.results.map((result, index) => (
            <li
              key={result.id}
              className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 text-center text-xs font-medium text-gray-400">
                  {index + 1}
                </span>
                <span className="text-sm text-gray-700">{result.title}</span>
                <Badge variant={toolVariant[result.tool]}>
                  {result.tool}
                </Badge>
              </div>
              <button
                type="button"
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ol>
      </div>

      {/* Suggested additions */}
      <div className="rounded-lg border border-admin-border bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">
          Suggested additions
        </h2>
        <ul className="divide-y divide-admin-border">
          {suggestedAdditions.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-700">{item.title}</span>
                <Badge variant={toolVariant[item.tool]}>{item.tool}</Badge>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-admin-accent hover:bg-admin-accent-light"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
