import { useState } from "react";
import { Tabs } from "@/components/admin/ui/Tabs";
import { ModerationQueue } from "@/components/admin/content/ModerationQueue";
import { PublicLibrary } from "@/components/admin/content/PublicLibrary";
import { moderationQueue } from "@/data/admin/mock-content";

const tabs = [
  { key: "moderation", label: "Moderation Queue", count: moderationQueue.length },
  { key: "library", label: "Public Library" },
  { key: "flagged", label: "Flagged" },
];

export default function Content() {
  const [activeTab, setActiveTab] = useState("moderation");

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
            <div className="rounded-lg border border-admin-border bg-gray-50 px-5 py-12 text-center text-sm text-gray-500">
              No currently flagged items.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
