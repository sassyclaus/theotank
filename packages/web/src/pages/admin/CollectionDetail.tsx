import { useParams } from "react-router";
import { CollectionEditor } from "@/components/admin/collections/CollectionEditor";
import { useAdminCollection } from "@/hooks/useAdminCollections";

export default function CollectionDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: collection, isLoading } = useAdminCollection(id!);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-admin-border bg-white p-10 text-center">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="rounded-lg border border-admin-border bg-white p-10 text-center">
        <p className="text-sm text-gray-500">Collection not found.</p>
      </div>
    );
  }

  return <CollectionEditor collection={collection} />;
}
