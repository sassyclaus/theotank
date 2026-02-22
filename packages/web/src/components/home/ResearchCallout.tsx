import { BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ResearchCallout() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-6">
      <Card className="border-l-4 border-l-oxblood bg-oxblood-light/30">
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-oxblood-light">
              <BookOpen className="h-6 w-6 text-oxblood" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-semibold text-text-primary">
                Research
              </h3>
              <p className="mt-1 text-sm text-text-secondary">
                Verified primary source research with inline citations.
                Currently available: Thomas Aquinas. Calvin&apos;s Institutes
                coming soon.
              </p>
            </div>
          </div>
          <Button variant="research" className="shrink-0">
            Explore Research
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
