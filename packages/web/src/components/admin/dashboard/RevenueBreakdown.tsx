import { revenueBreakdown } from "@/data/admin/mock-dashboard";

export function RevenueBreakdown() {
  return (
    <div className="rounded-lg border border-admin-border bg-white p-5">
      <h3 className="text-sm font-semibold text-gray-900">
        Revenue Breakdown
      </h3>
      <div className="mt-3">
        <div className="grid grid-cols-3 border-b border-gray-100 pb-2 text-xs font-medium text-gray-500">
          <span>Tier</span>
          <span className="text-right">Price</span>
          <span className="text-right">Users</span>
        </div>
        <ul className="divide-y divide-gray-50">
          {revenueBreakdown.map((tier) => (
            <li
              key={tier.tier}
              className="grid grid-cols-3 py-2.5 text-sm"
            >
              <span className="font-medium text-gray-900">{tier.tier}</span>
              <span className="text-right text-gray-700">{tier.price}</span>
              <span className="text-right text-gray-700">
                {tier.users.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
