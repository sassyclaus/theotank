import { useParams, Link } from "react-router";
import { useResult, useResultContent, useResultProgress } from "@/hooks/useResults";
import { ReportHeader } from "@/components/results/ReportHeader";
import { AskResultBody } from "@/components/results/AskResultBody";
import { PollResultBody } from "@/components/results/PollResultBody";
import { ReviewResultBody } from "@/components/results/ReviewResultBody";
import { ResearchResultBody } from "@/components/results/ResearchResultBody";
import { ProgressTimeline } from "@/components/roundtable/ProgressTimeline";
import { Card, CardContent } from "@/components/ui/card";
import { getResultById } from "@/data/mock-results";
import type { AskResult, FullResult } from "@/data/mock-results";
import type { AskContentResponse } from "@/data/result-types";

export default function Result() {
  const { id } = useParams<{ id: string }>();

  // Try API first
  const isActive = (status?: string) =>
    status === "pending" || status === "processing";

  const { data: apiResult, isLoading } = useResult(id, true);
  const { data: content } = useResultContent(
    id,
    apiResult?.status === "completed"
  );
  const { data: logs } = useResultProgress(
    id,
    isActive(apiResult?.status)
  );

  // Fallback to mock data for legacy IDs
  const mockResult = id ? getResultById(id) : undefined;

  // Loading state
  if (isLoading && !mockResult) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="inline-flex items-center gap-3">
          <div className="h-3 w-3 animate-pulse rounded-full bg-teal" />
          <p className="text-sm text-text-secondary">Loading result...</p>
        </div>
      </div>
    );
  }

  // API result exists — handle all states
  if (apiResult) {
    // In-progress state
    if (isActive(apiResult.status)) {
      return (
        <div className="mx-auto max-w-4xl px-4 py-12 lg:px-8">
          <Link
            to="/library"
            className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-teal hover:underline"
          >
            &larr; Library
          </Link>
          <Card>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 animate-pulse rounded-full bg-teal" />
                <h2 className="font-serif text-xl font-semibold">
                  Your panel is deliberating
                </h2>
              </div>
              <h3 className="text-lg font-medium">{apiResult.title}</h3>
              <ProgressTimeline logs={logs ?? []} isActive={true} />
            </CardContent>
          </Card>
        </div>
      );
    }

    // Failed state
    if (apiResult.status === "failed") {
      return (
        <div className="mx-auto max-w-4xl px-4 py-12 lg:px-8">
          <Link
            to="/library"
            className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-teal hover:underline"
          >
            &larr; Library
          </Link>
          <Card>
            <CardContent className="space-y-4">
              <h2 className="font-serif text-xl font-semibold">
                {apiResult.title}
              </h2>
              <p className="text-sm text-terracotta">
                This result failed to complete.
                {apiResult.errorMessage && ` ${apiResult.errorMessage}`}
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Completed — render with API content
    if (apiResult.status === "completed" && content) {
      const askContent = content as AskContentResponse;
      const mapped: AskResult = {
        id: apiResult.id,
        tool: "ask",
        title: apiResult.title,
        team: apiResult.teamName ?? "Panel",
        date: new Date(apiResult.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        summary: askContent.synthesis.comparison,
        perspectives: askContent.perspectives.map((p) => ({
          theologian: p.theologian,
          perspective: p.perspective,
        })),
      };

      return (
        <div className="mx-auto max-w-4xl px-4 py-12 lg:px-8">
          <ReportHeader result={mapped} />
          <AskResultBody result={mapped} />
        </div>
      );
    }

    // Completed but content still loading
    if (apiResult.status === "completed" && !content) {
      return (
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <div className="inline-flex items-center gap-3">
            <div className="h-3 w-3 animate-pulse rounded-full bg-teal" />
            <p className="text-sm text-text-secondary">Loading content...</p>
          </div>
        </div>
      );
    }
  }

  // Fallback to mock data
  if (mockResult) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 lg:px-8">
        <ReportHeader result={mockResult} />
        {mockResult.tool === "ask" && <AskResultBody result={mockResult} />}
        {mockResult.tool === "poll" && <PollResultBody result={mockResult} />}
        {mockResult.tool === "review" && <ReviewResultBody result={mockResult} />}
        {mockResult.tool === "research" && <ResearchResultBody result={mockResult} />}
      </div>
    );
  }

  // Not found
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 text-center">
      <h1 className="font-serif text-3xl font-bold">Result Not Found</h1>
      <p className="mt-4 text-text-secondary">
        We couldn't find the result you're looking for.
      </p>
      <Link
        to="/library"
        className="mt-6 inline-block text-sm font-medium text-teal hover:underline"
      >
        &larr; Back to Library
      </Link>
    </div>
  );
}
