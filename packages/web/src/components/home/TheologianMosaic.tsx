import { featuredTheologians } from "@/data/mock-theologians";

export function TheologianMosaic() {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {featuredTheologians.map((theologian) => (
        <div
          key={theologian.name}
          className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold text-white opacity-80 transition-opacity hover:opacity-100"
          style={{ backgroundColor: theologian.color }}
          title={theologian.name}
        >
          {theologian.initials}
        </div>
      ))}
    </div>
  );
}
