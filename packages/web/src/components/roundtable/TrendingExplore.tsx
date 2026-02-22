import { ArrowRight } from "lucide-react";
import { trendingItems } from "@/data/mock-trending";

export function TrendingExplore() {
  return (
    <section className="mx-auto max-w-5xl px-4 pb-16">
      <h2 className="font-serif text-2xl font-semibold text-text-primary">
        Trending questions
      </h2>
      <p className="mt-1 text-sm text-text-secondary">
        See what others are exploring this week.
      </p>

      <div className="mt-6 divide-y divide-surface rounded-xl border border-surface bg-white">
        {trendingItems.map((item) => (
          <button
            key={item.id}
            className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-surface/50"
          >
            <div>
              <p className="text-sm font-medium text-text-primary">
                {item.question}
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                {item.tool} &middot; {item.team}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-text-secondary/50" />
          </button>
        ))}
      </div>
    </section>
  );
}
