import { toolMix } from "@/data/admin/mock-dashboard";

export function ToolMix() {
  return (
    <div className="rounded-lg border border-admin-border bg-white p-5">
      <h3 className="text-sm font-semibold text-gray-900">Tool Mix (30d)</h3>
      <ul className="mt-3 space-y-3">
        {toolMix.map((entry) => (
          <li key={entry.tool}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700">{entry.tool}</span>
              <span className="font-medium text-gray-900">
                {entry.percentage}%
              </span>
            </div>
            <div className="mt-1 h-2 w-full rounded-full bg-gray-100">
              <div
                className={`${entry.color} h-2 rounded-full`}
                style={{ width: `${entry.percentage}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
