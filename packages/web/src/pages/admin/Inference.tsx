import { useState } from "react";
import { useAdminInference } from "@/hooks/useAdminInference";
import { InferenceOverviewCards } from "@/components/admin/inference/InferenceOverviewCards";
import { CostByTool } from "@/components/admin/inference/CostByTool";
import { DailyCostTrend } from "@/components/admin/inference/DailyCostTrend";
import { TopUsersByCost } from "@/components/admin/inference/TopUsersByCost";
import { ModelUsage } from "@/components/admin/inference/ModelUsage";
import { ResultsFeed } from "@/components/admin/inference/ResultsFeed";
import { Tabs } from "@/components/admin/ui/Tabs";
import { cn } from "@/lib/utils";

const PERIODS = [
  { label: "7d", value: 7 },
  { label: "30d", value: 30 },
  { label: "90d", value: 90 },
] as const;

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "results", label: "Results Feed" },
];

export default function Inference() {
  const [period, setPeriod] = useState(30);
  const [activeTab, setActiveTab] = useState("overview");
  const { data, isLoading, error } = useAdminInference(period);

  return (
    <div className="space-y-6 p-6">
      {/* Period selector */}
      <div className="flex items-center gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              period === p.value
                ? "bg-admin-accent text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <Tabs tabs={TABS} activeKey={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" && (
        <>
          {isLoading && (
            <p className="text-sm text-gray-400">Loading inference data...</p>
          )}

          {error && (
            <p className="text-sm text-red-500">
              Failed to load inference data: {(error as Error).message}
            </p>
          )}

          {data && (
            <>
              <InferenceOverviewCards overview={data.overview} />
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <CostByTool data={data.byTool} />
                <DailyCostTrend data={data.dailyTrend} />
              </div>
              <TopUsersByCost data={data.topUsers} />
              <ModelUsage
                data={data.modelBreakdown}
                pricing={data.modelPricing}
              />
            </>
          )}
        </>
      )}

      {activeTab === "results" && (
        <ResultsFeed key={period} period={period} />
      )}
    </div>
  );
}
