import type { ProgressLogEntry } from "@/data/result-types";

interface ProgressTimelineProps {
  logs: ProgressLogEntry[];
  isActive: boolean;
}

export function ProgressTimeline({ logs, isActive }: ProgressTimelineProps) {
  if (logs.length === 0) {
    return (
      <div className="flex items-center gap-3 py-4">
        <div className="h-3 w-3 animate-pulse rounded-full bg-teal" />
        <span className="text-sm text-text-secondary">Waiting for panel...</span>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {logs.map((log, i) => {
        const isLatest = i === logs.length - 1;
        const isLast = i === logs.length - 1;

        return (
          <div key={log.id} className="flex gap-3">
            {/* Timeline connector */}
            <div className="flex flex-col items-center">
              <div
                className={`h-3 w-3 shrink-0 rounded-full ${
                  isLatest && isActive
                    ? "animate-pulse bg-teal"
                    : "bg-teal/60"
                }`}
              />
              {!isLast && (
                <div className="w-px flex-1 bg-teal/20" />
              )}
            </div>

            {/* Message */}
            <div className={`pb-4 ${isLatest && isActive ? "font-medium" : ""}`}>
              <p
                className={`text-sm ${
                  isLatest && isActive
                    ? "text-text-primary"
                    : "text-text-secondary"
                }`}
              >
                {log.message}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
