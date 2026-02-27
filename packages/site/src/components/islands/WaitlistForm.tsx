import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Confirmation from "./Confirmation";
import { submitWaitlistSignup } from "@/lib/api";

interface WaitlistFormProps {
  variant: "hero" | "full";
}

const toolOptions = [
  { value: "ask", label: "Ask — theologian panels on my questions" },
  { value: "poll", label: "Poll — surveying the full roster" },
  { value: "review", label: "Review — getting my content graded" },
  { value: "research", label: "Research — cited primary sources" },
];

const personaOptions = [
  { value: "creator", label: "Content creator" },
  { value: "pastor", label: "Pastor / ministry leader" },
  { value: "student", label: "Student / academic" },
  { value: "enthusiast", label: "Theology enthusiast" },
];

export default function WaitlistForm({ variant }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [toolInterest, setToolInterest] = useState<string | undefined>();
  const [persona, setPersona] = useState<string | undefined>();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    queuePosition: number;
    referralCode: string;
  } | null>(null);

  // Parse UTM and referral from URL
  const [utmParams, setUtmParams] = useState<{
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    referredBy?: string;
  }>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setUtmParams({
      utmSource: params.get("utm_source") || undefined,
      utmMedium: params.get("utm_medium") || undefined,
      utmCampaign: params.get("utm_campaign") || undefined,
      referredBy: params.get("ref") || undefined,
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    setSubmitting(true);
    try {
      const data = await submitWaitlistSignup({
        email: email.trim(),
        toolInterest,
        persona,
        ...utmParams,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Show confirmation after successful signup
  if (result) {
    return (
      <Confirmation
        queuePosition={result.queuePosition}
        referralCode={result.referralCode}
      />
    );
  }

  // Hero variant: simple inline email + button
  if (variant === "hero") {
    return (
      <form onSubmit={handleSubmit}>
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
            required
          />
          <Button type="submit" variant="gold" disabled={submitting}>
            {submitting ? "Joining..." : "Join the Waitlist"}
          </Button>
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </form>
    );
  }

  // Full variant: email + optional radios
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      {/* Tool interest */}
      <fieldset>
        <legend className="text-sm font-medium text-text-primary">
          I'm most interested in: <span className="font-normal text-text-secondary">(optional)</span>
        </legend>
        <div className="mt-2 space-y-2">
          {toolOptions.map((opt) => (
            <label key={opt.value} className="flex cursor-pointer items-center gap-2.5 text-sm text-text-secondary">
              <input
                type="radio"
                name="tool_interest"
                value={opt.value}
                checked={toolInterest === opt.value}
                onChange={(e) => setToolInterest(e.target.value)}
                className="h-4 w-4 border-text-secondary/30 text-teal focus:ring-teal/20"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Persona */}
      <fieldset>
        <legend className="text-sm font-medium text-text-primary">
          I'm a: <span className="font-normal text-text-secondary">(optional)</span>
        </legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {personaOptions.map((opt) => (
            <label key={opt.value} className="flex cursor-pointer items-center gap-2.5 text-sm text-text-secondary">
              <input
                type="radio"
                name="persona"
                value={opt.value}
                checked={persona === opt.value}
                onChange={(e) => setPersona(e.target.value)}
                className="h-4 w-4 border-text-secondary/30 text-teal focus:ring-teal/20"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>

      <Button type="submit" variant="gold" size="lg" className="w-full" disabled={submitting}>
        {submitting ? "Joining..." : "Join the Waitlist"}
      </Button>

      {error && (
        <p className="text-center text-sm text-red-600">{error}</p>
      )}
    </form>
  );
}
