import { Badge } from "@/components/admin/ui/Badge";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "neutral";

const statusVariant: Record<string, BadgeVariant> = {
  pending: "neutral",
  processing: "warning",
  completed: "success",
  failed: "danger",
};

const priorityVariant: Record<string, BadgeVariant> = {
  critical: "danger",
  high: "warning",
  normal: "default",
  low: "neutral",
};

const typeVariant: Record<string, BadgeVariant> = {
  ask: "info",
  poll: "warning",
  review: "success",
  research: "neutral",
  pdf: "neutral",
  review_file: "neutral",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={statusVariant[status] ?? "neutral"}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <Badge variant={priorityVariant[priority] ?? "default"}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  );
}

export function TypeBadge({ type }: { type: string }) {
  return (
    <Badge variant={typeVariant[type] ?? "neutral"}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </Badge>
  );
}
