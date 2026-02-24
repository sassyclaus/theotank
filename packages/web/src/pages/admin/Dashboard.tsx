import { KpiCards } from "@/components/admin/dashboard/KpiCards";
import { ChartPlaceholder } from "@/components/admin/ui/ChartPlaceholder";
import { NeedsAttention } from "@/components/admin/dashboard/NeedsAttention";
import { LiveFeed } from "@/components/admin/dashboard/LiveFeed";
import { FunnelMetrics } from "@/components/admin/dashboard/FunnelMetrics";
import { ToolMix } from "@/components/admin/dashboard/ToolMix";
import { RevenueBreakdown } from "@/components/admin/dashboard/RevenueBreakdown";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* KPI row */}
      <KpiCards />

      {/* Submissions chart */}
      <div className="rounded-lg border border-admin-border bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">
          Submissions (30d)
        </h3>
        <ChartPlaceholder label="Submissions (30d)" height="h-56" />
      </div>

      {/* Attention + Live Feed */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <NeedsAttention />
        <LiveFeed />
      </div>

      {/* Funnel + Tool Mix */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FunnelMetrics />
        <ToolMix />
      </div>

      {/* Revenue */}
      <RevenueBreakdown />
    </div>
  );
}
