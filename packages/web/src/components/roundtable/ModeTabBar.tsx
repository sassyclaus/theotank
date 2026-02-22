import { MessageCircle, BarChart3, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { modeConfig, type RoundtableMode } from "@/data/mock-roundtable";

const modeIcons: Record<RoundtableMode, React.ReactNode> = {
  ask: <MessageCircle className="h-4 w-4" />,
  poll: <BarChart3 className="h-4 w-4" />,
  review: <FileCheck className="h-4 w-4" />,
};

const modes: RoundtableMode[] = ["ask", "poll", "review"];

interface ModeTabBarProps {
  activeMode: RoundtableMode;
  onModeChange: (mode: RoundtableMode) => void;
}

export function ModeTabBar({ activeMode, onModeChange }: ModeTabBarProps) {
  return (
    <div className="flex gap-1 rounded-lg bg-surface p-1">
      {modes.map((mode) => (
        <button
          key={mode}
          onClick={() => onModeChange(mode)}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors",
            activeMode === mode
              ? "bg-white text-teal shadow-sm"
              : "text-text-secondary hover:text-text-primary",
          )}
        >
          {modeIcons[mode]}
          {modeConfig[mode].label}
        </button>
      ))}
    </div>
  );
}
