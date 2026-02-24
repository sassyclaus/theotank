import { Badge } from "@/components/admin/ui/Badge";
import { moderationQueue } from "@/data/admin/mock-content";

const toolLabel: Record<string, string> = {
  ask: "Ask",
  poll: "Poll",
  review: "Review",
};

export function ModerationQueue() {
  return (
    <div className="space-y-4">
      {moderationQueue.map((item) => (
        <div
          key={item.id}
          className="rounded-lg border border-admin-border bg-white p-5"
        >
          {/* Header */}
          <div className="flex items-center gap-2">
            {item.type === "auto-flagged" ? (
              <Badge variant="warning">AUTO-FLAGGED</Badge>
            ) : (
              <Badge variant="danger">USER REPORT</Badge>
            )}
            {item.type === "user-report" && item.reportCount && (
              <span className="text-xs text-gray-500">
                {item.reportCount} report{item.reportCount > 1 ? "s" : ""}
              </span>
            )}
            <span className="ml-auto text-xs text-gray-400">
              {item.timeAgo}
            </span>
          </div>

          {/* Query */}
          <p className="mt-3 text-sm font-medium text-gray-900">
            &ldquo;{item.query}&rdquo;
          </p>

          {/* Meta */}
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
            <span>{toolLabel[item.tool]}</span>
            <span className="text-gray-300">&middot;</span>
            <span>{item.team}</span>
          </div>

          {/* Flag reason */}
          <p className="mt-2 text-xs text-gray-500 italic">{item.flagReason}</p>

          {/* Actions */}
          <div className="mt-4 flex gap-2">
            <button className="rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100">
              Approve
            </button>
            {item.type === "auto-flagged" ? (
              <button className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200">
                Edit &amp; Approve
              </button>
            ) : (
              <button className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200">
                Dismiss Report
              </button>
            )}
            <button className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100">
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
