import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminTheologianPickerItemProps {
  name: string;
  initials: string;
  tradition: string | null;
  color: string;
  selected: boolean;
  onToggle: () => void;
}

export function AdminTheologianPickerItem({
  name,
  initials,
  tradition,
  color,
  selected,
  onToggle,
}: AdminTheologianPickerItemProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
        selected ? "bg-blue-50" : "hover:bg-gray-50",
      )}
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
        style={{ backgroundColor: color }}
      >
        {initials}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-gray-900">
        {name}
      </span>
      {tradition && (
        <span className="shrink-0 text-xs text-gray-500">{tradition}</span>
      )}
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
          selected
            ? "border-admin-accent bg-admin-accent text-white"
            : "border-gray-300 bg-white",
        )}
      >
        {selected && <Check className="h-3 w-3" />}
      </span>
    </button>
  );
}
