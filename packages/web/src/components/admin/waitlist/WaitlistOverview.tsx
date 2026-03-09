import { StatCard } from "@/components/admin/ui/StatCard";
import type { WaitlistStats } from "@/data/admin/waitlist-types";

interface WaitlistOverviewProps {
  stats: WaitlistStats;
}

export function WaitlistOverview({ stats }: WaitlistOverviewProps) {
  const confirmRate =
    stats.total > 0 ? Math.round((stats.confirmed / stats.total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Signups" value={String(stats.total)} />
        <StatCard
          label="Confirmed Emails"
          value={String(stats.confirmed)}
          change={`${confirmRate}% of total`}
          changeType="positive"
        />
        <StatCard label="Signups Today" value={String(stats.today)} />
        <StatCard label="This Week" value={String(stats.thisWeek)} />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Referred Signups" value={String(stats.withReferral)} />
        <StatCard
          label="Questions Submitted"
          value={String(stats.withQuestion)}
        />
      </div>
    </div>
  );
}
