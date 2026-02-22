import { Card, CardContent } from "@/components/ui/card";
import { citationExample } from "@/data/mock-research";

function renderWithCitations(text: string) {
  const parts = text.split(/(\[\d+\])/g);
  return parts.map((part, i) => {
    const match = part.match(/^\[(\d+)\]$/);
    if (match) {
      return (
        <sup key={i} className="mx-0.5 font-semibold text-oxblood">
          [{match[1]}]
        </sup>
      );
    }
    return part;
  });
}

export function HowResearchDiffers() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <div className="rounded-xl bg-oxblood-light/40 p-6 sm:p-8">
        <h2 className="font-serif text-2xl font-semibold text-text-primary">
          How Research differs
        </h2>

        <blockquote className="mt-4 border-l-4 border-l-oxblood pl-4 text-sm leading-relaxed text-text-secondary">
          Research responses are grounded in verified primary source texts. Every
          claim includes inline citations linking to the original Latin (or
          Greek) passage and an English translation, so you can verify the
          argument at its source.
        </blockquote>

        <Card className="mt-6">
          <CardContent>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-text-secondary">
              Example query
            </p>
            <p className="font-serif text-base font-semibold text-text-primary">
              {citationExample.question}
            </p>

            <p className="mt-4 text-sm leading-relaxed text-text-secondary">
              {renderWithCitations(citationExample.responseExcerpt)}
            </p>

            <hr className="my-5 border-surface" />

            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-text-secondary">
              Citations
            </p>
            <div className="space-y-4">
              {citationExample.citations.map((cite) => (
                <div key={cite.id}>
                  <p className="text-sm font-medium text-text-primary">
                    <span className="mr-1 font-semibold text-oxblood">
                      [{cite.marker}]
                    </span>
                    {cite.source}
                  </p>
                  <p className="mt-1 text-sm italic leading-relaxed text-text-secondary">
                    {cite.originalText}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                    {cite.translation}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
