import { useState } from "react";
import { useNavigate } from "react-router";
import { Plus } from "lucide-react";
import { CollectionTable } from "@/components/admin/collections/CollectionTable";
import {
  useAdminCollections,
  useAdminCreateCollection,
} from "@/hooks/useAdminCollections";

export default function Collections() {
  const navigate = useNavigate();
  const { data: collections, isLoading } = useAdminCollections();
  const createCollection = useAdminCreateCollection();
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    createCollection.mutate(
      { title: newTitle.trim() },
      {
        onSuccess: (created) => {
          setNewTitle("");
          setShowCreate(false);
          navigate(`/admin/collections/${created.id}`);
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Collections</h1>
          <p className="mt-1 text-sm text-gray-500">
            Curated groups of results surfaced on the public library.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-admin-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-admin-accent/90"
        >
          <Plus className="h-4 w-4" />
          New Collection
        </button>
      </div>

      {showCreate && (
        <div className="rounded-lg border border-admin-border bg-white p-4">
          <label className="block text-sm font-medium text-gray-700">
            Collection Title
          </label>
          <div className="mt-1 flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="e.g. The Atonement Debate"
              className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-admin-accent focus:outline-none focus:ring-1 focus:ring-admin-accent"
              autoFocus
            />
            <button
              onClick={handleCreate}
              disabled={createCollection.isPending}
              className="rounded-md bg-admin-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-admin-accent/90 disabled:opacity-50"
            >
              Create
            </button>
            <button
              onClick={() => {
                setShowCreate(false);
                setNewTitle("");
              }}
              className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="py-8 text-center text-sm text-gray-500">Loading...</div>
      ) : (
        <CollectionTable
          collections={collections ?? []}
          onCollectionClick={(c) => navigate(`/admin/collections/${c.id}`)}
        />
      )}
    </div>
  );
}
