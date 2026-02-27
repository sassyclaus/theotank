import { useState } from "react";
import { useNavigate } from "react-router";
import { SearchFilter } from "@/components/admin/ui/SearchFilter";
import { JobsOverview } from "@/components/admin/jobs/JobsOverview";
import { JobsTable } from "@/components/admin/jobs/JobsTable";
import { useAdminJobs, useAdminBulkRetryJobs, useAdminBulkCancelJobs } from "@/hooks/useAdminJobs";
import type { JobSummary, JobStatus, JobPriority, JobListParams } from "@/data/admin/job-types";

export default function Jobs() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<JobStatus | "">("");
  const [type, setType] = useState("");
  const [priority, setPriority] = useState<JobPriority | "">("");
  const [offset, setOffset] = useState(0);
  const limit = 50;
  const navigate = useNavigate();
  const bulkRetry = useAdminBulkRetryJobs();
  const bulkCancel = useAdminBulkCancelJobs();

  const params: JobListParams = {
    limit,
    offset,
    sort: "createdAt",
    order: "desc",
    ...(status && { status: status as JobStatus }),
    ...(type && { type }),
    ...(priority && { priority: priority as JobPriority }),
    ...(search && { search }),
  };

  const { data, isLoading } = useAdminJobs(params);
  const stats = data?.stats;
  const jobs = data?.jobs ?? [];
  const total = data?.total ?? 0;

  function handleJobClick(job: JobSummary) {
    navigate(`/admin/jobs/${job.id}`);
  }

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-gray-500">Loading jobs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && <JobsOverview stats={stats} />}

      {/* Filters + Bulk Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-48">
          <SearchFilter
            value={search}
            onChange={(v) => { setSearch(v); setOffset(0); }}
            placeholder="Search by ID..."
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value as JobStatus | ""); setOffset(0); }}
          className="rounded border border-gray-300 px-2 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
        <select
          value={type}
          onChange={(e) => { setType(e.target.value); setOffset(0); }}
          className="rounded border border-gray-300 px-2 py-2 text-sm"
        >
          <option value="">All types</option>
          <option value="ask">Ask</option>
          <option value="poll">Poll</option>
          <option value="review">Review</option>
          <option value="research">Research</option>
          <option value="pdf">PDF</option>
          <option value="review_file">Review File</option>
        </select>
        <select
          value={priority}
          onChange={(e) => { setPriority(e.target.value as JobPriority | ""); setOffset(0); }}
          className="rounded border border-gray-300 px-2 py-2 text-sm"
        >
          <option value="">All priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>

        <div className="ml-auto flex gap-2">
          {stats && stats.failed > 0 && (
            <button
              onClick={() => bulkRetry.mutate()}
              disabled={bulkRetry.isPending}
              className="rounded bg-admin-accent px-3 py-2 text-xs font-medium text-white hover:bg-admin-accent/90 disabled:opacity-50"
            >
              {bulkRetry.isPending ? "Retrying..." : `Retry All Failed (${stats.failed})`}
            </button>
          )}
          {stats && stats.pending > 0 && (
            <button
              onClick={() => bulkCancel.mutate()}
              disabled={bulkCancel.isPending}
              className="rounded bg-admin-danger px-3 py-2 text-xs font-medium text-white hover:bg-admin-danger/90 disabled:opacity-50"
            >
              {bulkCancel.isPending ? "Cancelling..." : `Cancel All Pending (${stats.pending})`}
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <JobsTable jobs={jobs} onJobClick={handleJobClick} />

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Showing {offset + 1}–{Math.min(offset + limit, total)} of {total}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="rounded border border-gray-300 px-3 py-1 text-xs disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= total}
              className="rounded border border-gray-300 px-3 py-1 text-xs disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
