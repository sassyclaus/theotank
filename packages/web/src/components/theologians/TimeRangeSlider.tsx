interface TimeRangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  step?: number;
}

export function TimeRangeSlider({
  min,
  max,
  value,
  onChange,
  step = 25,
}: TimeRangeSliderProps) {
  const [lo, hi] = value;
  const range = max - min;
  const leftPct = ((lo - min) / range) * 100;
  const rightPct = ((hi - min) / range) * 100;

  return (
    <div className="w-full">
      <div className="relative h-6">
        {/* Track background */}
        <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-surface" />
        {/* Active fill */}
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-teal"
          style={{ left: `${leftPct}%`, width: `${rightPct - leftPct}%` }}
        />
        {/* Min thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={lo}
          onChange={(e) => {
            const v = Number(e.target.value);
            onChange([Math.min(v, hi - step), hi]);
          }}
          className="range-thumb pointer-events-none absolute top-0 left-0 h-full w-full appearance-none bg-transparent"
        />
        {/* Max thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={hi}
          onChange={(e) => {
            const v = Number(e.target.value);
            onChange([lo, Math.max(v, lo + step)]);
          }}
          className="range-thumb pointer-events-none absolute top-0 left-0 h-full w-full appearance-none bg-transparent"
        />
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-text-secondary">
        <span>{min} AD</span>
        <span className="font-medium text-text-primary">
          {lo} AD &ndash; {hi === max ? "Present" : `${hi} AD`}
        </span>
        <span>{max}</span>
      </div>
    </div>
  );
}
