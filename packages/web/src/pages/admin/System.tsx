import { InferenceCosts } from "@/components/admin/system/InferenceCosts";
import { JobQueue } from "@/components/admin/system/JobQueue";
import { ApiStatus } from "@/components/admin/system/ApiStatus";
import { FeatureFlags } from "@/components/admin/system/FeatureFlags";
import { ErrorLog } from "@/components/admin/system/ErrorLog";

export default function System() {
  return (
    <div className="space-y-6">
      {/* Inference Costs — full width */}
      <InferenceCosts />

      {/* Job Queue + API Status — two columns */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <JobQueue />
        <ApiStatus />
      </div>

      {/* Feature Flags — full width */}
      <FeatureFlags />

      {/* Error Log — full width */}
      <ErrorLog />
    </div>
  );
}
