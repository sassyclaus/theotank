import { mockApiStatus } from "@/data/admin/mock-system";
import type { ApiStatusItem } from "@/data/admin/mock-system";

const statusDot: Record<ApiStatusItem["status"], string> = {
  operational: "bg-emerald-500",
  degraded: "bg-amber-500",
  down: "bg-red-500",
};

const statusLabel: Record<ApiStatusItem["status"], string> = {
  operational: "Operational",
  degraded: "Degraded",
  down: "Down",
};

export function ApiStatus() {
  return (
    <div className="rounded-lg border border-admin-border bg-white p-5">
      <h3 className="text-sm font-semibold text-gray-900">API Status</h3>
      <ul className="mt-3 divide-y divide-gray-100">
        {mockApiStatus.map((item) => (
          <li
            key={item.name}
            className="flex items-center justify-between py-2.5"
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${statusDot[item.status]}`}
              />
              <span className="text-sm text-gray-700">{item.name}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {item.detail && <span>{item.detail}</span>}
              <span className="text-gray-400">{statusLabel[item.status]}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
