import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useResults } from "@/hooks/useResults";
import { recentLibraryItems, modeConfig } from "@/data/mock-roundtable";
import type { RoundtableMode } from "@/data/mock-roundtable";

const ROUNDTABLE_TOOLS: RoundtableMode[] = ["ask", "poll", "review"];

export function RecentLibrary() {
  const { data: results } = useResults();

  const recentResults = results
    ?.filter((r) => ROUNDTABLE_TOOLS.includes(r.toolType as RoundtableMode))
    .slice(0, 6);

  const hasApiData = recentResults && recentResults.length > 0;

  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <h2 className="font-serif text-2xl font-semibold text-text-primary">
        Recent from your library
      </h2>
      <p className="mt-1 text-sm text-text-secondary">
        Pick up where you left off or revisit past panel responses.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {hasApiData
          ? recentResults.map((item) => {
              const dateStr = new Date(item.createdAt).toLocaleDateString(
                "en-US",
                { month: "short", day: "numeric", year: "numeric" },
              );
              const tool = item.toolType as RoundtableMode;
              return (
                <Link key={item.id} to={`/library/${item.id}`}>
                  <Card className="group cursor-pointer transition-shadow hover:shadow-md">
                    <CardContent>
                      <div className="mb-2 flex items-center gap-2">
                        <span className="rounded-full bg-teal/10 px-2.5 py-0.5 text-xs font-medium text-teal">
                          {modeConfig[tool].label}
                        </span>
                        <span className="text-xs text-text-secondary">
                          {item.teamName ?? "—"}
                        </span>
                      </div>
                      <h3 className="text-sm font-medium text-text-primary">
                        {item.title}
                      </h3>
                      {item.previewExcerpt && (
                        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-text-secondary">
                          {item.previewExcerpt}
                        </p>
                      )}
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-text-secondary/60">
                          {dateStr}
                        </span>
                        <ArrowRight className="h-4 w-4 text-text-secondary/40 transition-colors group-hover:text-teal" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })
          : recentLibraryItems.map((item) => (
              <Card
                key={item.id}
                className="group cursor-pointer transition-shadow hover:shadow-md"
              >
                <CardContent>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded-full bg-teal/10 px-2.5 py-0.5 text-xs font-medium text-teal">
                      {modeConfig[item.tool].label}
                    </span>
                    <span className="text-xs text-text-secondary">
                      {item.team}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-text-primary">
                    {item.question}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-text-secondary">
                    {item.preview}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-text-secondary/60">
                      {item.date}
                    </span>
                    <ArrowRight className="h-4 w-4 text-text-secondary/40 transition-colors group-hover:text-teal" />
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {hasApiData && (
        <div className="mt-6 text-center">
          <Link
            to="/library"
            className="text-sm font-medium text-teal hover:underline"
          >
            View all in Library →
          </Link>
        </div>
      )}
    </section>
  );
}
