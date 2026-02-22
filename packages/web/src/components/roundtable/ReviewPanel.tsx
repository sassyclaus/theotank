import { Upload, X } from "lucide-react";
import { useCallback, useRef, type DragEvent } from "react";
import { Input } from "@/components/ui/input";

interface ReviewPanelProps {
  fileName: string | null;
  focusPrompt: string;
  onFileChange: (name: string | null) => void;
  onFocusPromptChange: (value: string) => void;
}

export function ReviewPanel({
  fileName,
  focusPrompt,
  onFileChange,
  onFocusPromptChange,
}: ReviewPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) onFileChange(file.name);
    },
    [onFileChange],
  );

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
  }, []);

  const handleFileSelect = useCallback(() => {
    const file = fileInputRef.current?.files?.[0];
    if (file) onFileChange(file.name);
  }, [onFileChange]);

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-primary">
          Document
        </label>
        {fileName ? (
          <div className="flex items-center justify-between rounded-lg border border-teal/30 bg-teal-light px-4 py-3">
            <span className="text-sm text-text-primary">{fileName}</span>
            <button
              onClick={() => onFileChange(null)}
              className="rounded-md p-1 text-text-secondary/60 transition-colors hover:bg-teal/10 hover:text-text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-surface py-8 text-text-secondary transition-colors hover:border-teal/40 hover:bg-teal-light/50"
          >
            <Upload className="h-8 w-8 text-text-secondary/40" />
            <p className="text-sm">
              Drop a file here or{" "}
              <span className="font-medium text-teal">browse</span>
            </p>
            <p className="text-xs text-text-secondary/60">
              PDF, DOCX, or TXT up to 10 MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-primary">
          Focus prompt{" "}
          <span className="font-normal text-text-secondary">(optional)</span>
        </label>
        <Input
          value={focusPrompt}
          onChange={(e) => onFocusPromptChange(e.target.value)}
          placeholder="e.g. Focus on the soteriology in chapter 3"
        />
      </div>
    </div>
  );
}
