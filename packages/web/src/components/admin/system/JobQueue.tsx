import { mockJobQueue } from "@/data/admin/mock-system";
import { AlertTriangle } from "lucide-react";

export function JobQueue() {
  const { active, queued, avgProcessingTime, failed24h } = mockJobQueue;

  return (
    <div className="rounded-lg border border-admin-border bg-white p-5">
      <h3 className="text-sm font-semibold text-gray-900">Job Queue</h3>

      {/* Active / Queued counts */}
      <div className="mt-3 grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs text-gray-500">Active</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{active}</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs text-gray-500">Queued</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{queued}</p>
        </div>
      </div>

      {/* Avg processing times */}
      <div className="mt-4">
        <h4 className="mb-2 text-xs font-medium text-gray-500">
          Avg Processing Time
        </h4>
        <ul className="divide-y divide-gray-100">
          {Object.entries(avgProcessingTime).map(([tool, time]) => (
            <li
              key={tool}
              className="flex items-center justify-between py-2 text-sm"
            >
              <span className="text-gray-700">{tool}</span>
              <span className="font-medium text-gray-900">{time}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Failed count */}
      <div className="mt-4">
        <div
          className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
            failed24h > 0
              ? "bg-red-50 text-red-700"
              : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {failed24h > 0 && (
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          )}
          <span className="font-medium">
            {failed24h} failed job{failed24h !== 1 ? "s" : ""} in last 24h
          </span>
        </div>
      </div>
    </div>
  );
}
