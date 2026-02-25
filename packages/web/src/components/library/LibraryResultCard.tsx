import { Link, useNavigate } from "react-router";
import { ArrowRight, FileText, Share2, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TOOL_LABELS, TOOL_COLORS } from "@/data/mock-library";
import type { MyLibraryItem } from "@/data/mock-library";
import { MiniBarChart } from "./MiniBarChart";

interface LibraryResultCardProps {
  item: MyLibraryItem;
}

export function LibraryResultCard({ item }: LibraryResultCardProps) {
  const navigate = useNavigate();
  const colors = TOOL_COLORS[item.tool];

  if (item.status === "processing") {
    return (
      <Card
        className="cursor-pointer opacity-75 transition-shadow hover:shadow-md"
        onClick={() => navigate(`/library/${item.id}`)}
      >
        <CardContent>
          <div className="mb-2 flex items-center gap-2">
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", colors.bg, colors.text)}>
              {TOOL_LABELS[item.tool]}
            </span>
            <span className="text-xs text-text-secondary">{item.team}</span>
          </div>
          <h3 className="text-sm font-medium text-text-primary">{item.title}</h3>
          <p className="mt-2 text-xs italic text-text-secondary">
            Theologians are deliberating
            <span className="inline-flex w-6">
              <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
            </span>
          </p>
        </CardContent>
      </Card>
    );
  }

  if (item.status === "failed") {
    return (
      <Card className="border-l-2 border-l-terracotta/50">
        <CardContent>
          <div className="mb-2 flex items-center gap-2">
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", colors.bg, colors.text)}>
              {TOOL_LABELS[item.tool]}
            </span>
            <span className="text-xs text-text-secondary">{item.team}</span>
          </div>
          <h3 className="text-sm font-medium text-text-primary">{item.title}</h3>
          <p className="mt-2 text-xs text-terracotta">
            Something went wrong.{" "}
            <button className="underline hover:text-terracotta/80">
              <RotateCcw className="mr-0.5 inline h-3 w-3" />
              Retry
            </button>
          </p>
        </CardContent>
      </Card>
    );
  }

  // Complete status
  const isResearch = item.tool === "research";

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-shadow hover:shadow-md",
        isResearch && "border-l-2 border-l-oxblood",
      )}
      onClick={() => navigate(`/library/${item.id}`)}
    >
      <CardContent>
        <div className="mb-2 flex items-center gap-2">
          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", colors.bg, colors.text)}>
            {TOOL_LABELS[item.tool]}
          </span>
          <span className="text-xs text-text-secondary">{item.team}</span>
          <span className="ml-auto text-xs text-text-secondary/60">{item.date}</span>
        </div>

        <h3 className="text-sm font-medium text-text-primary">{item.title}</h3>

        <div className="mt-3">
          <PreviewContent preview={item.preview} />
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Link
            to={`/library/${item.id}`}
            className="flex items-center gap-1 text-xs font-medium text-teal hover:text-teal/80"
            onClick={(e) => e.stopPropagation()}
          >
            Open <ArrowRight className="h-3 w-3" />
          </Link>
          <button
            className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary"
            onClick={(e) => e.stopPropagation()}
          >
            <FileText className="h-3 w-3" /> PDF
          </button>
          <button
            className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary"
            onClick={(e) => e.stopPropagation()}
          >
            <Share2 className="h-3 w-3" /> Share
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function PreviewContent({ preview }: { preview: MyLibraryItem["preview"] }) {
  switch (preview.type) {
    case "ask":
      return (
        <p className="line-clamp-2 text-xs leading-relaxed text-text-secondary">
          {preview.conclusion}
        </p>
      );
    case "poll":
      return <MiniBarChart bars={preview.bars} />;
    case "review":
      return (
        <span className="inline-flex items-center rounded-md border border-teal/30 px-2.5 py-1 font-serif text-lg font-bold text-teal">
          {preview.grade}
        </span>
      );
    case "research":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-oxblood/10 px-2.5 py-0.5 text-xs font-medium text-oxblood">
          {preview.citedSourcesCount} Cited Sources
        </span>
      );
  }
}
