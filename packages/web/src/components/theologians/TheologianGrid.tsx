import { useMemo } from "react";
import { ERAS, ERA_RANGES, TRADITION_COLORS } from "@/data/mock-theologians";
import type { TheologianProfile, Era, Tradition } from "@/data/mock-theologians";
import { TheologianCard } from "./TheologianCard";

interface TheologianGridProps {
  theologians: TheologianProfile[];
}

interface TraditionGroup {
  tradition: Tradition;
  theologians: TheologianProfile[];
}

interface EraGroup {
  era: Era;
  /** Pre-schism / null-tradition theologians shown directly under the era heading */
  ungrouped: TheologianProfile[];
  traditionGroups: TraditionGroup[];
}

export function TheologianGrid({ theologians }: TheologianGridProps) {
  const eraGroups = useMemo<EraGroup[]>(() => {
    const groups: EraGroup[] = [];

    for (const era of ERAS) {
      const inEra = theologians.filter((t) => t.era === era);
      if (inEra.length === 0) continue;

      const ungrouped: TheologianProfile[] = [];
      const tradMap = new Map<Tradition, TheologianProfile[]>();

      for (const t of inEra) {
        if (t.tradition === null) {
          ungrouped.push(t);
        } else {
          const list = tradMap.get(t.tradition) ?? [];
          list.push(t);
          tradMap.set(t.tradition, list);
        }
      }

      // Sort traditions by count (largest first)
      const traditionGroups: TraditionGroup[] = Array.from(tradMap.entries())
        .sort((a, b) => b[1].length - a[1].length)
        .map(([tradition, list]) => ({ tradition, theologians: list }));

      groups.push({ era, ungrouped, traditionGroups });
    }

    return groups;
  }, [theologians]);

  if (eraGroups.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg text-text-secondary">
          No theologians match your current filters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {eraGroups.map(({ era, ungrouped, traditionGroups }) => (
        <section key={era}>
          <div className="mb-6 border-b border-surface pb-2">
            <h2 className="font-serif text-2xl font-bold text-text-primary">
              {era} Era
            </h2>
            <p className="text-sm text-text-secondary">
              {ERA_RANGES[era].label}
            </p>
          </div>

          <div className="space-y-6">
            {/* Null-tradition theologians: flat grid, no accent bar */}
            {ungrouped.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ungrouped.map((t) => (
                  <TheologianCard key={t.slug} theologian={t} />
                ))}
              </div>
            )}

            {/* Tradition sub-groups with colored accent bars */}
            {traditionGroups.map(({ tradition, theologians: cards }) => {
              const tradColor = TRADITION_COLORS[tradition];
              return (
                <div key={tradition} className="flex gap-4">
                  <div
                    className="w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: tradColor }}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className="mb-3 text-sm font-semibold"
                      style={{ color: tradColor }}
                    >
                      {tradition}
                    </p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {cards.map((t) => (
                        <TheologianCard key={t.slug} theologian={t} />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
