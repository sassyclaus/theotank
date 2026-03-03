import {
  LayoutDashboard,
  Users,
  FileText,
  Drama,
  UsersRound,
  FlaskConical,
  BookOpen,
  ListOrdered,
  Cpu,
  ClipboardList,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface AdminNavSection {
  items: AdminNavItem[];
}

export const adminNavSections: AdminNavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Content", href: "/admin/content", icon: FileText },
      { label: "Theologians", href: "/admin/theologians", icon: Drama },
      { label: "Teams", href: "/admin/teams", icon: UsersRound },
      { label: "Research", href: "/admin/research", icon: FlaskConical },
      { label: "Collections", href: "/admin/collections", icon: BookOpen },
      { label: "Jobs", href: "/admin/jobs", icon: ListOrdered },
      { label: "Inference", href: "/admin/inference", icon: Cpu },
    ],
  },
  {
    items: [
      { label: "Audit Log", href: "/admin/audit-log", icon: ClipboardList },
      { label: "View Site", href: "/", icon: ExternalLink },
    ],
  },
];
