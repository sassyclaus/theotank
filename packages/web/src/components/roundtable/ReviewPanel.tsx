import { useState } from "react";
import { Upload, FileText, ClipboardPaste, FolderOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  useReviewFiles,
  useDeleteReviewFile,
  usePasteReviewFile,
} from "@/hooks/useReviewFiles";
import { ReviewFileCard } from "./ReviewFileCard";
import { ReviewFileList } from "./ReviewFileList";
import { ReviewFileUploadDialog } from "./ReviewFileUploadDialog";

type ContentMode = "upload" | "paste";

interface ReviewPanelProps {
  selectedFileId: string | null;
  focusPrompt: string;
  title: string;
  description: string;
  pastedFileId: string | null;
  onFileIdChange: (id: string | null) => void;
  onFocusPromptChange: (value: string) => void;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onPastedFileIdChange: (id: string | null) => void;
}

export function ReviewPanel({
  selectedFileId,
  focusPrompt,
  title,
  description,
  pastedFileId,
  onFileIdChange,
  onFocusPromptChange,
  onTitleChange,
  onDescriptionChange,
  onPastedFileIdChange,
}: ReviewPanelProps) {
  const { data: files } = useReviewFiles();
  const deleteMutation = useDeleteReviewFile();
  const pasteMutation = usePasteReviewFile();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  const [contentMode, setContentMode] = useState<ContentMode>("upload");
  const [pasteText, setPasteText] = useState("");
  const [pasteLabel, setPasteLabel] = useState("");

  const selectedFile = files?.find((f) => f.id === selectedFileId);
  const hasFiles = files && files.length > 0;
  const readyCount = files?.filter((f) => f.status === "ready").length ?? 0;

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
    if (id === selectedFileId) {
      onFileIdChange(null);
    }
    if (id === pastedFileId) {
      onPastedFileIdChange(null);
    }
  };

  const handlePasteSave = async () => {
    if (!pasteText.trim() || !pasteLabel.trim()) return;
    const result = await pasteMutation.mutateAsync({
      text: pasteText,
      label: pasteLabel.trim(),
    });
    onFileIdChange(result.id);
    onPastedFileIdChange(result.id);
    setPasteText("");
    setPasteLabel("");
    setContentMode("upload");
  };

  // ── Content mode tabs ──────────────────────────────────────────────
  const modeToggle = (
    <div className="flex gap-1 rounded-lg bg-surface/60 p-1">
      <button
        onClick={() => setContentMode("upload")}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
          contentMode === "upload"
            ? "bg-white text-text-primary shadow-sm"
            : "text-text-secondary hover:text-text-primary"
        }`}
      >
        <Upload className="h-3.5 w-3.5" />
        File
      </button>
      <button
        onClick={() => setContentMode("paste")}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
          contentMode === "paste"
            ? "bg-white text-text-primary shadow-sm"
            : "text-text-secondary hover:text-text-primary"
        }`}
      >
        <ClipboardPaste className="h-3.5 w-3.5" />
        Paste Text
      </button>
    </div>
  );

  // ── Title + Description + Focus prompt fields (at the bottom) ───────
  const bottomFields = (
    <div className="space-y-3">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-primary">
          Review title
        </label>
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="e.g. Sunday Sermon on John 3:16"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-primary">
          Description{" "}
          <span className="font-normal text-text-secondary">(optional)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Describe what you're submitting — a sermon draft, thesis chapter, blog post, etc."
          rows={3}
          className="w-full rounded-md border border-text-secondary/20 bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
        />
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

  // ── File content area ──────────────────────────────────────────────
  const fileContentArea = selectedFile ? (
    <div className="space-y-2">
      <ReviewFileCard file={selectedFile} selected compact />
      <Button
        variant="outline"
        size="sm"
        onClick={() => setSelectOpen(true)}
        className="mx-auto flex"
      >
        <FolderOpen className="h-3.5 w-3.5" />
        Select different file
      </Button>
    </div>
  ) : (
    <div className="grid grid-cols-2 gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setSelectOpen(true)}
        disabled={!hasFiles}
        className="w-full"
      >
        <FolderOpen className="h-3.5 w-3.5" />
        Select a file{readyCount > 0 ? ` (${readyCount})` : ""}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setUploadOpen(true)}
        className="w-full"
      >
        <Upload className="h-3.5 w-3.5" />
        Upload file
      </Button>
    </div>
  );

  // ── Shared dialogs ─────────────────────────────────────────────────
  const dialogs = (
    <>
      <ReviewFileUploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
      <Dialog open={selectOpen} onOpenChange={setSelectOpen}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Select a file</DialogTitle>
            <DialogDescription>
              Choose a file to submit for theological review.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6">
            <ReviewFileList
              files={files ?? []}
              selectedId={selectedFileId}
              onSelect={(id) => {
                onFileIdChange(id);
                setSelectOpen(false);
              }}
              onDelete={handleDelete}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );

  // ── Paste mode ─────────────────────────────────────────────────────
  if (contentMode === "paste") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-text-primary">Content</label>
          {modeToggle}
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">
              Content name
            </label>
            <Input
              value={pasteLabel}
              onChange={(e) => setPasteLabel(e.target.value)}
              placeholder="e.g. Sermon draft, Thesis chapter 2"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">
              Content
            </label>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste or type your content here..."
              rows={8}
              className="w-full rounded-md border border-text-secondary/20 bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
            />
          </div>
          <Button
            size="sm"
            onClick={handlePasteSave}
            disabled={!pasteText.trim() || !pasteLabel.trim() || pasteMutation.isPending}
          >
            <FileText className="h-3.5 w-3.5" />
            {pasteMutation.isPending ? "Saving..." : "Save as review file"}
          </Button>
        </div>

        {/* Show existing selected file if any */}
        {selectedFile && (
          <div className="rounded-lg border border-surface bg-surface/30 p-3">
            <p className="mb-2 text-xs font-medium text-text-secondary">Selected file:</p>
            <ReviewFileCard file={selectedFile} selected compact />
          </div>
        )}

        {bottomFields}
        {dialogs}
      </div>
    );
  }

  // ── File mode ──────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-sm font-medium text-text-primary">
            Content
          </label>
          {modeToggle}
        </div>
        {fileContentArea}
      </div>

      {bottomFields}
      {dialogs}
    </div>
  );
}
