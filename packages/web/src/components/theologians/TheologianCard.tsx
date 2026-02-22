import { Link } from "react-router";
import { Card } from "@/components/ui/card";
import { TraditionBadge } from "./TraditionBadge";
import type { TheologianProfile } from "@/data/mock-theologians";

interface TheologianCardProps {
  theologian: TheologianProfile;
}

export function TheologianCard({ theologian }: TheologianCardProps) {
  const { slug, name, initials, born, died, tradition, color, tagline, hasResearch } =
    theologian;

  return (
    <Link to={`/theologians/${slug}`} className="block">
      <Card className="h-full p-4 transition-shadow hover:shadow-md">
        <div className="flex items-start gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-base font-semibold leading-tight text-text-primary">
              {name}
            </h3>
            <p className="mt-0.5 text-xs text-text-secondary">
              {born} &ndash; {died ?? "Present"}
            </p>
            {tradition && (
              <div className="mt-1.5">
                <TraditionBadge tradition={tradition} />
              </div>
            )}
          </div>
        </div>
        <p className="mt-3 line-clamp-2 text-sm text-text-secondary">{tagline}</p>
        {hasResearch && (
          <span className="mt-2 inline-block rounded-full bg-oxblood-light px-2.5 py-0.5 text-xs font-medium text-oxblood">
            Research Available
          </span>
        )}
      </Card>
    </Link>
  );
}
