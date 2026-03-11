import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { TraditionBadge } from "@/components/theologians/TraditionBadge";
import type { Tradition } from "@/data/mock-theologians";

interface TheologianPickerItemProps {
  name: string;
  initials: string;
  tradition: string | null;
  color: string;
  imageUrl?: string | null;
  selected: boolean;
  onToggle: () => void;
}

export function TheologianPickerItem({
  name,
  initials,
  tradition,
  color,
  imageUrl,
  selected,
  onToggle,
}: TheologianPickerItemProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
        selected ? "bg-teal/10" : "hover:bg-surface",
      )}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={name} className="h-8 w-8 shrink-0 rounded-full object-cover" />
      ) : (
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {initials}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate text-sm text-text-primary">
        {name}
      </span>
      {tradition && (
        <TraditionBadge tradition={tradition as Tradition} />
      )}
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
          selected
            ? "border-teal bg-teal text-white"
            : "border-text-secondary/30 bg-white",
        )}
      >
        {selected && <Check className="h-3 w-3" />}
      </span>
    </button>
  );
}
