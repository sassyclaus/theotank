import { DataTable } from "@/components/admin/ui/DataTable";
import type { WaitlistSignup } from "@/data/admin/waitlist-types";

interface WaitlistTableProps {
  signups: WaitlistSignup[];
}

function formatAge(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function WaitlistTable({ signups }: WaitlistTableProps) {
  const columns = [
    {
      key: "queuePosition",
      header: "Queue #",
      render: (row: WaitlistSignup) => (
        <span className="font-mono text-gray-600">{row.queuePosition}</span>
      ),
    },
    {
      key: "email",
      header: "Email",
      className: "max-w-[220px] truncate",
      render: (row: WaitlistSignup) => (
        <span className="text-gray-900" title={row.email}>
          {row.email}
        </span>
      ),
    },
    {
      key: "emailConfirmed",
      header: "Confirmed",
      render: (row: WaitlistSignup) => (
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${
            row.emailConfirmed ? "bg-green-500" : "bg-gray-300"
          }`}
          title={row.emailConfirmed ? "Confirmed" : "Unconfirmed"}
        />
      ),
    },
    {
      key: "survey",
      header: "Survey",
      render: (row: WaitlistSignup) => {
        if (!row.surveyResponses) {
          return <span className="text-gray-400">&mdash;</span>;
        }
        const values = Object.values(row.surveyResponses).flat();
        return (
          <div className="flex flex-wrap gap-1">
            {values.map((v, i) => (
              <span
                key={i}
                className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700"
              >
                {v}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: "referralCount",
      header: "Referrals",
      render: (row: WaitlistSignup) => (
        <span className="text-gray-600">{row.referralCount}</span>
      ),
    },
    {
      key: "utmSource",
      header: "Source",
      render: (row: WaitlistSignup) => (
        <span className="text-gray-600">{row.utmSource ?? "—"}</span>
      ),
    },
    {
      key: "createdAt",
      header: "Signed Up",
      render: (row: WaitlistSignup) => (
        <span className="text-gray-600">{formatAge(row.createdAt)}</span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={signups}
      keyExtractor={(row) => row.id}
    />
  );
}
