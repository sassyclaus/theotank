import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
}

export function StatCard({
  label,
  value,
  change,
  changeType = "neutral",
}: StatCardProps) {
  return (
    <div className="rounded-lg border border-admin-border bg-white p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
      {change && (
        <p
          className={cn(
            "mt-1 text-xs font-medium",
            changeType === "positive" && "text-admin-success",
            changeType === "negative" && "text-admin-danger",
            changeType === "neutral" && "text-gray-500",
          )}
        >
          {change}
        </p>
      )}
    </div>
  );
}
