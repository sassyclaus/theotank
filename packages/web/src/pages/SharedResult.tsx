import { useEffect } from "react";
import { useParams } from "react-router";
import { usePublicResult } from "@/hooks/useResults";
import { SharedReportHeader } from "@/components/shared/SharedReportHeader";
import { SharedAskBody } from "@/components/shared/SharedAskBody";
import { SharedPollBody } from "@/components/shared/SharedPollBody";
import { SharedReviewBody } from "@/components/shared/SharedReviewBody";
import { GatedContentBanner } from "@/components/shared/GatedContentBanner";
import type {
  AskContentResponse,
  PollContentResponse,
  ReviewContentResponse,
} from "@/data/result-types";

export default function SharedResult() {
  const { id } = useParams<{ id: string }>();
  const { meta, content, isLoading, error } = usePublicResult(id);

  useEffect(() => {
    if (meta) {
      document.title = `${meta.title} — TheoTank`;
    }
    return () => {
      document.title = "TheoTank";
    };
  }, [meta]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-teal border-t-transparent" />
        <p className="mt-4 text-sm text-text-secondary">Loading shared result...</p>
      </div>
    );
  }

  if (error || !meta || !content) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="mb-2 font-serif text-2xl font-bold">Result Not Available</h1>
        <p className="text-text-secondary">
          This result may have been removed, is private, or does not exist.
        </p>
      </div>
    );
  }

  // Derive panel size from the individual-entry arrays (present but redacted in public JSON)
  const panelSize =
    meta.toolType === "ask"
      ? (content as AskContentResponse).perspectives.length
      : meta.toolType === "poll"
        ? (content as PollContentResponse).theologianSelections.length
        : (content as ReviewContentResponse).grades.length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <SharedReportHeader meta={meta} />

      {meta.toolType === "ask" && (
        <SharedAskBody content={content as AskContentResponse} />
      )}
      {meta.toolType === "poll" && (
        <SharedPollBody content={content as PollContentResponse} />
      )}
      {meta.toolType === "review" && (
        <SharedReviewBody content={content as ReviewContentResponse} />
      )}

      <div className="mt-8">
        <GatedContentBanner
          toolType={meta.toolType}
          panelSize={panelSize}
          resultId={meta.id}
        />
      </div>
    </div>
  );
}
