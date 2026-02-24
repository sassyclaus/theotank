import { mockRoadmap } from "@/data/admin/mock-research";
import { Users } from "lucide-react";

export function Roadmap() {
  return (
    <div className="space-y-3">
      {mockRoadmap.map((corpus, index) => (
        <div
          key={corpus.id}
          className="flex items-center gap-4 rounded-lg border border-admin-border bg-white px-5 py-4"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900">
              {corpus.theologian}
            </p>
            <p className="text-xs text-gray-500">{corpus.name}</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Users className="h-3.5 w-3.5" />
            <span>{corpus.waitlist} waitlist</span>
          </div>
        </div>
      ))}
    </div>
  );
}
