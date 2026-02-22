import { ArrowRight } from "lucide-react";
import { similarResults } from "@/data/mock-roundtable";

export function SimilarResultsNudge() {
  return (
    <div className="animate-fade-in rounded-lg border border-teal/20 bg-teal-light p-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-teal">
        Similar results found
      </p>
      <ul className="space-y-2">
        {similarResults.map((result) => (
          <li key={result.id}>
            <button className="group flex w-full items-center justify-between text-left">
              <div>
                <p className="text-sm text-text-primary group-hover:text-teal transition-colors">
                  {result.question}
                </p>
                <p className="text-xs text-text-secondary">
                  {result.team} &middot; {result.date}
                </p>
              </div>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-text-secondary/50 group-hover:text-teal transition-colors" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
