import { Link } from "react-router";
import { ArrowRight, BookMarked } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useResults } from "@/hooks/useResults";
import { recentResearchItems } from "@/data/mock-research";

export function RecentResearchQueries() {
  const { data: results } = useResults();

  // Filter to research results, take latest 5
  const researchResults = results
    ?.filter((r) => r.toolType === "research")
    .slice(0, 5);

  // Use API data if available, fall back to mock data
  const hasApiData = researchResults && researchResults.length > 0;

  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <h2 className="font-serif text-2xl font-semibold text-text-primary">
        Recent research queries
      </h2>
      <p className="mt-1 text-sm text-text-secondary">
        Pick up where you left off or revisit past research.
      </p>

      <div className="mt-6 space-y-3">
        {hasApiData
          ? researchResults.map((item) => {
              const dateStr = new Date(item.createdAt).toLocaleDateString(
                "en-US",
                { month: "short", day: "numeric", year: "numeric" },
              );
              const preview = item.previewData as { citedSourcesCount?: number } | null;
              return (
                <Link key={item.id} to={`/library/${item.id}`}>
                  <Card className="group cursor-pointer transition-shadow hover:shadow-md">
                    <CardContent className="flex items-center gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-medium text-text-primary">
                          {item.title}
                        </h3>
                        <div className="mt-1.5 flex flex-wrap items-center gap-3">
                          <span className="text-xs text-text-secondary">
                            {item.theologianName ?? "Unknown"}
                          </span>
                          <span className="text-xs text-text-secondary/60">
                            {dateStr}
                          </span>
                          {preview?.citedSourcesCount != null && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-oxblood-light px-2.5 py-0.5 text-xs font-medium text-oxblood">
                              <BookMarked className="h-3 w-3" />
                              {preview.citedSourcesCount} cited sources
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-text-secondary/40 transition-colors group-hover:text-oxblood" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })
          : recentResearchItems.map((item) => (
              <Card
                key={item.id}
                className="group cursor-pointer transition-shadow hover:shadow-md"
              >
                <CardContent className="flex items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-text-primary">
                      {item.question}
                    </h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-3">
                      <span className="text-xs text-text-secondary">
                        {item.theologianName}
                      </span>
                      <span className="text-xs text-text-secondary/60">
                        {item.date}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-oxblood-light px-2.5 py-0.5 text-xs font-medium text-oxblood">
                        <BookMarked className="h-3 w-3" />
                        {item.citedSourcesCount} cited sources
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-text-secondary/40 transition-colors group-hover:text-oxblood" />
                </CardContent>
              </Card>
            ))}
      </div>

      <div className="mt-6 text-center">
        <Link
          to="/library"
          className="text-sm font-medium text-oxblood hover:underline"
        >
          View in Library →
        </Link>
      </div>
    </section>
  );
}
