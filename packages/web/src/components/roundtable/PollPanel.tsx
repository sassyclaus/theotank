import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PollPanelProps {
  question: string;
  options: string[];
  onQuestionChange: (value: string) => void;
  onOptionChange: (index: number, value: string) => void;
  onAddOption: () => void;
  onRemoveOption: (index: number) => void;
}

export function PollPanel({
  question,
  options,
  onQuestionChange,
  onOptionChange,
  onAddOption,
  onRemoveOption,
}: PollPanelProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-primary">
          Poll question
        </label>
        <Input
          value={question}
          onChange={(e) => onQuestionChange(e.target.value)}
          placeholder="e.g. Is sola scriptura a sufficient rule of faith?"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-primary">
          Response options
        </label>
        <div className="space-y-2">
          {options.map((option, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-medium text-text-secondary">
                {String.fromCharCode(65 + i)}
              </span>
              <Input
                value={option}
                onChange={(e) => onOptionChange(i, e.target.value)}
                placeholder={`Option ${String.fromCharCode(65 + i)}`}
              />
              {options.length > 2 && (
                <button
                  onClick={() => onRemoveOption(i)}
                  className="shrink-0 rounded-md p-1.5 text-text-secondary/60 transition-colors hover:bg-surface hover:text-text-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        {options.length < 6 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddOption}
            className="mt-2"
          >
            <Plus className="h-4 w-4" />
            Add option
          </Button>
        )}
      </div>
    </div>
  );
}
