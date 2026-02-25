import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCreateResult } from "@/hooks/useResults";
import { getTheologian } from "@/lib/api";

interface ResearchWorkspaceProps {
  theologianSlug: string;
  theologianName: string;
  onBack: () => void;
  onSubmit: (resultId: string) => void;
}

export function ResearchWorkspace({
  theologianSlug,
  theologianName,
  onBack,
  onSubmit,
}: ResearchWorkspaceProps) {
  const [question, setQuestion] = useState("");
  const createResult = useCreateResult();

  // Resolve slug → theologian ID
  const { data: theologian } = useQuery({
    queryKey: ["theologians", "detail", theologianSlug],
    queryFn: () => getTheologian(theologianSlug),
  });

  const handleSubmit = async () => {
    if (!question.trim() || !theologian?.id) return;
    try {
      const result = await createResult.mutateAsync({
        toolType: "research",
        theologianId: theologian.id,
        question: question.trim(),
      });
      onSubmit(result.id);
    } catch {
      // Error handled by mutation state
    }
  };

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <button
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-oxblood hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to corpora
      </button>

      <Card className="border-t-2 border-t-oxblood">
        <CardContent className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-oxblood/10">
              <BookOpen className="h-5 w-5 text-oxblood" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-semibold text-text-primary">
                Research Query
              </h2>
              <span className="inline-block rounded-full bg-oxblood/10 px-2.5 py-0.5 text-xs font-medium text-oxblood">
                {theologianName}
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="research-question"
              className="mb-2 block text-sm font-medium text-text-primary"
            >
              Your question
            </label>
            <textarea
              id="research-question"
              rows={4}
              className="w-full rounded-lg border border-text-secondary/20 bg-white px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-oxblood focus:ring-1 focus:ring-oxblood focus:outline-none"
              placeholder={`Ask ${theologianName} a theological question...`}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <p className="mt-1.5 text-xs text-text-secondary">
              Your question will be researched against the primary source corpus
              with inline citations to the original text.
            </p>
          </div>

          {createResult.isError && (
            <p className="text-sm text-terracotta">
              Failed to submit research query. Please try again.
            </p>
          )}

          <Button
            variant="research"
            size="lg"
            className="w-full"
            disabled={!question.trim() || createResult.isPending || !theologian?.id}
            onClick={handleSubmit}
          >
            {createResult.isPending ? (
              "Submitting..."
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search Corpus
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
