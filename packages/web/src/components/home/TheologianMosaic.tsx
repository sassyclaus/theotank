import { mosaicRowOne, mosaicRowTwo, type Theologian } from "@/data/mock-theologians";

function Avatar({ theologian }: { theologian: Theologian }) {
  return (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white opacity-80"
      style={{ backgroundColor: theologian.color }}
      title={theologian.name}
    >
      {theologian.initials}
    </div>
  );
}

function MarqueeRow({
  theologians,
  direction,
}: {
  theologians: Theologian[];
  direction: "left" | "right";
}) {
  // Duplicate the list for seamless looping
  const items = [...theologians, ...theologians];

  return (
    <div className="overflow-hidden">
      <div
        className={`flex w-max gap-3 ${direction === "left" ? "animate-marquee-left" : "animate-marquee-right"}`}
      >
        {items.map((t, i) => (
          <Avatar key={`${t.name}-${i}`} theologian={t} />
        ))}
      </div>
    </div>
  );
}

export function TheologianMosaic() {
  return (
    <div className="relative mx-auto max-w-2xl">
      {/* Fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-bg to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-bg to-transparent" />

      <div className="flex flex-col gap-3">
        <MarqueeRow theologians={mosaicRowOne} direction="left" />
        <MarqueeRow theologians={mosaicRowTwo} direction="right" />
      </div>
    </div>
  );
}
