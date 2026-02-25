import { Check, Loader2, AlertCircle, FileText, Trash2 } from "lucide-react";
import type { ReviewFile } from "@/data/review-file-types";
import { cn } from "@/lib/utils";

interface ReviewFileCardProps {
  file: ReviewFile;
  selected?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
  compact?: boolean;
}

const statusConfig = {
  pending: {
    badge: "Pending",
    className: "bg-gold-light text-gold",
    icon: Loader2,
    spin: true,
  },
  uploaded: {
    badge: "Uploaded",
    className: "bg-gold-light text-gold",
    icon: Loader2,
    spin: true,
  },
  processing: {
    badge: "Processing",
    className: "bg-gold-light text-gold",
    icon: Loader2,
    spin: true,
  },
  ready: {
    badge: "Ready",
    className: "bg-teal-light text-teal",
    icon: Check,
    spin: false,
  },
  failed: {
    badge: "Failed",
    className: "bg-oxblood-light text-oxblood",
    icon: AlertCircle,
    spin: false,
  },
} as const;

export function ReviewFileCard({
  file,
  selected,
  onClick,
  onDelete,
  compact,
}: ReviewFileCardProps) {
  const config = statusConfig[file.status];
  const StatusIcon = config.icon;

  return (
    <div
      onClick={file.status === "ready" ? onClick : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors",
        file.status === "ready" && onClick && "cursor-pointer hover:border-teal/40",
        selected
          ? "border-teal/50 bg-teal-light/50"
          : "border-surface bg-white",
      )}
    >
      <FileText className="h-4 w-4 shrink-0 text-text-secondary/60" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">
          {file.label}
        </p>
        {!compact && (
          <p className="text-xs text-text-secondary/60">
            {file.fileName}
            {file.charCount != null && ` · ${formatCharCount(file.charCount)}`}
          </p>
        )}
      </div>

      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
          config.className,
        )}
      >
        <StatusIcon
          className={cn("h-3 w-3", config.spin && "animate-spin")}
        />
        {config.badge}
      </span>

      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="rounded-md p-1 text-text-secondary/40 transition-colors hover:bg-oxblood-light hover:text-oxblood"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function formatCharCount(count: number): string {
  if (count < 1000) return `${count} chars`;
  if (count < 1_000_000) return `${(count / 1000).toFixed(1)}k chars`;
  return `${(count / 1_000_000).toFixed(1)}M chars`;
}
