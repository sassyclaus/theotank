import { useState } from "react";
import { Tabs } from "@/components/admin/ui/Tabs";
import { Badge } from "@/components/admin/ui/Badge";
import { ModerationQueue } from "@/components/admin/content/ModerationQueue";
import { PublicLibrary } from "@/components/admin/content/PublicLibrary";
import {
  useAdminModerationQueue,
  useAdminFlaggedItems,
  useAdminApproveFlag,
  useAdminRemoveFlag,
  useAdminRestoreResult,
} from "@/hooks/useAdminContent";
import type { FlaggedItem } from "@/data/admin/content-types";

const toolLabel: Record<string, string> = {
  ask: "Ask",
  poll: "Poll",
  review: "Review",
  super_poll: "Super Poll",
  research: "Research",
};

const toolVariant: Record<string, "info" | "success" | "warning" | "neutral"> = {
  ask: "info",
  poll: "success",
  review: "warning",
  super_poll: "info",
  research: "neutral",
};

export default function Content() {
  const [activeTab, setActiveTab] = useState("moderation");
  const { data: moderationItems } = useAdminModerationQueue();
  const { data: flaggedItems, isLoading: flaggedLoading } = useAdminFlaggedItems();
  const removeFlag = useAdminRemoveFlag();
  const restoreResult = useAdminRestoreResult();

  const tabs = [
    {
      key: "moderation",
      label: "Moderation Queue",
      count: moderationItems?.length ?? 0,
    },
    { key: "library", label: "Public Library" },
    {
      key: "flagged",
      label: "Flagged",
      count: flaggedItems?.length ?? 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Content</h1>
        <p className="mt-1 text-sm text-gray-500">
          Moderate submissions and manage the public library.
        </p>
      </div>

      <div className="rounded-lg border border-admin-border bg-white">
        <Tabs tabs={tabs} activeKey={activeTab} onChange={setActiveTab} />

        <div className="p-5">
          {activeTab === "moderation" && <ModerationQueue />}
          {activeTab === "library" && <PublicLibrary />}
          {activeTab === "flagged" && (
            <FlaggedTab
              items={flaggedItems ?? []}
              isLoading={flaggedLoading}
              onRemove={(id) => removeFlag.mutate(id)}
              onRestore={(id) => restoreResult.mutate(id)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function FlaggedTab({
  items,
  isLoading,
  onRemove,
  onRestore,
}: {
  items: FlaggedItem[];
  isLoading: boolean;
  onRemove: (flagId: string) => void;
  onRestore: (resultId: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-admin-border bg-gray-50 px-5 py-12 text-center text-sm text-gray-500">
        Loading...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-admin-border bg-gray-50 px-5 py-12 text-center text-sm text-gray-500">
        No currently flagged items.
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
          <div className="flex items-center gap-2">
            <Badge variant="warning">
              {item.flagCount} FLAG{item.flagCount > 1 ? "S" : ""}
            </Badge>
            <Badge variant={toolVariant[item.toolType]}>
              {toolLabel[item.toolType] ?? item.toolType}
            </Badge>
            {item.teamName && (
              <span className="text-xs text-gray-500">{item.teamName}</span>
            )}
          </div>
          <p className="mt-3 text-sm font-medium text-gray-900">
            {item.title}
          </p>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => onRestore(item.id)}
              className="rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
            >
              Restore
            </button>
            <button
              onClick={() => onRemove(item.id)}
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
