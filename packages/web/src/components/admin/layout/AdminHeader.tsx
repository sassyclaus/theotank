import { useLocation } from "react-router";

const pageTitles: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/users": "Users",
  "/admin/content": "Content",
  "/admin/theologians": "Theologians",
  "/admin/teams": "Teams",
  "/admin/research": "Research",
  "/admin/collections": "Collections",
  "/admin/system": "System",
  "/admin/audit-log": "Audit Log",
};

function resolveTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];

  // Handle sub-routes like /admin/users/123
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length >= 2) {
    const base = `/${segments[0]}/${segments[1]}`;
    if (pageTitles[base]) return pageTitles[base];
  }

  return "Admin";
}

export function AdminHeader() {
  const { pathname } = useLocation();
  const title = resolveTitle(pathname);

  return (
    <header className="flex h-14 items-center border-b border-admin-border bg-admin-content-bg px-6">
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
    </header>
  );
}
