import { useParams } from "react-router";
import { UserDetail } from "@/components/admin/users/UserDetail";
import { useAdminUser } from "@/hooks/useAdminUsers";

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: user, isLoading, error } = useAdminUser(id!);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-gray-500">Loading user...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-gray-500">User not found.</p>
      </div>
    );
  }

  return <UserDetail user={user} />;
}
