import { useParams } from "react-router";
import { TheologianEditor } from "@/components/admin/theologians/TheologianEditor";
import { useAdminTheologian } from "@/hooks/useAdminTheologians";

export default function TheologianEditorPage() {
  const { id } = useParams<{ id: string }>();
  const { data: theologian, isLoading } = useAdminTheologian(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
        <div className="h-48 animate-pulse rounded-lg bg-gray-100" />
        <div className="h-32 animate-pulse rounded-lg bg-gray-100" />
        <div className="h-32 animate-pulse rounded-lg bg-gray-100" />
      </div>
    );
  }

  if (!theologian) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-gray-500">Theologian not found.</p>
      </div>
    );
  }

  return <TheologianEditor theologian={theologian} />;
}
