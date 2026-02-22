import { Card, CardContent } from "@/components/ui/card";
import type { AskResult, ResultTheologian } from "@/data/mock-results";

interface AskResultBodyProps {
  result: AskResult;
}

export function AskResultBody({ result }: AskResultBodyProps) {
  return (
    <div>
      <h2 className="font-serif text-xl font-semibold">Panel Perspectives</h2>
      <div className="mt-4 space-y-6">
        {result.perspectives.map((p) => (
          <Card key={p.theologian.name}>
            <CardContent>
              <TheologianHeader theologian={p.theologian} />
              <p className="mt-4 text-base leading-relaxed text-text-primary">
                {p.perspective}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function TheologianHeader({ theologian }: { theologian: ResultTheologian }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
        style={{ backgroundColor: theologian.color }}
      >
        {theologian.initials}
      </div>
      <div>
        <h3 className="font-serif text-lg font-semibold">{theologian.name}</h3>
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <span>{theologian.dates}</span>
          <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium">
            {theologian.tradition}
          </span>
        </div>
      </div>
    </div>
  );
}

export { TheologianHeader };
