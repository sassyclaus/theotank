import { CorpusCard } from "./CorpusCard";
import { useResearchCorpora } from "@/hooks/useResearch";
import type { ResearchCorpus } from "@/lib/api";

interface AvailableCorporaProps {
  onSelect?: (corpus: ResearchCorpus) => void;
}

export function AvailableCorpora({ onSelect }: AvailableCorporaProps) {
  const { data: corpora, isLoading } = useResearchCorpora();

  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <h2 className="font-serif text-2xl font-semibold text-text-primary">
        Available Corpora
      </h2>
      <p className="mt-1 text-sm text-text-secondary">
        Select a theologian's corpus to begin citation-grounded research.
      </p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {isLoading ? (
          <>
            <div className="h-64 animate-pulse rounded-lg bg-surface" />
            <div className="h-64 animate-pulse rounded-lg bg-surface" />
          </>
        ) : (
          corpora?.map((corpus) => (
            <CorpusCard key={corpus.id} corpus={corpus} onSelect={onSelect} />
          ))
        )}
      </div>
    </section>
  );
}
