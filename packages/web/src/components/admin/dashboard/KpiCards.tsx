import { StatCard } from "@/components/admin/ui/StatCard";
import { dashboardKpis } from "@/data/admin/mock-dashboard";

export function KpiCards() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {dashboardKpis.map((kpi) => (
        <StatCard
          key={kpi.label}
          label={kpi.label}
          value={kpi.value}
          change={kpi.change}
          changeType={kpi.changeType}
        />
      ))}
    </div>
  );
}
