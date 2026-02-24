import { AuditTable } from "@/components/admin/audit/AuditTable";

export default function AuditLog() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Audit Log</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track all administrative actions across the platform.
        </p>
      </div>

      <div className="rounded-lg border border-admin-border bg-white p-5">
        <AuditTable />
      </div>
    </div>
  );
}
