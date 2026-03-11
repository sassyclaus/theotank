import { useState } from "react";
import { SearchFilter } from "@/components/admin/ui/SearchFilter";
import { WaitlistOverview } from "@/components/admin/waitlist/WaitlistOverview";
import { WaitlistTable } from "@/components/admin/waitlist/WaitlistTable";
import { useAdminWaitlist } from "@/hooks/useAdminWaitlist";
import type { WaitlistListParams } from "@/data/admin/waitlist-types";

export default function Waitlist() {
  const [search, setSearch] = useState("");
  const [surveyKey, setSurveyKey] = useState("");
  const [surveyValue, setSurveyValue] = useState("");
  const [emailConfirmed, setEmailConfirmed] = useState("");
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const params: WaitlistListParams = {
    limit,
    offset,
    sort: "createdAt",
    order: "desc",
    ...(search && { search }),
    ...(surveyKey && surveyValue && { surveyKey, surveyValue }),
    ...(emailConfirmed && { emailConfirmed }),
  };

  const { data, isLoading } = useAdminWaitlist(params);
  const stats = data?.stats;
  const signups = data?.signups ?? [];
  const total = data?.total ?? 0;

  // Derive survey filter keys from stats
  const surveyKeys = stats ? Object.keys(stats.bySurvey).sort() : [];
  const surveyValues =
    stats && surveyKey && stats.bySurvey[surveyKey]
      ? Object.keys(stats.bySurvey[surveyKey]).sort()
      : [];

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-gray-500">Loading waitlist...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {stats && <WaitlistOverview stats={stats} />}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-56">
          <SearchFilter
            value={search}
            onChange={(v) => {
              setSearch(v);
              setOffset(0);
            }}
            placeholder="Search by email..."
          />
        </div>
        {surveyKeys.length > 0 && (
          <select
            value={surveyKey}
            onChange={(e) => {
              setSurveyKey(e.target.value);
              setSurveyValue("");
              setOffset(0);
            }}
            className="rounded border border-gray-300 px-2 py-2 text-sm"
          >
            <option value="">All survey keys</option>
            {surveyKeys.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        )}
        {surveyKey && surveyValues.length > 0 && (
          <select
            value={surveyValue}
            onChange={(e) => {
              setSurveyValue(e.target.value);
              setOffset(0);
            }}
            className="rounded border border-gray-300 px-2 py-2 text-sm"
          >
            <option value="">All values</option>
            {surveyValues.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        )}
        <select
          value={emailConfirmed}
          onChange={(e) => {
            setEmailConfirmed(e.target.value);
            setOffset(0);
          }}
          className="rounded border border-gray-300 px-2 py-2 text-sm"
        >
          <option value="">All emails</option>
          <option value="true">Confirmed</option>
          <option value="false">Unconfirmed</option>
        </select>
      </div>

      {/* Table */}
      <WaitlistTable signups={signups} />

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
