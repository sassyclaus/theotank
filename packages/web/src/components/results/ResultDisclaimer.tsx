import { useState } from "react";
import { Info, X } from "lucide-react";

const DISCLAIMER_TEXT: Record<string, string> = {
  ask: "These perspectives are simulated using a large language model trained on a broad corpus of internet text and licensed data — not necessarily on every theologian's primary sources. They are not guaranteed to accurately represent each theologian's actual views. Treat these as starting points for further exploration into the theologians' true perspectives.",
  poll: "These responses are simulated using a large language model trained on a broad corpus of internet text and licensed data — not necessarily on every theologian's primary sources. They are not guaranteed to accurately represent each theologian's actual views. Treat these as starting points for further exploration into the theologians' true perspectives.",
  super_poll:
    "These responses are simulated using a large language model trained on a broad corpus of internet text and licensed data — not necessarily on every theologian's primary sources. They are not guaranteed to accurately represent each theologian's actual views. Treat these as starting points for further exploration into the theologians' true perspectives.",
  review:
    "These reviews are simulated using a large language model trained on a broad corpus of internet text and licensed data — not necessarily on every theologian's primary sources. Grades and feedback may not reflect how each theologian would actually evaluate this work. Treat these as starting points for further exploration into the theologians' true perspectives.",
  research:
    "This response is grounded in primary source texts with verified citations. While source passages are authentic, the synthesis and interpretation are AI-generated. Always consult the cited passages directly.",
};

interface ResultDisclaimerProps {
  toolType: "ask" | "poll" | "super_poll" | "review" | "research";
}

export function ResultDisclaimer({ toolType }: ResultDisclaimerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const text = DISCLAIMER_TEXT[toolType];

  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-gold/30 bg-gold-light/50 px-4 py-3">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
      <p className="flex-1 text-sm leading-relaxed text-text-primary/80">
        {text}
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded p-0.5 text-text-secondary hover:bg-gold/10 hover:text-text-primary"
        aria-label="Dismiss disclaimer"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
