import { useState, useEffect } from "react";
import { MessageCircle, BarChart3, ClipboardCheck, BookOpen, Mic, GraduationCap, Church, Sparkles, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { submitWaitlistSignup } from "@/lib/api";

const toolOptions = [
  { value: "ask", label: "Ask", description: "Theologian panels on your questions", icon: MessageCircle },
  { value: "poll", label: "Poll", description: "Survey the full roster", icon: BarChart3 },
  { value: "review", label: "Review", description: "Get your content graded", icon: ClipboardCheck },
  { value: "research", label: "Research", description: "Cited primary sources", icon: BookOpen },
];

const personaOptions = [
  { value: "creator", label: "Content creator", icon: Mic },
  { value: "pastor", label: "Pastor / ministry", icon: Church },
  { value: "student", label: "Student / academic", icon: GraduationCap },
  { value: "enthusiast", label: "Enthusiast", icon: Sparkles },
];

export default function WaitlistForm() {
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

      {/* Tool interest */}
      <fieldset>
        <legend className="text-sm font-medium text-text-primary">
          I'm most interested in: <span className="font-normal text-text-secondary">(optional)</span>
        </legend>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {toolOptions.map((opt) => {
            const Icon = opt.icon;
            const selected = toolInterest === opt.value;
            return (
              <label
                key={opt.value}
                className={`relative flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-4 text-center transition-all ${
                  selected
                    ? "border-teal bg-teal-light shadow-sm"
                    : "border-surface bg-white hover:border-text-secondary/20 hover:shadow-sm"
                }`}
              >
                <input
                  type="radio"
                  name="tool_interest"
                  value={opt.value}
                  checked={selected}
                  onChange={(e) => setToolInterest(e.target.value)}
                  className="sr-only"
                />
                <Icon
                  size={22}
                  className={selected ? "text-teal" : "text-text-secondary/60"}
                  strokeWidth={1.75}
                />
                <span className={`text-sm font-semibold ${selected ? "text-teal" : "text-text-primary"}`}>
                  {opt.label}
                </span>
                <span className="text-xs leading-tight text-text-secondary">
                  {opt.description}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Persona */}
      <fieldset>
        <legend className="text-sm font-medium text-text-primary">
          I'm a: <span className="font-normal text-text-secondary">(optional)</span>
        </legend>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {personaOptions.map((opt) => {
            const Icon = opt.icon;
            const selected = persona === opt.value;
            return (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-center gap-2.5 rounded-xl border-2 px-4 py-3 transition-all ${
                  selected
                    ? "border-teal bg-teal-light shadow-sm"
                    : "border-surface bg-white hover:border-text-secondary/20 hover:shadow-sm"
                }`}
              >
                <input
                  type="radio"
                  name="persona"
                  value={opt.value}
                  checked={selected}
                  onChange={(e) => setPersona(e.target.value)}
                  className="sr-only"
                />
                <Icon
                  size={18}
                  className={selected ? "text-teal" : "text-text-secondary/60"}
                  strokeWidth={1.75}
                />
                <span className={`text-sm font-medium ${selected ? "text-teal" : "text-text-primary"}`}>
                  {opt.label}
                </span>
              </label>
            );
          })}
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
