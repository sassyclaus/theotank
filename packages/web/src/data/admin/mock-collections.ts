// ── Types ──────────────────────────────────────────────────────────

export interface CollectionResult {
  id: string;
  title: string;
  tool: "ask" | "poll" | "review";
}

export interface Collection {
  id: string;
  title: string;
  subtitle: string;
  resultCount: number;
  views: number;
  status: "live" | "draft";
  position?: number;
  results: CollectionResult[];
}

// ── Mock Data ─────────────────────────────────────────────────────

export const mockCollections: Collection[] = [
  {
    id: "col-1",
    title: "The Atonement Debate",
    subtitle: "How 2,000 years of theologians have understood the cross",
    resultCount: 34,
    views: 2_841,
    status: "live",
    position: 1,
    results: [
      {
        id: "res-1a",
        title: "Is penal substitutionary atonement biblical?",
        tool: "ask",
      },
      {
        id: "res-1b",
        title: "Which theory of atonement is most widely held today?",
        tool: "poll",
      },
      {
        id: "res-1c",
        title: "Review: The Nature of the Atonement edited by James Beilby",
        tool: "review",
      },
    ],
  },
  {
    id: "col-2",
    title: "Baptism Through the Ages",
    subtitle: "From the Jordan to the font: a theological journey",
    resultCount: 22,
    views: 1_204,
    status: "live",
    position: 2,
    results: [
      {
        id: "res-2a",
        title: "Did the early church practice infant baptism?",
        tool: "ask",
      },
      {
        id: "res-2b",
        title: "Is baptism necessary for salvation?",
        tool: "poll",
      },
      {
        id: "res-2c",
        title: "Review: Baptism in the Early Church by Everett Ferguson",
        tool: "review",
      },
    ],
  },
  {
    id: "col-3",
    title: "Reformation's Unfinished Arguments",
    subtitle: "The debates that shaped\u2014and still shape\u2014Protestantism",
    resultCount: 18,
    views: 847,
    status: "draft",
    results: [
      {
        id: "res-3a",
        title: "What did Luther actually mean by sola fide?",
        tool: "ask",
      },
      {
        id: "res-3b",
        title: "Should Protestants reconsider the deuterocanonical books?",
        tool: "poll",
      },
    ],
  },
  {
    id: "col-4",
    title: "Early Church Essentials",
    subtitle: "What did the first Christians actually believe?",
    resultCount: 15,
    views: 623,
    status: "draft",
    results: [
      {
        id: "res-4a",
        title: "How did the Nicene Creed come to define orthodoxy?",
        tool: "ask",
      },
      {
        id: "res-4b",
        title: "Review: The Spirit of Early Christian Thought by Robert Wilken",
        tool: "review",
      },
    ],
  },
];
