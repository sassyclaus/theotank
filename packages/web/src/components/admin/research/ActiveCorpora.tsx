import { Badge } from "@/components/admin/ui/Badge";
import { mockCorpora } from "@/data/admin/mock-research";

const liveCorpora = mockCorpora.filter((c) => c.status === "live");

export function ActiveCorpora() {
  return (
    <div className="space-y-4">
      {liveCorpora.map((corpus) => (
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
            <Badge variant="success">Live</Badge>
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

          {/* Stats */}
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-gray-500">Passages Indexed</p>
              <p className="mt-0.5 text-sm font-semibold text-gray-900">
                {corpus.totalPassages?.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Queries (30d)</p>
              <p className="mt-0.5 text-sm font-semibold text-gray-900">
                {corpus.queries30d}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Avg Citations</p>
              <p className="mt-0.5 text-sm font-semibold text-gray-900">
                {corpus.avgCitations}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Satisfaction</p>
              <p className="mt-0.5 text-sm font-semibold text-gray-900">
                {corpus.satisfaction}%
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
