import {
  Users,
  FileText,
  Drama,
  UsersRound,
  BookOpen,
  ClipboardList,
  ListOrdered,
  Cpu,
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
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Content", href: "/admin/content", icon: FileText },
      { label: "Theologians", href: "/admin/theologians", icon: Drama },
      { label: "Teams", href: "/admin/teams", icon: UsersRound },
      { label: "Collections", href: "/admin/collections", icon: BookOpen },
      { label: "Waitlist", href: "/admin/waitlist", icon: ClipboardList },
      { label: "Jobs", href: "/admin/jobs", icon: ListOrdered },
      { label: "Inference", href: "/admin/inference", icon: Cpu },
    ],
  },
  {
    items: [
      { label: "View Site", href: "/", icon: ExternalLink },
    ],
  },
];
