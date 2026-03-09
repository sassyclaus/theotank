import { MessageCircle, BarChart3, FileCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const tools = [
  {
    title: "Ask",
    description:
      "Pose a question and receive simulated perspectives from a curated panel of theological voices.",
    icon: MessageCircle,
    cta: "Convene Panel",
  },
  {
    title: "Poll",
    description:
      "simulated survey of 350+ theologians across 2,000 years. See where the tradition agrees — and where it fractures.",
    icon: BarChart3,
    cta: "Run Poll",
  },
  {
    title: "Review",
    description:
      "Submit a sermon, essay, or lecture for simulated theological review by your chosen panel of voices.",
    icon: FileCheck,
    cta: "Submit for Review",
  },
];

export function ToolCards() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <div className="grid gap-6 md:grid-cols-3">
        {tools.map((tool) => (
          <Card
            key={tool.title}
            className="border-t-2 border-t-teal transition-shadow hover:shadow-md"
          >
            <CardHeader>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-light">
                <tool.icon className="h-5 w-5 text-teal" />
              </div>
              <CardTitle>{tool.title}</CardTitle>
              <CardDescription>{tool.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <button className="text-sm font-medium text-teal hover:underline">
                {tool.cta} &rarr;
              </button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
