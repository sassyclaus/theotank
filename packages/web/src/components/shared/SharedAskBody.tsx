import { Card, CardContent } from "@/components/ui/card";
import type { AskContentResponse } from "@/data/result-types";

interface SharedAskBodyProps {
  content: AskContentResponse;
}

export function SharedAskBody({ content }: SharedAskBodyProps) {
  return (
    <div className="space-y-8">
      {/* Perspective Summary */}
      <Card>
        <CardContent>
          <h2 className="mb-3 font-serif text-xl font-semibold">
            Perspective Summary
          </h2>
          <p className="text-base leading-relaxed text-text-secondary">
            {content.synthesis.comparison}
          </p>
        </CardContent>
      </Card>

      {/* Key Agreements */}
      {content.synthesis.keyAgreements.length > 0 && (
        <Card>
          <CardContent>
            <h2 className="mb-3 font-serif text-xl font-semibold">
              Key Agreements
            </h2>
            <ul className="space-y-2">
              {content.synthesis.keyAgreements.map((item, i) => (
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
      {content.synthesis.keyDisagreements.length > 0 && (
        <Card>
          <CardContent>
            <h2 className="mb-3 font-serif text-xl font-semibold">
              Key Disagreements
            </h2>
            <ul className="space-y-2">
              {content.synthesis.keyDisagreements.map((item, i) => (
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
    </div>
  );
}
