import { StatCard } from "@/components/admin/ui/StatCard";
import { mockCustomTeamStats } from "@/data/admin/mock-teams";

export function CustomTeamsOverview() {
  const stats = mockCustomTeamStats;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Created"
          value={String(stats.totalCreated)}
        />
        <StatCard
          label="Active This Month"
          value={String(stats.activeThisMonth)}
        />
        <StatCard
          label="Avg Team Size"
          value={String(stats.avgTeamSize)}
        />
        <StatCard
          label="Most Common Theologian"
          value={stats.mostCommonTheologian}
          change={`Added to ${stats.mostCommonPercent}% of custom teams`}
          changeType="neutral"
        />
      </div>
    </div>
  );
}
