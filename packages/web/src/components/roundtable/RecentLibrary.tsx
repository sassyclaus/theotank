import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { recentLibraryItems, modeConfig } from "@/data/mock-roundtable";

export function RecentLibrary() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <h2 className="font-serif text-2xl font-semibold text-text-primary">
        Recent from your library
      </h2>
      <p className="mt-1 text-sm text-text-secondary">
        Pick up where you left off or revisit past panel responses.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recentLibraryItems.map((item) => (
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
    </section>
  );
}
