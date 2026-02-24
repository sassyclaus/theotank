import { useState } from "react";
import { Link } from "react-router";
import { Plus } from "lucide-react";
import { Tabs } from "@/components/admin/ui/Tabs";
import { NativeTeams } from "@/components/admin/teams/NativeTeams";
import { CustomTeamsOverview } from "@/components/admin/teams/CustomTeamsOverview";
import { useAdminNativeTeams } from "@/hooks/useAdminTeams";

export default function Teams() {
  const [activeTab, setActiveTab] = useState("native");
  const { data: nativeTeams } = useAdminNativeTeams();

  const tabs = [
    { key: "native", label: "Native Teams", count: nativeTeams?.length ?? 0 },
    { key: "custom", label: "User Custom Teams", count: 89 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Tabs tabs={tabs} activeKey={activeTab} onChange={setActiveTab} />
        {activeTab === "native" && (
          <Link
            to="/admin/teams/new"
            className="inline-flex items-center gap-1.5 rounded-md bg-admin-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-admin-accent/90"
          >
            <Plus className="h-4 w-4" />
            Create Team
          </Link>
        )}
      </div>

      <div className="rounded-lg border border-admin-border bg-white p-5">
        {activeTab === "native" && <NativeTeams />}
        {activeTab === "custom" && <CustomTeamsOverview />}
      </div>
    </div>
  );
}
