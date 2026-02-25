import { CorpusCard } from "./CorpusCard";
import { corpora } from "@/data/mock-research";
import type { Corpus } from "@/data/mock-research";

interface AvailableCorporaProps {
  onSelect?: (corpus: Corpus) => void;
}

export function AvailableCorpora({ onSelect }: AvailableCorporaProps) {
  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <h2 className="font-serif text-2xl font-semibold text-text-primary">
        Available Corpora
      </h2>
      <p className="mt-1 text-sm text-text-secondary">
        Select a theologian's corpus to begin citation-grounded research.
      </p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {corpora.map((corpus) => (
          <CorpusCard key={corpus.id} corpus={corpus} onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
}
