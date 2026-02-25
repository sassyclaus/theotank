import { Link } from "react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useResult, useResultProgress } from "@/hooks/useResults";
import { ProgressTimeline } from "./ProgressTimeline";

interface DeliberationViewProps {
  resultId: string;
  onReset: () => void;
  variant?: "roundtable" | "research";
}

export function DeliberationView({ resultId, onReset, variant = "roundtable" }: DeliberationViewProps) {
  const { data: result } = useResult(resultId, true);
  const { data: logs } = useResultProgress(resultId, true);

  const isActive =
    !result || result.status === "pending" || result.status === "processing";
  const isCompleted = result?.status === "completed";
  const isFailed = result?.status === "failed";

  return (
    <section className="mx-auto max-w-3xl px-4 pb-12">
      <Card>
        <CardContent className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div
              className={`h-3 w-3 rounded-full ${
                isActive
                  ? variant === "research" ? "animate-pulse bg-oxblood" : "animate-pulse bg-teal"
                  : isCompleted
                    ? variant === "research" ? "bg-oxblood" : "bg-teal"
                    : "bg-terracotta"
              }`}
            />
            <h2 className="font-serif text-xl font-semibold">
              {isActive && (variant === "research" ? "Searching primary sources..." : "Your panel is deliberating")}
              {isCompleted && "Your result is ready"}
              {isFailed && "Something went wrong"}
            </h2>
          </div>

          {/* Progress timeline */}
          <ProgressTimeline logs={logs ?? []} isActive={isActive} />

          {/* Error message */}
          {isFailed && result?.errorMessage && (
            <p className="text-sm text-terracotta">{result.errorMessage}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              size="lg"
              asChild
              disabled={!isCompleted}
              className={!isCompleted ? "pointer-events-none opacity-50" : ""}
            >
              <Link to={`/library/${resultId}`}>View Result</Link>
            </Button>
            <Button variant="outline" size="lg" onClick={onReset}>
              Start Another
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
