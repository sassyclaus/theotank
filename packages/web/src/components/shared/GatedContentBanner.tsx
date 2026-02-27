import { Link } from "react-router";
import { Lock } from "lucide-react";
import { SignUpButton, SignInButton, useAuth } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";

interface GatedContentBannerProps {
  toolType: "ask" | "poll" | "review";
  panelSize: number;
  resultId: string;
}

const TOOL_COPY: Record<string, (n: number) => string> = {
  ask: (n) => `${n} theologians shared their individual perspectives`,
  poll: (n) => `${n} theologians explained their individual selections`,
  review: (n) => `${n} theologians provided their individual reviews`,
};

export function GatedContentBanner({ toolType, panelSize, resultId }: GatedContentBannerProps) {
  const { isSignedIn } = useAuth();

  return (
    <div className="relative">
      {/* Gradient fade */}
      <div className="pointer-events-none h-16 bg-gradient-to-b from-transparent to-bg" />

      <div className="rounded-xl border-2 border-dashed border-text-secondary/20 bg-surface p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold/10">
          <Lock className="h-5 w-5 text-gold" />
        </div>

        <p className="mb-2 font-serif text-lg font-semibold text-text-primary">
          {TOOL_COPY[toolType](panelSize)}
        </p>

        <p className="mx-auto mb-6 max-w-md text-sm text-text-secondary">
          Sign up to view full individual responses, browse the public library, and generate
          your own results with hundreds of theologians.
        </p>

        {isSignedIn ? (
          <Link to={`/library/${resultId}`}>
            <Button variant="default" size="sm">
              View Full Result
            </Button>
          </Link>
        ) : (
          <div className="flex items-center justify-center gap-3">
            <SignUpButton mode="modal">
              <Button variant="default" size="sm" className="bg-gold hover:bg-gold/90">
                Get Started
              </Button>
            </SignUpButton>
            <SignInButton mode="modal">
              <Button variant="outline" size="sm" className="border-teal text-teal">
                Sign In
              </Button>
            </SignInButton>
          </div>
        )}
      </div>
    </div>
  );
}
