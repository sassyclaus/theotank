import type { ReviewFile } from "@/data/review-file-types";
import { ReviewFileCard } from "./ReviewFileCard";

interface ReviewFileListProps {
  files: ReviewFile[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ReviewFileList({
  files,
  selectedId,
  onSelect,
  onDelete,
}: ReviewFileListProps) {
  if (files.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-text-secondary/60">
        No files uploaded yet.
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {files.map((file) => (
        <ReviewFileCard
          key={file.id}
          file={file}
          selected={file.id === selectedId}
          onClick={() => onSelect(file.id)}
          onDelete={() => onDelete(file.id)}
        />
      ))}
    </div>
  );
}
