import { useParams, Link } from "react-router";
import { useResult, useResultContent, useResultProgress } from "@/hooks/useResults";
import { ReportHeader } from "@/components/results/ReportHeader";
import { AskResultBody } from "@/components/results/AskResultBody";
import { PollResultBody } from "@/components/results/PollResultBody";
import { SuperPollResultBody } from "@/components/results/SuperPollResultBody";
import { ReviewResultBody } from "@/components/results/ReviewResultBody";
import { ResearchResultBody } from "@/components/results/ResearchResultBody";
import { ProgressTimeline } from "@/components/roundtable/ProgressTimeline";
import { Card, CardContent } from "@/components/ui/card";
import { getResultById } from "@/data/mock-results";
import type { AskResult, PollResult, PollOption, CenturyTrendEntry, FullResult } from "@/data/mock-results";
import type { AskContentResponse, PollContentResponse, ReviewContentResponse, ResearchContentResponse } from "@/data/result-types";

export default function Result() {
  const { id } = useParams<{ id: string }>();

  // Try API first
  const isActive = (status?: string) =>
    status === "pending" || status === "processing";

  const { data: apiResult, isLoading } = useResult(id, true);
  const { data: content } = useResultContent(id, apiResult?.contentUrl ?? undefined);
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
      const isResearch = apiResult.toolType === "research";
      const isSuperPoll = apiResult.toolType === "super_poll";
      return (
        <div className="mx-auto max-w-4xl px-4 py-12 lg:px-8">
          <Link
            to="/library"
            className={`mb-8 inline-flex items-center gap-1.5 text-sm font-medium hover:underline ${isResearch ? "text-oxblood" : "text-teal"}`}
          >
            &larr; Library
          </Link>
          <Card>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 animate-pulse rounded-full ${isResearch ? "bg-oxblood" : "bg-teal"}`} />
                <h2 className="font-serif text-xl font-semibold">
                  {isResearch ? "Searching primary sources..." : "Your panel is deliberating"}
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
      const dateStr = new Date(apiResult.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      if (apiResult.toolType === "poll") {
        const pollContent = content as PollContentResponse;
        const mapped = mapPollContent(apiResult, pollContent, dateStr);

        return (
          <div className="mx-auto max-w-4xl px-4 py-12 lg:px-8">
            <ReportHeader result={mapped} resultId={apiResult.id} pdfKey={apiResult.pdfKey} teamMembers={apiResult.teamMembers} />
            <PollResultBody result={mapped} />
          </div>
        );
      }

      if (apiResult.toolType === "super_poll") {
        const pollContent = content as PollContentResponse;
        const mapped = mapPollContent(apiResult, pollContent, dateStr);
        mapped.team = apiResult.teamName ?? "All Platform Theologians";

        return (
          <div className="mx-auto max-w-4xl px-4 py-12 lg:px-8">
            <ReportHeader result={mapped} resultId={apiResult.id} pdfKey={apiResult.pdfKey} teamMembers={apiResult.teamMembers} />
            <SuperPollResultBody pollResult={mapped} rawSelections={pollContent.theologianSelections} />
          </div>
        );
      }

      if (apiResult.toolType === "review") {
        const reviewContent = content as ReviewContentResponse;
        const mapped: FullResult = {
          id: apiResult.id,
          tool: "review",
          title: apiResult.title,
          team: apiResult.teamName ?? "Panel",
          date: dateStr,
          grade: reviewContent.overallGrade,
          summary: reviewContent.summary,
          reactions: reviewContent.grades.map((g) => ({
            theologian: g.theologian,
            grade: g.grade,
            assessment: g.reaction,
            strengths: g.strengths,
            weaknesses: g.weaknesses,
          })),
        };

        return (
          <div className="mx-auto max-w-4xl px-4 py-12 lg:px-8">
            <ReportHeader result={mapped} resultId={apiResult.id} pdfKey={apiResult.pdfKey} teamMembers={apiResult.teamMembers} />
            <ReviewResultBody result={mapped} wasTruncated={reviewContent.wasTruncated} originalCharCount={reviewContent.originalCharCount} />
          </div>
        );
      }

      if (apiResult.toolType === "research") {
        const researchContent = content as ResearchContentResponse;
        const mapped: FullResult = {
          id: apiResult.id,
          tool: "research",
          title: apiResult.title,
          team: apiResult.theologianName ?? researchContent.theologianName,
          date: dateStr,
          theologianName: researchContent.theologianName,
          responseText: researchContent.responseText,
          citations: researchContent.citations.map((c) => ({
            id: c.id,
            marker: c.marker,
            source: c.sources[0]?.canonicalRef ?? "Unknown",
            originalText: c.sources[0]?.originalText ?? "",
            translation: c.sources[0]?.translation ?? "",
          })),
        };

        return (
          <div className="mx-auto max-w-4xl px-4 py-12 lg:px-8">
            <ReportHeader result={mapped} resultId={apiResult.id} pdfKey={apiResult.pdfKey} />
            <ResearchResultBody content={researchContent} />
          </div>
        );
      }

      // Default: ask
      const askContent = content as AskContentResponse;
      const mapped: AskResult = {
        id: apiResult.id,
        tool: "ask",
        title: apiResult.title,
        team: apiResult.teamName ?? "Panel",
        date: dateStr,
        summary: askContent.synthesis.comparison,
        perspectives: askContent.perspectives.map((p) => ({
          theologian: p.theologian,
          perspective: p.perspective,
          reaction: p.reaction ?? null,
        })),
      };

      return (
        <div className="mx-auto max-w-4xl px-4 py-12 lg:px-8">
          <ReportHeader result={mapped} resultId={apiResult.id} pdfKey={apiResult.pdfKey} teamMembers={apiResult.teamMembers} />
          <AskResultBody result={mapped} keyAgreements={askContent.synthesis.keyAgreements} keyDisagreements={askContent.synthesis.keyDisagreements} />
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
        {mockResult.tool === "research" && (
          <ResearchResultBody
            content={{
              tool: "research",
              question: mockResult.title,
              theologianName: mockResult.theologianName,
              theologianSlug: "",
              responseText: mockResult.responseText,
              citations: mockResult.citations.map((c) => ({
                id: c.id,
                marker: c.marker,
                claimText: c.source,
                claimType: "paraphrase" as const,
                confidence: "HIGH" as const,
                sources: [{
                  workTitle: c.source.split(",")[0] ?? c.source,
                  canonicalRef: c.source,
                  originalText: c.originalText,
                  translation: c.translation,
                }],
              })),
              metadata: { anglesProcessed: 0, totalClaims: mockResult.citations.length, evidenceItemsUsed: 0 },
            }}
          />
        )}
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

// ── Poll content mapping ────────────────────────────────────────────

function birthYearToCentury(born: number): string {
  const century = Math.ceil(born / 100);
  const suffix =
    century % 10 === 1 && century !== 11
      ? "st"
      : century % 10 === 2 && century !== 12
        ? "nd"
        : century % 10 === 3 && century !== 13
          ? "rd"
          : "th";
  return `${century}${suffix} c.`;
}

function mapPollContent(
  apiResult: { id: string; title: string; teamName: string | null; createdAt: string },
  pollContent: PollContentResponse,
  dateStr: string,
): PollResult {
  const { optionLabels, theologianSelections } = pollContent;
  const totalPolled = theologianSelections.length;

  // Aggregate option counts
  const countMap: Record<string, number> = {};
  for (const label of optionLabels) countMap[label] = 0;
  for (const s of theologianSelections) {
    countMap[s.selection] = (countMap[s.selection] ?? 0) + 1;
  }
  const options: PollOption[] = optionLabels.map((label) => ({
    label,
    count: countMap[label],
    percentage: totalPolled > 0 ? Math.round((countMap[label] / totalPolled) * 100) : 0,
  }));

  // Compute century trend from birth years
  const centuryMap: Record<string, Record<string, number>> = {};
  for (const s of theologianSelections) {
    if (s.theologian.born === null) continue;
    const century = birthYearToCentury(s.theologian.born);
    if (!centuryMap[century]) {
      centuryMap[century] = {};
      for (const label of optionLabels) centuryMap[century][label] = 0;
    }
    centuryMap[century][s.selection] = (centuryMap[century][s.selection] ?? 0) + 1;
  }
  const centuryTrend: CenturyTrendEntry[] = Object.keys(centuryMap)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .map((century) => {
      const counts = centuryMap[century];
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      return {
        era: century,
        options: optionLabels.map((label) => ({
          label,
          percentage: total > 0 ? Math.round((counts[label] / total) * 100) : 0,
        })),
      };
    });

  return {
    id: apiResult.id,
    tool: "poll",
    title: apiResult.title,
    team: apiResult.teamName ?? "Panel",
    date: dateStr,
    summary: pollContent.summary,
    totalPolled,
    options,
    centuryTrend,
    theologianSelections: theologianSelections.map((s) => ({
      theologian: {
        name: s.theologian.name,
        initials: s.theologian.initials,
        dates: s.theologian.dates,
        tradition: s.theologian.tradition,
        color: s.theologian.color,
      },
      selection: s.selection,
      justification: s.justification,
    })),
  };
}
