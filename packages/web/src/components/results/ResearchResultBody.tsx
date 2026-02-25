import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ResearchContentResponse, ResearchCitationItem } from "@/data/result-types";

interface ResearchResultBodyProps {
  content: ResearchContentResponse;
}

const confidenceColors: Record<string, string> = {
  HIGH: "bg-sage/10 text-sage",
  MEDIUM: "bg-gold/10 text-gold",
  LOW: "bg-terracotta/10 text-terracotta",
};

const claimTypeBadge: Record<string, string> = {
  paraphrase: "Paraphrase",
  quote: "Direct Quote",
  inference: "Inference",
};

export function ResearchResultBody({ content }: ResearchResultBodyProps) {
  return (
    <div className="space-y-8">
      {/* Response Text with inline citations */}
      <Card>
        <CardContent>
          <span className="mb-4 inline-block rounded-full bg-oxblood/10 px-3 py-1 text-xs font-medium text-oxblood">
            {content.theologianName}
          </span>
          <div className="text-base leading-relaxed text-text-primary">
            {renderWithCitations(content.responseText)}
          </div>
        </CardContent>
      </Card>

      {/* Citation Apparatus */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <span className="rounded-full bg-oxblood/10 px-3 py-1 text-sm font-medium text-oxblood">
            Cited Sources
          </span>
          <span className="rounded-full bg-oxblood/10 px-2 py-0.5 text-xs font-medium text-oxblood">
            {content.citations.length}
          </span>
        </div>

        <div className="space-y-4">
          {content.citations.map((citation) => (
            <CitationCard key={citation.id} citation={citation} />
          ))}
        </div>
      </div>

      {/* Metadata Footer */}
      <div className="flex flex-wrap gap-4 text-xs text-text-secondary">
        <span>{content.metadata.anglesProcessed} angles processed</span>
        <span>{content.metadata.totalClaims} claims verified</span>
        <span>{content.metadata.evidenceItemsUsed} evidence items used</span>
      </div>
    </div>
  );
}

function CitationCard({ citation }: { citation: ResearchCitationItem }) {
  return (
    <Card id={`citation-${citation.marker}`}>
      <CardContent>
        <div className="flex items-start gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-oxblood/10 text-xs font-bold text-oxblood">
            {citation.marker}
          </span>
          <div className="min-w-0 flex-1">
            {/* Claim text + badges */}
            <p className="font-medium text-text-primary">{citation.claimText}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-text-secondary">
                {claimTypeBadge[citation.claimType] ?? citation.claimType}
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  confidenceColors[citation.confidence] ?? "bg-surface text-text-secondary",
                )}
              >
                {citation.confidence}
              </span>
            </div>

            {/* Source passages */}
            {citation.sources.length > 0 && (
              <div className="mt-3 space-y-3">
                {citation.sources.map((source, i) => (
                  <div key={i} className="rounded-lg bg-surface/50 p-3">
                    <p className="text-xs font-semibold text-oxblood">
                      {source.workTitle} — {source.canonicalRef}
                    </p>
                    <blockquote className="mt-1.5 border-l-2 border-oxblood/30 pl-3 text-sm italic text-text-secondary">
                      {source.originalText}
                    </blockquote>
                    <p className="mt-1.5 text-sm text-text-primary">
                      {source.translation}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function renderWithCitations(text: string) {
  const parts = text.split(/(\[\d+\])/g);
  return parts.map((part, i) => {
    const match = part.match(/^\[(\d+)\]$/);
    if (match) {
      return (
        <a
          key={i}
          href={`#citation-${match[1]}`}
          className="cursor-pointer text-oxblood hover:text-oxblood/70"
        >
          <sup className="font-semibold">{part}</sup>
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
