import { useState, useCallback, useRef, type DragEvent } from "react";
import { Upload, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUploadReviewFile } from "@/hooks/useReviewFiles";
import {
  ACCEPTED_FILE_EXTENSIONS,
  MAX_FILE_SIZE_MB,
  MAX_FILE_SIZE_BYTES,
} from "@/data/review-file-types";

interface ReviewFileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReviewFileUploadDialog({
  open,
  onOpenChange,
}: ReviewFileUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadReviewFile();

  const resetState = useCallback(() => {
    setFile(null);
    setLabel("");
    setError(null);
    setDragOver(false);
  }, []);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) resetState();
      onOpenChange(open);
    },
    [onOpenChange, resetState],
  );

  const validateAndSetFile = useCallback((f: File) => {
    if (f.size > MAX_FILE_SIZE_BYTES) {
      setError(`File exceeds ${MAX_FILE_SIZE_MB} MB limit`);
      return;
    }
    setError(null);
    setFile(f);
    setLabel(f.name.replace(/\.[^/.]+$/, ""));
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) validateAndSetFile(f);
    },
    [validateAndSetFile],
  );

  const handleFileSelect = useCallback(() => {
    const f = fileInputRef.current?.files?.[0];
    if (f) validateAndSetFile(f);
  }, [validateAndSetFile]);

  const handleUpload = useCallback(async () => {
    if (!file) return;
    try {
      await uploadMutation.mutateAsync({ file, label: label || undefined });
      handleOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Upload failed",
      );
    }
  }, [file, label, uploadMutation, handleOpenChange]);

  const isUploading = uploadMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Upload content for review</DialogTitle>
          <DialogDescription>
            Upload a document, audio, or video file for your theologian team to
            review. Text will be automatically extracted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 pb-6">
          {/* Drop zone */}
          {!file ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-10 transition-colors ${
                dragOver
                  ? "border-teal bg-teal-light/50"
                  : "border-surface hover:border-teal/40 hover:bg-teal-light/30"
              }`}
            >
              <Upload className="h-8 w-8 text-text-secondary/40" />
              <p className="text-sm text-text-secondary">
                Drop a file here or{" "}
                <span className="font-medium text-teal">browse</span>
              </p>
              <p className="text-xs text-text-secondary/60">
                PDF, TXT, HTML, audio, or video up to {MAX_FILE_SIZE_MB} MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_FILE_EXTENSIONS}
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="rounded-lg border border-teal/30 bg-teal-light/30 px-4 py-3">
              <p className="text-sm font-medium text-text-primary">
                {file.name}
              </p>
              <p className="text-xs text-text-secondary">
                {(file.size / 1024 / 1024).toFixed(1)} MB · {file.type || "unknown type"}
              </p>
              <button
                onClick={() => {
                  setFile(null);
                  setLabel("");
                }}
                className="mt-1 text-xs text-teal underline"
              >
                Choose a different file
              </button>
            </div>
          )}

          {/* Label input */}
          {file && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">
                Label
              </label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Name for this content"
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-sm text-oxblood">{error}</p>
          )}

          {/* Upload button */}
          <Button
            size="lg"
            className="w-full"
            disabled={!file || isUploading}
            onClick={handleUpload}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
