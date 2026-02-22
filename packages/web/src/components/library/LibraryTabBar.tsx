import { Archive, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LibraryTab } from "@/data/mock-library";

const tabs: { id: LibraryTab; label: string; icon: React.ReactNode }[] = [
  { id: "my-library", label: "My Library", icon: <Archive className="h-4 w-4" /> },
  { id: "explore", label: "Explore", icon: <Globe className="h-4 w-4" /> },
];

interface LibraryTabBarProps {
  activeTab: LibraryTab;
  onTabChange: (tab: LibraryTab) => void;
}

export function LibraryTabBar({ activeTab, onTabChange }: LibraryTabBarProps) {
  return (
    <div className="flex gap-1 rounded-lg bg-surface p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors",
            activeTab === tab.id
              ? "bg-white text-gold shadow-sm"
              : "text-text-secondary hover:text-text-primary",
          )}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
