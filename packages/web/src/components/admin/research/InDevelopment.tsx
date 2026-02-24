import { Badge } from "@/components/admin/ui/Badge";
import { mockCorpora } from "@/data/admin/mock-research";

const processingCorpora = mockCorpora.filter((c) => c.status === "processing");

export function InDevelopment() {
  return (
    <div className="space-y-4">
      {processingCorpora.map((corpus) => (
        <div
          key={corpus.id}
          className="rounded-lg border border-admin-border bg-white p-5"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {corpus.theologian}
              </h3>
              <p className="mt-0.5 text-sm text-gray-500">{corpus.name}</p>
            </div>
            <Badge variant="warning">Processing</Badge>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Progress</span>
              <span className="font-medium text-gray-900">
                {corpus.progress}%
              </span>
            </div>
            <div className="mt-1 h-2 w-full rounded-full bg-gray-100">
              <div
                className="h-2 rounded-full bg-admin-accent"
                style={{ width: `${corpus.progress}%` }}
              />
            </div>
          </div>

          {/* ETA + Waitlist */}
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-gray-500">ETA</p>
              <p className="mt-0.5 text-sm font-semibold text-gray-900">
                {corpus.eta}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Waitlist</p>
              <p className="mt-0.5 text-sm font-semibold text-gray-900">
                {corpus.waitlist} users
              </p>
            </div>
          </div>

          {/* Sources */}
          <div className="mt-3">
            <p className="text-xs font-medium text-gray-500">Sources</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {corpus.sources.map((source) => (
                <span
                  key={source}
                  className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                >
                  {source}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
