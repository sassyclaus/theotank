import { DataTable } from "@/components/admin/ui/DataTable";
import { mockResearchQueries, type ResearchQuery } from "@/data/admin/mock-research";
import { Check, X } from "lucide-react";

const columns = [
  {
    key: "date",
    header: "Date",
    className: "whitespace-nowrap",
  },
  {
    key: "user",
    header: "User",
    className: "whitespace-nowrap",
  },
  {
    key: "corpus",
    header: "Corpus",
    className: "whitespace-nowrap",
  },
  {
    key: "query",
    header: "Query",
    render: (row: ResearchQuery) => (
      <span className="line-clamp-1 max-w-xs" title={row.query}>
        {row.query}
      </span>
    ),
  },
  {
    key: "citations",
    header: "Citations",
    className: "text-center",
    render: (row: ResearchQuery) => (
      <span className="text-center">{row.citations}</span>
    ),
  },
  {
    key: "satisfied",
    header: "Satisfied",
    className: "text-center",
    render: (row: ResearchQuery) =>
      row.satisfied ? (
        <Check className="mx-auto h-4 w-4 text-admin-success" />
      ) : (
        <X className="mx-auto h-4 w-4 text-admin-danger" />
      ),
  },
];

export function QueryLog() {
  return (
    <DataTable<ResearchQuery>
      columns={columns}
      data={mockResearchQueries}
      keyExtractor={(row) => row.id}
    />
  );
}
