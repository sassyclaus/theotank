import { Link } from "react-router";
import { ArrowLeft, Download, Share2, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TOOL_LABELS, TOOL_COLORS, TOOL_ICONS } from "@/data/mock-library";
import type { FullResult } from "@/data/mock-results";

interface ReportHeaderProps {
  result: FullResult;
}

export function ReportHeader({ result }: ReportHeaderProps) {
  const colors = TOOL_COLORS[result.tool];
  const Icon = TOOL_ICONS[result.tool];

  return (
    <div className="mb-10">
      <Link
        to="/library"
        className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-teal hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Library
      </Link>

      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${colors.bg}`}
        >
          <Icon className={`h-6 w-6 ${colors.text}`} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}
            >
              {TOOL_LABELS[result.tool]}
            </span>
            <span className="text-xs text-text-secondary">{result.team}</span>
            <span className="text-xs text-text-secondary/60">{result.date}</span>
          </div>

          <h1 className="mt-2 font-serif text-2xl font-bold lg:text-3xl">
            {result.title}
          </h1>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-3.5 w-3.5" />
              PDF
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-3.5 w-3.5" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <Link2 className="h-3.5 w-3.5" />
              Copy Link
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
