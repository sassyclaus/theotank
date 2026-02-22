import { Card, CardContent } from "@/components/ui/card";
import type { ResearchResult } from "@/data/mock-results";

interface ResearchResultBodyProps {
  result: ResearchResult;
}

export function ResearchResultBody({ result }: ResearchResultBodyProps) {
  return (
    <div className="space-y-8">
      {/* Response Text with inline citations */}
      <Card>
        <CardContent>
          <span className="mb-4 inline-block rounded-full bg-oxblood/10 px-3 py-1 text-xs font-medium text-oxblood">
            {result.theologianName}
          </span>
          <div className="text-base leading-relaxed text-text-primary">
            {renderWithCitations(result.responseText)}
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
            {result.citations.length}
          </span>
        </div>

        <div className="space-y-4">
          {result.citations.map((citation) => (
            <Card key={citation.id} id={`citation-${citation.marker}`}>
              <CardContent>
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-oxblood/10 text-xs font-bold text-oxblood">
                    {citation.marker}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-text-primary">
                      {citation.source}
                    </p>
                    <blockquote className="mt-2 border-l-2 border-oxblood/30 pl-4 text-sm italic text-text-secondary">
                      {citation.originalText}
                    </blockquote>
                    <p className="mt-2 text-sm text-text-primary">
                      {citation.translation}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
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
