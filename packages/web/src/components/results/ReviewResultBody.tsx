import { Check, AlertTriangle, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { splitParagraphs } from "@/lib/utils";
import type { ReviewResult, ResultTheologian } from "@/data/mock-results";

interface ReviewResultBodyProps {
  result: ReviewResult;
  wasTruncated?: boolean;
  originalCharCount?: number;
}

export function ReviewResultBody({ result, wasTruncated, originalCharCount }: ReviewResultBodyProps) {
  return (
    <div className="space-y-8">
      {wasTruncated && originalCharCount && (
        <div className="flex items-start gap-2 rounded-lg border border-teal/20 bg-teal-light/50 px-4 py-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
          <p className="text-sm text-text-secondary">
            This document was trimmed to ~12 pages for review. The full document was{" "}
            {originalCharCount.toLocaleString()} characters.
          </p>
        </div>
      )}

      {/* Grade Hero */}
      <div className="py-8 text-center">
        <div className="font-serif text-7xl font-bold text-teal lg:text-8xl">
          {result.grade}
        </div>
        <div className="mx-auto mt-4 max-w-2xl space-y-3 text-lg text-text-secondary">
          {splitParagraphs(result.summary).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </div>

      {/* Panel Reactions */}
      <h2 className="font-serif text-xl font-semibold">Panel Reactions</h2>
      <div className="space-y-6">
        {result.reactions.map((reaction) => (
          <Card key={reaction.theologian.name}>
            <CardContent>
              <ReviewTheologianHeader
                theologian={reaction.theologian}
                grade={reaction.grade}
              />
              <div className="mt-4 space-y-3 text-base leading-relaxed text-text-primary">
                {splitParagraphs(reaction.assessment).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>

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

function ReviewTheologianHeader({
  theologian,
  grade,
}: {
  theologian: ResultTheologian;
  grade: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
        style={{ backgroundColor: theologian.color }}
      >
        {theologian.initials}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-serif text-lg font-semibold">{theologian.name}</h3>
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <span>{theologian.dates}</span>
          <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium">
            {theologian.tradition}
          </span>
        </div>
      </div>
      <span className="shrink-0 rounded-md border border-teal/30 px-3 py-1 font-serif text-xl font-bold text-teal">
        {grade}
      </span>
    </div>
  );
}
