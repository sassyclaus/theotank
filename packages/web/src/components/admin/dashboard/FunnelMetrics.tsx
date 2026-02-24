import { funnelMetrics } from "@/data/admin/mock-dashboard";

interface FunnelStep {
  label: string;
  value: number;
  pct?: string;
}

export function FunnelMetrics() {
  const steps: FunnelStep[] = [
    { label: "Signups", value: funnelMetrics.signups },
    {
      label: "1st Submission",
      value: funnelMetrics.firstSubmission,
      pct: `${Math.round((funnelMetrics.firstSubmission / funnelMetrics.signups) * 100)}%`,
    },
    {
      label: "2nd Submission",
      value: funnelMetrics.secondSubmission,
      pct: `${Math.round((funnelMetrics.secondSubmission / funnelMetrics.signups) * 100)}%`,
    },
    {
      label: "Converted",
      value: funnelMetrics.converted,
      pct: `${Math.round((funnelMetrics.converted / funnelMetrics.signups) * 100)}%`,
    },
    {
      label: "Churned",
      value: funnelMetrics.churned,
      pct: `${Math.round((funnelMetrics.churned / funnelMetrics.signups) * 100)}%`,
    },
  ];

  return (
    <div className="rounded-lg border border-admin-border bg-white p-5">
      <h3 className="text-sm font-semibold text-gray-900">
        User Funnel (7d)
      </h3>
      <ul className="mt-3 space-y-2">
        {steps.map((step) => (
          <li
            key={step.label}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-gray-700">{step.label}</span>
            <span className="font-medium text-gray-900">
              {step.value}
              {step.pct && (
                <span className="ml-1 text-xs font-normal text-gray-400">
                  ({step.pct})
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
