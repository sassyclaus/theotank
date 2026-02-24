import { useParams } from "react-router";
import { UserDetail } from "@/components/admin/users/UserDetail";
import { mockUsers } from "@/data/admin/mock-users";

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = mockUsers.find((u) => u.id === id);

  if (!user) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-gray-500">User not found.</p>
      </div>
    );
  }

  return <UserDetail user={user} />;
}
