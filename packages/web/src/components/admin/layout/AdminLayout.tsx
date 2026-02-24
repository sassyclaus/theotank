import { Outlet } from "react-router";
import { useAdminVerify } from "@/lib/admin";
import { TopNav } from "@/components/layout/TopNav";
import NotFound from "@/pages/NotFound";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { AdminLoadingScreen } from "./AdminLoadingScreen";

export function AdminLayout() {
  const { isLoading, isError } = useAdminVerify();

  if (isLoading) return <AdminLoadingScreen />;

  if (isError) {
    return (
      <div className="min-h-screen bg-bg">
        <TopNav mobileMenuOpen={false} onToggleMobileMenu={() => {}} />
        <main>
          <NotFound />
        </main>
      </div>
    );
  }

  return (
    <div className="admin-shell flex h-screen bg-admin-content-bg">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
