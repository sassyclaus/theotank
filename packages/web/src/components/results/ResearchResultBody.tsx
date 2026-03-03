import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { ResearchContentResponse, ResearchCitationItem } from "@/data/result-types";

interface ResearchResultBodyProps {
  content: ResearchContentResponse;
}

const claimTypeBadge: Record<string, string> = {
  paraphrase: "Paraphrase",
  quote: "Direct Quote",
  inference: "Inference",
};

export function ResearchResultBody({ content }: ResearchResultBodyProps) {
  const { markerMap, orderedCitations } = useMemo(() => {
    const citationById = new Map(
      content.citations.map((c) => [c.marker, c]),
    );
    const map = new Map<string, string>();
    const ordered: ResearchCitationItem[] = [];
    let seq = 1;

    // Scan text for markers in order of first appearance
    const regex = /\[(\d+)\]/g;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(content.responseText)) !== null) {
      const orig = m[1];
      if (map.has(orig)) continue; // already seen
      const citation = citationById.get(orig);
      if (!citation) continue; // orphan marker — will be stripped
      const newNum = String(seq++);
      map.set(orig, newNum);
      ordered.push({ ...citation, marker: newNum });
    }

    // Append any citation objects not referenced in the text
    for (const citation of content.citations) {
      if (!map.has(citation.marker)) {
        const newNum = String(seq++);
        map.set(citation.marker, newNum);
        ordered.push({ ...citation, marker: newNum });
      }
    }

    return { markerMap: map, orderedCitations: ordered };
  }, [content.responseText, content.citations]);

  return (
    <div className="space-y-8">
      {/* Response Text with inline citations */}
      <Card>
        <CardContent>
          <span className="mb-4 inline-block rounded-full bg-oxblood/10 px-3 py-1 text-xs font-medium text-oxblood">
            {content.theologianName}
          </span>
          <div className="space-y-3 text-base leading-relaxed text-text-primary">
            {renderWithCitations(content.responseText, markerMap)}
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
            {orderedCitations.length}
          </span>
        </div>

        <div className="space-y-4">
          {orderedCitations.map((citation) => (
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
    <Card id={`citation-${citation.marker}`} className="scroll-mt-20">
      <CardContent>
        <div className="flex items-start gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-oxblood/10 text-xs font-bold text-oxblood">
            {citation.marker}
          </span>
          <div className="min-w-0 flex-1">
            {/* Claim text + badge */}
            <p className="font-medium text-text-primary">{citation.claimText}</p>
            <div className="mt-1.5">
              <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-text-secondary">
                {claimTypeBadge[citation.claimType] ?? citation.claimType}
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

function renderWithCitations(text: string, markerMap: Map<string, string>) {
  // Split into paragraphs first, then process citations within each
  const paragraphs = text.split(/\n+/).filter(Boolean);
  return paragraphs.map((paragraph, pIdx) => {
    const parts = paragraph.split(/(\[\d+\])/g);
    const children = parts.map((part, i) => {
      const match = part.match(/^\[(\d+)\]$/);
      if (match) {
        const newNum = markerMap.get(match[1]);
        if (!newNum) return null;
        return (
          <a
            key={`${pIdx}-${i}`}
            href={`#citation-${newNum}`}
            className="cursor-pointer text-oxblood hover:text-oxblood/70"
          >
            <sup className="font-semibold">[{newNum}]</sup>
          </a>
        );
      }
      return <span key={`${pIdx}-${i}`}>{part}</span>;
    });
    return <p key={pIdx}>{children}</p>;
  });
}
