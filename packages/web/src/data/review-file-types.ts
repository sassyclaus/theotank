export type ReviewFileStatus =
  | "pending"
  | "uploaded"
  | "processing"
  | "ready"
  | "failed";

export interface ReviewFile {
  id: string;
  label: string;
  fileName: string;
  contentType: string;
  charCount: number | null;
  status: ReviewFileStatus;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewFileUploadResponse {
  id: string;
  fileKey: string;
  uploadUrl: string;
}

export const ACCEPTED_FILE_EXTENSIONS =
  ".pdf,.txt,.html,.mp3,.mp4,.m4a,.wav,.ogg,.webm,.mov";

export const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "text/plain",
  "text/html",
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/m4a",
  "audio/wav",
  "audio/ogg",
  "audio/webm",
  "audio/x-m4a",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/ogg",
];

export const MAX_FILE_SIZE_MB = 200;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
