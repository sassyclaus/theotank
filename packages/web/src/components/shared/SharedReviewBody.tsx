import { Card, CardContent } from "@/components/ui/card";
import type { ReviewContentResponse } from "@/data/result-types";

interface SharedReviewBodyProps {
  content: ReviewContentResponse;
}

export function SharedReviewBody({ content }: SharedReviewBodyProps) {
  return (
    <div className="space-y-8">
      {/* Grade Hero */}
      <Card>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-teal/10">
              <span className="font-serif text-4xl font-bold text-teal">
                {content.overallGrade}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-sm font-medium text-text-secondary">
                Overall Grade — {content.reviewFileLabel}
              </p>
              <p className="text-base leading-relaxed text-text-secondary">
                {content.summary}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
