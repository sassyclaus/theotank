import { useState, useEffect } from "react";
import { Upload, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  useReviewFiles,
  useDeleteReviewFile,
  getMostRecentReadyFile,
} from "@/hooks/useReviewFiles";
import { ReviewFileCard } from "./ReviewFileCard";
import { ReviewFileList } from "./ReviewFileList";
import { ReviewFileUploadDialog } from "./ReviewFileUploadDialog";

interface ReviewPanelProps {
  selectedFileId: string | null;
  focusPrompt: string;
  onFileIdChange: (id: string | null) => void;
  onFocusPromptChange: (value: string) => void;
}

export function ReviewPanel({
  selectedFileId,
  focusPrompt,
  onFileIdChange,
  onFocusPromptChange,
}: ReviewPanelProps) {
  const { data: files } = useReviewFiles();
  const deleteMutation = useDeleteReviewFile();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [listExpanded, setListExpanded] = useState(false);

  // Auto-select most recent ready file if nothing selected
  useEffect(() => {
    if (!selectedFileId && files) {
      const readyFile = getMostRecentReadyFile(files);
      if (readyFile) {
        onFileIdChange(readyFile.id);
      }
    }
  }, [selectedFileId, files, onFileIdChange]);

  const selectedFile = files?.find((f) => f.id === selectedFileId);
  const hasFiles = files && files.length > 0;

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
    if (id === selectedFileId) {
      onFileIdChange(null);
    }
  };

  // ── Empty state ──────────────────────────────────────────────────
  if (!hasFiles) {
    return (
      <div className="space-y-4">
        <div
          onClick={() => setUploadOpen(true)}
          className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-surface py-10 transition-colors hover:border-teal/40 hover:bg-teal-light/50"
        >
          <Upload className="h-10 w-10 text-text-secondary/30" />
          <div className="text-center">
            <p className="text-sm font-medium text-text-primary">
              Add your first content for review
            </p>
            <p className="mt-1 text-xs text-text-secondary/60">
              Upload a document, audio, or video file
            </p>
          </div>
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

        <ReviewFileUploadDialog
          open={uploadOpen}
          onOpenChange={setUploadOpen}
        />
      </div>
    );
  }

  // ── Has files ────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-sm font-medium text-text-primary">
            Content
          </label>
          <button
            onClick={() => setUploadOpen(true)}
            className="inline-flex items-center gap-1 text-xs font-medium text-teal transition-colors hover:text-teal/80"
          >
            <Plus className="h-3.5 w-3.5" />
            Upload new
          </button>
        </div>

        {/* Selected file card */}
        {selectedFile ? (
          <div>
            <ReviewFileCard file={selectedFile} selected compact />
            <button
              onClick={() => setListExpanded(!listExpanded)}
              className="mt-1 inline-flex items-center gap-0.5 text-xs text-text-secondary transition-colors hover:text-text-primary"
            >
              {listExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  Hide files
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  Change ({files.length} file{files.length !== 1 ? "s" : ""})
                </>
              )}
            </button>
          </div>
        ) : (
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setListExpanded(!listExpanded)}
              className="w-full"
            >
              Select a file (
              {files.filter((f) => f.status === "ready").length} ready)
            </Button>
          </div>
        )}

        {/* Expandable file list */}
        {listExpanded && (
          <div className="mt-2 rounded-lg border border-surface bg-surface/30 p-2">
            <ReviewFileList
              files={files}
              selectedId={selectedFileId}
              onSelect={(id) => {
                onFileIdChange(id);
                setListExpanded(false);
              }}
              onDelete={handleDelete}
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

      <ReviewFileUploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
}
