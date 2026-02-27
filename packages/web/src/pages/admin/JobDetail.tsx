import { useParams } from "react-router";
import { JobDetailView } from "@/components/admin/jobs/JobDetailView";
import { useAdminJob } from "@/hooks/useAdminJobs";

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: job, isLoading } = useAdminJob(id!);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-gray-500">Loading job...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-gray-500">Job not found.</p>
      </div>
    );
  }

  return <JobDetailView job={job} />;
}
