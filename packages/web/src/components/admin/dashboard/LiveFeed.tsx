import { cn } from "@/lib/utils";
import { liveFeedItems } from "@/data/admin/mock-dashboard";

const dotColor: Record<string, string> = {
  submission: "bg-admin-accent",
  signup: "bg-admin-success",
  unlock: "bg-amber-500",
};

export function LiveFeed() {
  return (
    <div className="rounded-lg border border-admin-border bg-white p-5">
      <h3 className="text-sm font-semibold text-gray-900">Live Feed</h3>
      <ul className="mt-3 max-h-64 space-y-3 overflow-y-auto">
        {liveFeedItems.map((item) => (
          <li key={item.id} className="flex items-start gap-2.5 text-sm">
            <span className="mt-1.5 shrink-0 text-xs text-gray-400">
              {item.time}
            </span>
            <span
              className={cn(
                "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                dotColor[item.type] ?? "bg-gray-300",
              )}
            />
            <span className="text-gray-700">
              {item.description}
              {item.detail && (
                <span className="ml-1 text-gray-400">{item.detail}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
