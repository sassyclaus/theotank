import { Search } from "lucide-react";
import { SignUpButton, SignInButton, useAuth } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { TheologianMosaic } from "./TheologianMosaic";

export function HeroSection() {
  const { isSignedIn } = useAuth();

  return (
    <section className="mx-auto max-w-3xl px-4 pt-16 pb-12 text-center lg:pt-24 lg:pb-16">
      <TheologianMosaic />

      <h1 className="mt-8 font-serif text-4xl font-bold leading-tight text-text-primary md:text-5xl lg:text-6xl">
        The greatest theological minds in history,{" "}
        <span className="italic">convened around your question.</span>
      </h1>

      <div className="mt-10">
        {isSignedIn ? (
          <>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-text-secondary/50" />
              </div>
              <input
                type="text"
                placeholder="What's on your mind?"
                className="w-full rounded-xl border border-surface bg-white py-4 pl-12 pr-4 text-base text-text-primary shadow-sm placeholder:text-text-secondary/60 transition-all focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
              />
            </div>
            <p className="mt-3 text-sm text-text-secondary">
              Try: &ldquo;Did the early church believe in penal substitutionary
              atonement?&rdquo;
            </p>
          </>
        ) : (
          <div className="flex items-center justify-center gap-4">
            <SignUpButton mode="modal">
              <Button className="bg-gold px-6 py-3 text-base font-semibold text-white hover:bg-gold/90">
                Get Started
              </Button>
            </SignUpButton>
            <SignInButton mode="modal">
              <Button
                variant="outline"
                className="border-teal px-6 py-3 text-base font-semibold text-teal hover:bg-teal-light"
              >
                Sign In
              </Button>
            </SignInButton>
          </div>
        )}
      </div>
    </section>
  );
}
