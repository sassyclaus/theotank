import { useEffect, useRef } from "react";
import { useParams, Link } from "react-router";
import { CheckCircle2, AlertCircle, RotateCcw, Download, ArrowLeft } from "lucide-react";
import { useResult, useCreatePdfJob, usePdfStatus } from "@/hooks/useResults";
import { downloadPdf } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PdfGeneration() {
  const { id } = useParams<{ id: string }>();
  const { data: result, isLoading: resultLoading } = useResult(id);
  const createPdf = useCreatePdfJob();
  const hasTriggered = useRef(false);
  const hasDownloaded = useRef(false);

  // If result already has a pdfKey, download immediately
  const alreadyCached = result?.pdfKey != null;

  // Poll for status once job is triggered
  const shouldPoll =
    !alreadyCached &&
    (createPdf.isSuccess || createPdf.isPending);
  const { data: pdfStatus } = usePdfStatus(id, shouldPoll);

  const isCompleted =
    alreadyCached ||
    pdfStatus?.status === "completed";
  const isFailed = pdfStatus?.status === "failed";
  const isGenerating =
    !alreadyCached &&
    !isCompleted &&
    !isFailed &&
    !resultLoading;

  // Auto-trigger PDF job on mount
  useEffect(() => {
    if (!id || !result || hasTriggered.current) return;
    if (result.status !== "completed") return;

    hasTriggered.current = true;

    if (result.pdfKey) {
      // Already cached — download directly
      downloadPdf(id);
    } else {
      createPdf.mutate(id);
    }
  }, [id, result]);

  // Auto-download when PDF becomes ready
  useEffect(() => {
    if (!id || hasDownloaded.current) return;
    if (pdfStatus?.status === "completed") {
      hasDownloaded.current = true;
      downloadPdf(id);
    }
  }, [id, pdfStatus?.status]);

  const handleRetry = () => {
    if (!id) return;
    hasDownloaded.current = false;
    createPdf.mutate(id);
  };

  const handleDownloadAgain = () => {
    if (!id) return;
    downloadPdf(id);
  };

  // Loading
  if (resultLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="inline-flex items-center gap-3">
          <div className="h-3 w-3 animate-pulse rounded-full bg-teal" />
          <p className="text-sm text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  // Result not found
  if (!result) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-serif text-2xl font-bold">Result Not Found</h1>
        <Link
          to="/library"
          className="mt-4 inline-block text-sm font-medium text-teal hover:underline"
        >
          &larr; Back to Library
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 lg:px-8">
      <Link
        to={`/library/${id}`}
        className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-teal hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Result
      </Link>

      <Card>
        <CardContent className="space-y-6 py-10 text-center">
          {/* Generating state */}
          {isGenerating && (
            <>
              <div className="flex justify-center">
                <div className="h-4 w-4 animate-pulse rounded-full bg-teal" />
              </div>
              <h2 className="font-serif text-xl font-semibold">
                Generating your PDF...
              </h2>
              <p className="text-sm text-text-secondary">{result.title}</p>
              <p className="text-xs text-text-secondary/70">
                This usually takes a few seconds.
              </p>
            </>
          )}

          {/* Success state */}
          {isCompleted && (
            <>
              <div className="flex justify-center">
                <CheckCircle2 className="h-10 w-10 text-teal" />
              </div>
              <h2 className="font-serif text-xl font-semibold">
                Your PDF is ready
              </h2>
              <p className="text-sm text-text-secondary">{result.title}</p>
              <div className="flex justify-center gap-3">
                <Button onClick={handleDownloadAgain}>
                  <Download className="h-4 w-4" />
                  Download Again
                </Button>
                <Button variant="outline" asChild>
                  <Link to={`/library/${id}`}>Back to Result</Link>
                </Button>
              </div>
            </>
          )}

          {/* Error state */}
          {isFailed && (
            <>
              <div className="flex justify-center">
                <AlertCircle className="h-10 w-10 text-terracotta" />
              </div>
              <h2 className="font-serif text-xl font-semibold text-terracotta">
                PDF generation failed
              </h2>
              {pdfStatus?.errorMessage && (
                <p className="text-sm text-text-secondary">
                  {pdfStatus.errorMessage}
                </p>
              )}
              <div className="flex justify-center gap-3">
                <Button onClick={handleRetry}>
                  <RotateCcw className="h-4 w-4" />
                  Try Again
                </Button>
                <Button variant="outline" asChild>
                  <Link to={`/library/${id}`}>Back to Result</Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
