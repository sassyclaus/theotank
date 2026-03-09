import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ResearchCorpus } from "@/lib/api";

interface CorpusCardProps {
  corpus: ResearchCorpus;
  onSelect?: (corpus: ResearchCorpus) => void;
}

export function CorpusCard({ corpus, onSelect }: CorpusCardProps) {
  const isAvailable = corpus.available;
  const cta = isAvailable
    ? `Ask ${corpus.theologianName.split(" ").pop()} →`
    : "Coming Soon";

  return (
    <Card
      className={cn(
        "border-t-2",
        isAvailable ? "border-t-oxblood" : "border-t-text-secondary/20 opacity-60",
      )}
    >
      <CardContent>
        <div className="mb-4 flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
              !isAvailable && "bg-text-secondary/20 text-text-secondary",
            )}
            style={isAvailable ? { backgroundColor: corpus.color } : undefined}
          >
            {corpus.initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">
              {corpus.theologianName}
            </p>
            <p className="text-xs text-text-secondary">{corpus.corpusName}</p>
          </div>
          {!isAvailable && (
            <span className="ml-auto rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-text-secondary">
              Coming Soon
            </span>
          )}
        </div>

        <p className="mb-4 text-sm leading-relaxed text-text-secondary">
          {corpus.description}
        </p>

        <Button
          variant={isAvailable ? "research" : "outline"}
          className="w-full"
          disabled={!isAvailable}
          onClick={isAvailable && onSelect ? () => onSelect(corpus) : undefined}
        >
          {cta}
        </Button>
      </CardContent>
    </Card>
  );
}
