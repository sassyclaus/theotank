import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { StatusBadge, PriorityBadge, TypeBadge } from "./JobBadges";
import {
  useAdminRetryJob,
  useAdminCancelJob,
  useAdminUpdateJobPriority,
} from "@/hooks/useAdminJobs";
import type { JobDetail } from "@/data/admin/job-types";

interface JobDetailViewProps {
  job: JobDetail;
}

function formatTimestamp(ts: string | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

function JsonBlock({ label, data }: { label: string; data: unknown }) {
  if (data == null) return null;
  return (
    <div className="rounded-lg border border-admin-border bg-white p-6">
      <h2 className="mb-3 text-sm font-medium text-gray-900">{label}</h2>
      <pre className="overflow-x-auto rounded bg-gray-50 p-3 text-xs text-gray-700">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

export function JobDetailView({ job }: JobDetailViewProps) {
  const retryMutation = useAdminRetryJob();
  const cancelMutation = useAdminCancelJob();
  const priorityMutation = useAdminUpdateJobPriority();
  const [priorityValue, setPriorityValue] = useState(job.priority);

  const canRetry = job.status === "failed";
  const canCancel = job.status === "pending" || job.status === "processing";
  const canChangePriority = job.status === "pending" || job.status === "processing";

  function handlePriorityChange(newPriority: string) {
    setPriorityValue(newPriority as typeof priorityValue);
    priorityMutation.mutate({ id: job.id, priority: newPriority });
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        to="/admin/jobs"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Jobs
      </Link>

      {/* Header */}
      <div className="rounded-lg border border-admin-border bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-lg font-semibold text-gray-900">
                {job.id.slice(0, 8)}...
              </h1>
              <StatusBadge status={job.status} />
              <PriorityBadge priority={job.priority} />
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
              <span>
                Type: <TypeBadge type={job.type} />
              </span>
              <span>
                Attempts: {job.attempts}/{job.maxAttempts}
              </span>
              {job.lockedBy && <span>Worker: {job.lockedBy}</span>}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
              <span>Created: {formatTimestamp(job.createdAt)}</span>
              <span>Started: {formatTimestamp(job.startedAt)}</span>
              <span>Completed: {formatTimestamp(job.completedAt)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-admin-border pt-4">
          {canRetry && (
            <button
              onClick={() => retryMutation.mutate(job.id)}
              disabled={retryMutation.isPending}
              className="rounded bg-admin-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-admin-accent/90 disabled:opacity-50"
            >
              {retryMutation.isPending ? "Retrying..." : "Retry Job"}
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => cancelMutation.mutate(job.id)}
              disabled={cancelMutation.isPending}
              className="rounded bg-admin-danger px-3 py-1.5 text-xs font-medium text-white hover:bg-admin-danger/90 disabled:opacity-50"
            >
              {cancelMutation.isPending ? "Cancelling..." : "Cancel Job"}
            </button>
          )}
          {canChangePriority && (
            <select
              value={priorityValue}
              onChange={(e) => handlePriorityChange(e.target.value)}
              disabled={priorityMutation.isPending}
              className="rounded border border-gray-300 px-2 py-1.5 text-xs disabled:opacity-50"
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          )}
        </div>
      </div>

      {/* Linked Result */}
      {job.linkedResult != null && (
        <div className="rounded-lg border border-admin-border bg-white p-6">
          <h2 className="mb-3 text-sm font-medium text-gray-900">
            Linked Result
          </h2>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-900">
              "{job.linkedResult.title}"
            </span>
            <TypeBadge type={job.linkedResult.toolType} />
            <StatusBadge status={job.linkedResult.status} />
          </div>
          <p className="mt-1 text-xs text-gray-400">
            ID: {job.linkedResult.id} | User: {job.linkedResult.userId}
          </p>
        </div>
      )}

      {/* Payload */}
      <JsonBlock label="Payload" data={job.payload} />

      {/* Result data */}
      <JsonBlock label="Result Data" data={job.result} />

      {/* Error */}
      {(job.errorMessage != null || job.errorDetails != null) && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h2 className="mb-2 text-sm font-medium text-red-900">Error</h2>
          {job.errorMessage && (
            <p className="text-sm text-red-700">{job.errorMessage}</p>
          )}
          {job.errorDetails != null && (
            <pre className="mt-2 overflow-x-auto rounded bg-red-100 p-3 text-xs text-red-800">
              {JSON.stringify(job.errorDetails, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
