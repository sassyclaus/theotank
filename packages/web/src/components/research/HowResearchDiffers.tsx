import { Card, CardContent } from "@/components/ui/card";

const citationExample = {
  question:
    "How does Aquinas distinguish the analogy of proportionality from the analogy of attribution?",
  responseExcerpt:
    'Aquinas holds that when we predicate terms like "good" or "wise" of both God and creatures, we do so neither univocally nor equivocally, but analogically. In the analogy of attribution, a term is predicated primarily of one subject and secondarily of others by reference to it — as "healthy" is said of medicine only because it causes health in the animal [1]. In the analogy of proportionality, each analogate possesses the perfection intrinsically but according to its own mode of being, so that the creature\'s goodness is to the creature as God\'s goodness is to God [2].',
  citations: [
    {
      id: "c1",
      marker: "1",
      source: "Summa Theologiae I, q. 13, a. 5, co.",
      originalText:
        "Dicendum quod in huiusmodi analogia, non est eadem ratio nominis, sicut est in univocis; nec totaliter diversa, sicut in aequivocis; sed nomen quod sic multipliciter dicitur, significat diversas proportiones ad aliquid unum.",
      translation:
        "It must be said that in this kind of analogy, the meaning of the term is not entirely the same, as in univocal predication; nor entirely different, as in equivocal predication; but the term used in these many ways signifies various proportions to some one thing.",
    },
    {
      id: "c2",
      marker: "2",
      source: "De Veritate, q. 2, a. 11, co.",
      originalText:
        "Aliquando vero nomen commune imponitur ab aliqua proportione duorum ad duo diversa, sicut sanum dicitur de medicina et urina, inquantum utrumque habet ordinem et proportionem ad sanitatem animalis.",
      translation:
        "Sometimes, however, a common term is imposed from some proportion of two things to two different things, as 'healthy' is said of medicine and of urine insofar as each has an order and proportion to the health of the animal.",
    },
  ],
};

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
