import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import ShareButtons from "./ShareButtons";
import { submitFirstQuestion } from "@/lib/api";

interface ConfirmationProps {
  queuePosition: number;
  referralCode: string;
}

export default function Confirmation({ queuePosition, referralCode }: ConfirmationProps) {
  const [question, setQuestion] = useState("");
  const [questionSubmitted, setQuestionSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://theotank.com";
  const referralUrl = `${siteUrl}?ref=${referralCode}`;

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || submitting) return;

    setSubmitting(true);
    try {
      await submitFirstQuestion(referralCode, question.trim());
      setQuestionSubmitted(true);
    } catch {
      // Silently fail — non-critical
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="text-center">
      <h3 className="font-serif text-xl font-semibold text-text-primary md:text-2xl">
        You're in. Welcome to the founding cohort.
      </h3>

      <p className="mt-3 text-text-secondary">
        You're <span className="font-semibold text-teal">#{queuePosition}</span> on the list.
      </p>

      {/* Referral section */}
      <div className="mt-8 rounded-xl border border-surface bg-white p-5 text-left">
        <p className="text-sm font-medium text-text-primary">
          Move up the list
        </p>
        <p className="mt-1 text-sm text-text-secondary">
          Share your unique link and move ahead in line for every friend who joins.
        </p>

        <div className="mt-4 flex items-center gap-2 rounded-lg bg-surface px-3 py-2">
          <code className="flex-1 truncate text-xs text-text-secondary">
            {referralUrl}
          </code>
        </div>

        <div className="mt-4">
          <ShareButtons referralUrl={referralUrl} />
        </div>
      </div>

      {/* First question */}
      <div className="mt-8 rounded-xl border border-surface bg-white p-5 text-left">
        <p className="text-sm font-medium text-text-primary">
          While you wait
        </p>

        {questionSubmitted ? (
          <p className="mt-3 text-sm text-teal">
            Thanks! We're collecting these to seed the public library at launch.
          </p>
        ) : (
          <form onSubmit={handleSubmitQuestion} className="mt-3">
            <label className="text-sm text-text-secondary" htmlFor="first-question">
              Which question would you ask first?
            </label>
            <div className="mt-2 flex gap-2">
              <Input
                id="first-question"
                type="text"
                placeholder="e.g., Did the early church believe in..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                maxLength={500}
                className="flex-1"
              />
              <Button
                type="submit"
                variant="gold"
                size="sm"
                disabled={!question.trim() || submitting}
              >
                {submitting ? "..." : "Submit"}
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-text-secondary/60">
              We're collecting these to seed the public library at launch.
              The best questions will be answered by the panel and published on day one.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
