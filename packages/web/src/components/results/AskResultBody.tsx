import { Card, CardContent } from "@/components/ui/card";
import { splitParagraphs } from "@/lib/utils";
import type { AskResult, ResultTheologian } from "@/data/mock-results";

interface AskResultBodyProps {
  result: AskResult;
  keyAgreements?: string[];
  keyDisagreements?: string[];
}

export function AskResultBody({ result, keyAgreements, keyDisagreements }: AskResultBodyProps) {
  return (
    <div className="space-y-8">
      {/* Perspective Summary */}
      <Card>
        <CardContent>
          <h2 className="mb-3 font-serif text-xl font-semibold">Perspective Summary</h2>
          <div className="space-y-3 text-base leading-relaxed text-text-secondary">
            {splitParagraphs(result.summary).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Agreements */}
      {keyAgreements && keyAgreements.length > 0 && (
        <Card>
          <CardContent>
            <h2 className="mb-3 font-serif text-xl font-semibold">Key Agreements</h2>
            <ul className="space-y-2">
              {keyAgreements.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-base leading-relaxed text-text-secondary"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Key Disagreements */}
      {keyDisagreements && keyDisagreements.length > 0 && (
        <Card>
          <CardContent>
            <h2 className="mb-3 font-serif text-xl font-semibold">Key Disagreements</h2>
            <ul className="space-y-2">
              {keyDisagreements.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-base leading-relaxed text-text-secondary"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-oxblood" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Individual Perspectives */}
      <h2 className="font-serif text-xl font-semibold">Panel Perspectives</h2>
      <div className="space-y-6">
        {result.perspectives.map((p) => (
          <Card key={p.theologian.name}>
            <CardContent>
              <TheologianHeader theologian={p.theologian} />
              <div className="mt-4 space-y-3 text-base leading-relaxed text-text-primary">
                {splitParagraphs(p.perspective).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
              {p.reaction && (
                <div className="mt-4 border-t border-surface pt-4">
                  <h4 className="mb-2 text-sm font-semibold text-text-secondary">
                    Reacting to the panel
                  </h4>
                  <div className="space-y-3 text-sm leading-relaxed text-text-secondary italic">
                    {splitParagraphs(p.reaction).map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function TheologianHeader({ theologian }: { theologian: ResultTheologian }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
        style={{ backgroundColor: theologian.color }}
      >
        {theologian.initials}
      </div>
      <div>
        <h3 className="font-serif text-lg font-semibold">{theologian.name}</h3>
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <span>{theologian.dates}</span>
          <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium">
            {theologian.tradition}
          </span>
        </div>
      </div>
    </div>
  );
}

export { TheologianHeader };
