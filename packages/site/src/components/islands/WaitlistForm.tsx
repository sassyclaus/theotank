import { useState, useEffect } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { submitWaitlistSignup } from "@/lib/api";

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
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
        ...utmParams,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-light">
          <Mail size={24} className="text-teal" strokeWidth={1.75} />
        </div>
        <h3 className="mt-4 font-serif text-xl font-semibold text-text-primary">
          Check your email
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          We sent a confirmation link to <span className="font-medium text-text-primary">{email}</span>.
          Click it to secure your spot as <span className="font-semibold text-teal">#{result.queuePosition}</span> on the waitlist.
        </p>
        <p className="mt-4 text-xs text-text-secondary/60">
          Don't see it? Check your spam folder.
        </p>
      </div>
    );
  }

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

      <Button type="submit" variant="gold" size="lg" className="w-full" disabled={submitting}>
        {submitting ? "Joining..." : "Join the Waitlist"}
      </Button>

      {error && (
        <p className="text-center text-sm text-red-600">{error}</p>
      )}
    </form>
  );
}
