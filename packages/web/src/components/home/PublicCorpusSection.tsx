import { Search, ArrowRight } from "lucide-react";
import { trendingItems } from "@/data/mock-trending";

export function PublicCorpusSection() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-text-secondary">
          Or browse what others have already asked
        </p>
      </div>

      <div className="relative mx-auto mt-6 max-w-2xl">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-text-secondary/50" />
        </div>
        <input
          type="text"
          placeholder="Search 2,400+ theological results"
          className="w-full rounded-xl border border-surface bg-white py-3 pl-12 pr-4 text-sm text-text-primary shadow-sm placeholder:text-text-secondary/60 transition-all focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
        />
      </div>

      <div className="mt-8">
        <h3 className="mb-4 text-sm font-medium uppercase tracking-wide text-text-secondary">
          Trending this week
        </h3>
        <div className="divide-y divide-surface rounded-xl border border-surface bg-white">
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
      </div>
    </section>
  );
}
