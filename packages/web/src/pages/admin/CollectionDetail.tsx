import { useParams } from "react-router";
import { CollectionEditor } from "@/components/admin/collections/CollectionEditor";
import { mockCollections } from "@/data/admin/mock-collections";

export default function CollectionDetail() {
  const { id } = useParams<{ id: string }>();
  const collection = mockCollections.find((c) => c.id === id);

  if (!collection) {
    return (
      <div className="rounded-lg border border-admin-border bg-white p-10 text-center">
        <p className="text-sm text-gray-500">Collection not found.</p>
      </div>
    );
  }

  return <CollectionEditor collection={collection} />;
}
