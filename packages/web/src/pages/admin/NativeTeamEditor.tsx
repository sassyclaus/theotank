import { useParams } from "react-router";
import { NativeTeamEditor } from "@/components/admin/teams/NativeTeamEditor";
import { useAdminNativeTeams } from "@/hooks/useAdminTeams";
import { Loader2 } from "lucide-react";

export default function NativeTeamEditorPage() {
  const { id } = useParams<{ id: string }>();
  const { data: teams, isLoading } = useAdminNativeTeams();

  if (id === "new") {
    return <NativeTeamEditor team={null} />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  const team = teams?.find((t) => t.id === id);

  if (!team) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-gray-500">Team not found.</p>
      </div>
    );
  }

  return <NativeTeamEditor team={team} />;
}
