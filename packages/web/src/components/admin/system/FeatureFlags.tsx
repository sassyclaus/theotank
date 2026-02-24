import { mockFeatureFlags } from "@/data/admin/mock-system";

export function FeatureFlags() {
  return (
    <div className="rounded-lg border border-admin-border bg-white p-5">
      <h3 className="text-sm font-semibold text-gray-900">Feature Flags</h3>
      <ul className="mt-3 divide-y divide-gray-100">
        {mockFeatureFlags.map((flag) => (
          <li
            key={flag.id}
            className="flex items-center justify-between py-3"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">
                <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono text-gray-700">
                  {flag.key}
                </code>
              </p>
              <p className="mt-0.5 text-xs text-gray-500">{flag.label}</p>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                flag.enabled
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {flag.enabled ? "ON" : "OFF"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
