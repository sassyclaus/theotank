import { useMemo } from "react";
import { useParams, Link } from "react-router";
import { ArrowLeft, BookOpen, Users } from "lucide-react";
import { getTheologianBySlug, allTheologians, ERA_RANGES } from "@/data/mock-theologians";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TraditionBadge } from "@/components/theologians/TraditionBadge";
import { TheologianCard } from "@/components/theologians/TheologianCard";

export default function TheologianDetail() {
  const { slug } = useParams<{ slug: string }>();
  const theologian = slug ? getTheologianBySlug(slug) : undefined;

  const related = useMemo(() => {
    if (!theologian) return [];
    return allTheologians
      .filter(
        (t) =>
          t.slug !== theologian.slug &&
          (t.era === theologian.era ||
            (theologian.tradition !== null && t.tradition === theologian.tradition)),
      )
      .slice(0, 4);
  }, [theologian]);

  if (!theologian) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="font-serif text-3xl font-bold">Theologian Not Found</h1>
        <p className="mt-4 text-text-secondary">
          We couldn't find the theologian you're looking for.
        </p>
        <Link
          to="/theologians"
          className="mt-6 inline-block text-sm font-medium text-teal hover:underline"
        >
          &larr; All Theologians
        </Link>
      </div>
    );
  }

  const {
    name,
    initials,
    born,
    died,
    era,
    tradition,
    color,
    bio,
    keyWorks,
    hasResearch,
    nativeTeams,
  } = theologian;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 lg:px-8">
      {/* Back link */}
      <Link
        to="/theologians"
        className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-teal hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        All Theologians
      </Link>

      {/* Profile header */}
      <div className="flex items-start gap-5">
        <div
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {initials}
        </div>
        <div>
          <h1 className="font-serif text-3xl font-bold lg:text-4xl">{name}</h1>
          <p className="mt-1 text-text-secondary">
            {born} &ndash; {died ?? "Present"}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {tradition && <TraditionBadge tradition={tradition} />}
            <span className="text-xs text-text-secondary">
              {era} Era &middot; {ERA_RANGES[era].label}
            </span>
            {hasResearch && (
              <span className="rounded-full bg-oxblood-light px-2.5 py-0.5 text-xs font-medium text-oxblood">
                Research Available
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      <p className="mt-8 leading-relaxed text-text-primary">{bio}</p>

      {/* Key Works */}
      {keyWorks.length > 0 && (
        <div className="mt-8">
          <h2 className="font-serif text-xl font-semibold">Key Works</h2>
          <ul className="mt-3 space-y-2">
            {keyWorks.map((work) => (
              <li key={work} className="flex items-center gap-2 text-sm text-text-secondary">
                <BookOpen className="h-4 w-4 shrink-0 text-teal" />
                {work}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Native Teams */}
      {nativeTeams.length > 0 && (
        <div className="mt-8">
          <h2 className="font-serif text-xl font-semibold">Groups</h2>
          <ul className="mt-3 space-y-2">
            {nativeTeams.map((team) => (
              <li key={team} className="flex items-center gap-2 text-sm text-text-secondary">
                <Users className="h-4 w-4 shrink-0 text-teal" />
                {team}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CTA card */}
      <Card className="mt-10 bg-teal-light border-teal/20">
        <CardContent className="flex flex-col items-center gap-4 py-6 text-center sm:flex-row sm:text-left">
          <div className="flex-1">
            <h3 className="font-serif text-lg font-semibold text-text-primary">
              Ask {name.split(" ")[0]} a Question
            </h3>
            <p className="mt-1 text-sm text-text-secondary">
              Convene a roundtable panel featuring {name.split(" ")[0]}'s perspective alongside other theological voices.
            </p>
          </div>
          <Button asChild>
            <Link to="/roundtable">Go to Roundtable</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Research callout */}
      {hasResearch && (
        <Card className="mt-6 border-l-4 border-l-oxblood bg-oxblood-light/30">
          <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-oxblood-light">
                <BookOpen className="h-6 w-6 text-oxblood" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-semibold text-text-primary">
                  Research Available
                </h3>
                <p className="mt-1 text-sm text-text-secondary">
                  Explore verified primary source research on {name} with inline citations.
                </p>
              </div>
            </div>
            <Button variant="research" asChild className="shrink-0">
              <Link to="/research">Explore Research</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Related Theologians */}
      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="font-serif text-xl font-semibold">Related Theologians</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {related.map((t) => (
              <TheologianCard key={t.slug} theologian={t} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
