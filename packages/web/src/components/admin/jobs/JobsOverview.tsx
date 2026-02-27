import { StatCard } from "@/components/admin/ui/StatCard";
import type { JobStats } from "@/data/admin/job-types";

interface JobsOverviewProps {
  stats: JobStats;
}

function formatDuration(ms: number | null): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return remaining > 0 ? `${minutes}m ${remaining}s` : `${minutes}m`;
}

export function JobsOverview({ stats }: JobsOverviewProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        label="Pending"
        value={String(stats.pending)}
        change={`${stats.processing} processing`}
        changeType="neutral"
      />
      <StatCard
        label="Completed (24h)"
        value={String(stats.completedLast24h)}
        change={`${stats.completed} total`}
        changeType="positive"
      />
      <StatCard
        label="Failed (24h)"
        value={String(stats.failedLast24h)}
        change={`${stats.failed} total`}
        changeType={stats.failedLast24h > 0 ? "negative" : "neutral"}
      />
      <StatCard
        label="Avg Duration"
        value={formatDuration(stats.avgDurationMs)}
      />
    </div>
  );
}
