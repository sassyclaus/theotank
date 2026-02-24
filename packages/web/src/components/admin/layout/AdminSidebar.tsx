import { NavLink } from "react-router";
import { UserButton } from "@clerk/clerk-react";
import { cn } from "@/lib/utils";
import { adminNavSections } from "@/data/admin/navigation";

export function AdminSidebar() {
  return (
    <aside className="flex h-screen w-[220px] flex-shrink-0 flex-col bg-admin-sidebar">
      <div className="px-5 py-5">
        <span className="text-sm font-bold tracking-wider text-admin-sidebar-text-active">
          THEOTANK ADMIN
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
        {adminNavSections.map((section, sIdx) => (
          <div key={sIdx}>
            {sIdx > 0 && (
              <div className="my-3 border-t border-admin-sidebar-hover" />
            )}
            {section.items.map((item) => {
              if (item.label === "View Site") {
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-admin-sidebar-text transition-colors hover:bg-admin-sidebar-hover hover:text-admin-sidebar-text-active"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </a>
                );
              }

              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-admin-sidebar-active font-medium text-admin-sidebar-text-active"
                        : "text-admin-sidebar-text hover:bg-admin-sidebar-hover hover:text-admin-sidebar-text-active",
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-admin-sidebar-hover px-4 py-4">
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "h-8 w-8",
            },
          }}
        />
      </div>
    </aside>
  );
}
