import { Badge } from "@/components/admin/ui/Badge";
import {
  useAdminModerationQueue,
  useAdminApproveFlag,
  useAdminRemoveFlag,
} from "@/hooks/useAdminContent";

const toolLabel: Record<string, string> = {
  ask: "Ask",
  poll: "Poll",
  review: "Review",
  super_poll: "Super Poll",
  research: "Research",
};

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ModerationQueue() {
  const { data: items, isLoading } = useAdminModerationQueue();
  const approveFlag = useAdminApproveFlag();
  const removeFlag = useAdminRemoveFlag();

  if (isLoading) {
    return (
      <div className="rounded-lg border border-admin-border bg-gray-50 px-5 py-12 text-center text-sm text-gray-500">
        Loading...
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="rounded-lg border border-admin-border bg-gray-50 px-5 py-12 text-center text-sm text-gray-500">
        No items in the moderation queue.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-lg border border-admin-border bg-white p-5"
        >
          {/* Header */}
          <div className="flex items-center gap-2">
            {item.type === "auto_flagged" ? (
              <Badge variant="warning">AUTO-FLAGGED</Badge>
            ) : (
              <Badge variant="danger">USER REPORT</Badge>
            )}
            <span className="ml-auto text-xs text-gray-400">
              {timeAgo(item.createdAt)}
            </span>
          </div>

          {/* Query */}
          <p className="mt-3 text-sm font-medium text-gray-900">
            &ldquo;{item.result.title}&rdquo;
          </p>

          {/* Meta */}
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
            <span>{toolLabel[item.result.toolType] ?? item.result.toolType}</span>
            {item.result.teamName && (
              <>
                <span className="text-gray-300">&middot;</span>
                <span>{item.result.teamName}</span>
              </>
            )}
          </div>

          {/* Flag reason */}
          {item.reason && (
            <p className="mt-2 text-xs text-gray-500 italic">{item.reason}</p>
          )}

          {/* Actions */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => approveFlag.mutate(item.id)}
              className="rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
            >
              Approve
            </button>
            {item.type === "auto_flagged" ? (
              <button
                onClick={() => approveFlag.mutate(item.id)}
                className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
              >
                Dismiss
              </button>
            ) : (
              <button
                onClick={() => approveFlag.mutate(item.id)}
                className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
              >
                Dismiss Report
              </button>
            )}
            <button
              onClick={() => removeFlag.mutate(item.id)}
              className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
