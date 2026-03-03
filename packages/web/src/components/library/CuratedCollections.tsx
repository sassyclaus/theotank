import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { usePublicCollections } from "@/hooks/usePublicCollections";

// Cycle through accent colors for collection cards
const coverColors = ["border-t-teal", "border-t-gold", "border-t-oxblood"];

export function CuratedCollections() {
  const { data: collections, isLoading } = usePublicCollections();

  if (isLoading) {
    return null;
  }

  if (!collections || collections.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="font-serif text-lg font-semibold text-text-primary">
        Curated Collections
      </h3>
      <p className="mt-1 text-sm text-text-secondary">
        Themed bundles of the best community results.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((collection, i) => (
          <Card
            key={collection.id}
            className={`group cursor-pointer border-t-2 ${coverColors[i % coverColors.length]} transition-shadow hover:shadow-md`}
          >
            <CardContent>
              <h4 className="font-serif text-base font-semibold text-text-primary">
                {collection.title}
              </h4>
              {collection.description && (
                <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
                  {collection.description}
                </p>
              )}
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
