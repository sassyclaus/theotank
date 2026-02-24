import { useNavigate } from "react-router";
import { CollectionTable } from "@/components/admin/collections/CollectionTable";
import { mockCollections } from "@/data/admin/mock-collections";

export default function Collections() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Collections</h1>
        <p className="mt-1 text-sm text-gray-500">
          Curated groups of results surfaced on the public library.
        </p>
      </div>

      <CollectionTable
        collections={mockCollections}
        onCollectionClick={(c) => navigate(`/admin/collections/${c.id}`)}
      />
    </div>
  );
}
