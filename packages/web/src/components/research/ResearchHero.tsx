import { BookOpen } from "lucide-react";

export function ResearchHero() {
  return (
    <section className="mx-auto max-w-3xl px-4 pt-16 pb-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-oxblood/10">
        <BookOpen className="h-6 w-6 text-oxblood" />
      </div>
      <h1 className="font-serif text-4xl font-bold text-text-primary">
        Research
      </h1>
      <p className="mt-3 text-lg text-text-secondary">
        Citation-grounded inquiry into primary theological sources.
      </p>
    </section>
  );
}
