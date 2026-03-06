import { Search } from "lucide-react";

interface AskPanelProps {
  question: string;
  onChange: (value: string) => void;
}

export function AskPanel({ question, onChange }: AskPanelProps) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="pointer-events-none absolute left-4 top-4">
          <Search className="h-5 w-5 text-text-secondary/50" />
        </div>
        <textarea
          value={question}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ask a theological question..."
          rows={4}
          className="w-full resize-none rounded-lg border border-surface bg-white py-3 pl-12 pr-4 text-sm text-text-primary placeholder:text-text-secondary/60 transition-colors focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
        />
      </div>
    </div>
  );
}
