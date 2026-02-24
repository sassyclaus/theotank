import { Link } from "react-router";
import { AlertTriangle, Info } from "lucide-react";
import { attentionItems } from "@/data/admin/mock-dashboard";

export function NeedsAttention() {
  return (
    <div className="rounded-lg border border-admin-border bg-white p-5">
      <h3 className="text-sm font-semibold text-gray-900">Needs Attention</h3>
      <ul className="mt-3 space-y-3">
        {attentionItems.map((item) => (
          <li key={item.id}>
            <Link
              to={item.link}
              className="flex items-start gap-2.5 text-sm text-gray-700 hover:text-admin-accent"
            >
              {item.icon === "warning" ? (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-admin-warning" />
              ) : (
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-admin-accent" />
              )}
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
