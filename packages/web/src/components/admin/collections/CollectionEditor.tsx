import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, X, Plus, Search } from "lucide-react";
import { Badge } from "@/components/admin/ui/Badge";
import {
  useAdminUpdateCollection,
  useAdminRemoveCollectionResult,
  useAdminAddCollectionResult,
} from "@/hooks/useAdminCollections";
import { useAdminPublicLibrary } from "@/hooks/useAdminContent";
import type { AdminCollectionDetail } from "@/data/admin/collection-types";

const toolVariant: Record<string, "info" | "warning" | "success" | "neutral"> = {
  ask: "info",
  poll: "warning",
  review: "success",
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

interface CollectionEditorProps {
  collection: AdminCollectionDetail;
}

export function CollectionEditor({ collection }: CollectionEditorProps) {
  const updateCollection = useAdminUpdateCollection();
  const removeResult = useAdminRemoveCollectionResult();
  const addResult = useAdminAddCollectionResult();

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(collection.title);
  const [subtitle, setSubtitle] = useState(collection.subtitle ?? "");
  const [status, setStatus] = useState(collection.status);

  const [addSearch, setAddSearch] = useState("");
  const { data: libraryData } = useAdminPublicLibrary({
    search: addSearch || undefined,
  });

  const existingResultIds = new Set(collection.results.map((r) => r.resultId));
  const suggestions = (libraryData?.items ?? []).filter(
    (item) => !existingResultIds.has(item.id)
  );

  const handleSave = () => {
    updateCollection.mutate(
      {
        id: collection.id,
        payload: { title, subtitle: subtitle || undefined, status },
      },
      { onSuccess: () => setEditing(false) }
    );
  };

  const handleToggleStatus = () => {
    const newStatus = collection.status === "live" ? "draft" : "live";
    updateCollection.mutate({
      id: collection.id,
      payload: { status: newStatus },
    });
  };

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
        {editing ? (
          <div className="space-y-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-lg font-semibold focus:border-admin-accent focus:outline-none focus:ring-1 focus:ring-admin-accent"
            />
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Subtitle"
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-admin-accent focus:outline-none focus:ring-1 focus:ring-admin-accent"
            />
            <div className="flex items-center gap-2">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "live" | "draft")}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              >
                <option value="draft">Draft</option>
                <option value="live">Live</option>
              </select>
              <button
                onClick={handleSave}
                disabled={updateCollection.isPending}
                className="rounded-md bg-admin-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-admin-accent/90 disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setTitle(collection.title);
                  setSubtitle(collection.subtitle ?? "");
                  setStatus(collection.status);
                  setEditing(false);
                }}
                className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {collection.title}
                </h1>
                {collection.subtitle && (
                  <p className="mt-1 text-sm text-gray-500">
                    {collection.subtitle}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
                >
                  Edit
                </button>
                <button
                  onClick={handleToggleStatus}
                  className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
                >
                  {collection.status === "live"
                    ? "Move to Draft"
                    : "Publish"}
                </button>
                <Badge
                  variant={
                    collection.status === "live" ? "success" : "neutral"
                  }
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
              {collection.position != null && (
                <span>
                  Position{" "}
                  <span className="font-medium text-gray-700">
                    #{collection.position}
                  </span>
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Results in this collection */}
      <div className="rounded-lg border border-admin-border bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">
          Results in this collection
        </h2>
        {collection.results.length === 0 ? (
          <p className="text-sm text-gray-500">
            No results yet. Use the search below to add some.
          </p>
        ) : (
          <ol className="divide-y divide-admin-border">
            {collection.results.map((result, index) => (
              <li
                key={result.resultId}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center text-xs font-medium text-gray-400">
                    {index + 1}
                  </span>
                  <span className="text-sm text-gray-700">
                    {result.title}
                  </span>
                  <Badge
                    variant={toolVariant[result.toolType] ?? "neutral"}
                  >
                    {toolLabel[result.toolType] ?? result.toolType}
                  </Badge>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    removeResult.mutate({
                      collectionId: collection.id,
                      resultId: result.resultId,
                    })
                  }
                  className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Add results */}
      <div className="rounded-lg border border-admin-border bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">
          Add results
        </h2>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={addSearch}
            onChange={(e) => setAddSearch(e.target.value)}
            placeholder="Search public library..."
            className="w-full rounded-md border border-gray-300 py-1.5 pl-9 pr-3 text-sm focus:border-admin-accent focus:outline-none focus:ring-1 focus:ring-admin-accent"
          />
        </div>
        {suggestions.length === 0 ? (
          <p className="text-sm text-gray-500">
            {addSearch
              ? "No matching results found."
              : "Type to search for results to add."}
          </p>
        ) : (
          <ul className="divide-y divide-admin-border">
            {suggestions.slice(0, 10).map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-700">{item.title}</span>
                  <Badge variant={toolVariant[item.toolType] ?? "neutral"}>
                    {toolLabel[item.toolType] ?? item.toolType}
                  </Badge>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    addResult.mutate({
                      collectionId: collection.id,
                      resultId: item.id,
                    })
                  }
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-admin-accent hover:bg-admin-accent/5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
