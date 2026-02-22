import { useEffect, useState } from "react";
import { deliberationMessages } from "@/data/mock-roundtable";

export function DeliberationOverlay() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % deliberationMessages.length);
    }, 750);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-white/90 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          <span className="h-2 w-2 animate-bounce rounded-full bg-teal [animation-delay:0ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-teal [animation-delay:150ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-teal [animation-delay:300ms]" />
        </div>
        <p className="text-sm font-medium text-text-primary">
          {deliberationMessages[messageIndex]}
        </p>
      </div>
    </div>
  );
}
