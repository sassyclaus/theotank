import { useParams, Link } from "react-router";
import { getResultById } from "@/data/mock-results";
import { ReportHeader } from "@/components/results/ReportHeader";
import { AskResultBody } from "@/components/results/AskResultBody";
import { PollResultBody } from "@/components/results/PollResultBody";
import { ReviewResultBody } from "@/components/results/ReviewResultBody";
import { ResearchResultBody } from "@/components/results/ResearchResultBody";

export default function Result() {
  const { id } = useParams<{ id: string }>();
  const result = id ? getResultById(id) : undefined;

  if (!result) {
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 lg:px-8">
      <ReportHeader result={result} />
      {result.tool === "ask" && <AskResultBody result={result} />}
      {result.tool === "poll" && <PollResultBody result={result} />}
      {result.tool === "review" && <ReviewResultBody result={result} />}
      {result.tool === "research" && <ResearchResultBody result={result} />}
    </div>
  );
}
