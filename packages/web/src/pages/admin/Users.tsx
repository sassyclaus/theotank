import { useState } from "react";
import { useNavigate } from "react-router";
import { SearchFilter } from "@/components/admin/ui/SearchFilter";
import { UserTable } from "@/components/admin/users/UserTable";
import { mockUsers } from "@/data/admin/mock-users";
import type { AdminUser } from "@/data/admin/mock-users";

export default function Users() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filteredUsers = mockUsers.filter((user) => {
    const q = search.toLowerCase();
    return (
      user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q)
    );
  });

  function handleUserClick(user: AdminUser) {
    navigate(`/admin/users/${user.id}`);
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
