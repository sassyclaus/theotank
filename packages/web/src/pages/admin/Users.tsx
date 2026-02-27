import { useState } from "react";
import { useNavigate } from "react-router";
import { SearchFilter } from "@/components/admin/ui/SearchFilter";
import { UserTable } from "@/components/admin/users/UserTable";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import type { AdminUserSummary } from "@/data/admin/user-types";

export default function Users() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { data: users = [], isLoading } = useAdminUsers();

  const filteredUsers = users.filter((user) => {
    const q = search.toLowerCase();
    return (
      (user.name ?? "").toLowerCase().includes(q) ||
      (user.email ?? "").toLowerCase().includes(q)
    );
  });

  function handleUserClick(user: AdminUserSummary) {
    navigate(`/admin/users/${user.id}`);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-gray-500">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Users</h1>
        <span className="text-sm text-gray-500">
          {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="max-w-sm">
        <SearchFilter
          value={search}
          onChange={setSearch}
          placeholder="Search by name or email..."
        />
      </div>

      <UserTable users={filteredUsers} onUserClick={handleUserClick} />
    </div>
  );
}
