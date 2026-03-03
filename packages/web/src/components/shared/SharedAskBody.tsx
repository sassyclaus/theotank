import { Card, CardContent } from "@/components/ui/card";
import { splitParagraphs } from "@/lib/utils";
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
          <div className="space-y-3 text-base leading-relaxed text-text-secondary">
            {splitParagraphs(content.synthesis.comparison).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
