import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { curatedCollections } from "@/data/mock-library";

export function CuratedCollections() {
  return (
    <div>
      <h3 className="font-serif text-lg font-semibold text-text-primary">
        Curated Collections
      </h3>
      <p className="mt-1 text-sm text-text-secondary">
        Themed bundles of the best community results.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {curatedCollections.map((collection) => (
          <Card
            key={collection.id}
            className={`group cursor-pointer border-t-2 ${collection.coverColor} transition-shadow hover:shadow-md`}
          >
            <CardContent>
              <h4 className="font-serif text-base font-semibold text-text-primary">
                {collection.title}
              </h4>
              <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
                {collection.description}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-text-secondary/60">
                  {collection.resultCount} results
                </span>
                <ArrowRight className="h-4 w-4 text-text-secondary/40 transition-colors group-hover:text-gold" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
