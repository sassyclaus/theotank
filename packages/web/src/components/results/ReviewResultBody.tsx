import { Check, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TheologianHeader } from "./AskResultBody";
import type { ReviewResult } from "@/data/mock-results";

interface ReviewResultBodyProps {
  result: ReviewResult;
}

export function ReviewResultBody({ result }: ReviewResultBodyProps) {
  return (
    <div className="space-y-8">
      {/* Grade Hero */}
      <div className="py-8 text-center">
        <div className="font-serif text-7xl font-bold text-teal lg:text-8xl">
          {result.grade}
        </div>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-text-secondary">
          {result.summary}
        </p>
      </div>

      {/* Panel Reactions */}
      <h2 className="font-serif text-xl font-semibold">Panel Reactions</h2>
      <div className="space-y-6">
        {result.reactions.map((reaction) => (
          <Card key={reaction.theologian.name}>
            <CardContent>
              <TheologianHeader theologian={reaction.theologian} />
              <p className="mt-4 text-base leading-relaxed text-text-primary">
                {reaction.assessment}
              </p>

              {reaction.strengths.length > 0 && (
                <div className="mt-4">
                  <ul className="space-y-1.5">
                    {reaction.strengths.map((s) => (
                      <li key={s} className="flex items-start gap-2 text-sm text-text-primary">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {reaction.weaknesses.length > 0 && (
                <div className="mt-3">
                  <ul className="space-y-1.5">
                    {reaction.weaknesses.map((w) => (
                      <li key={w} className="flex items-start gap-2 text-sm text-text-primary">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
