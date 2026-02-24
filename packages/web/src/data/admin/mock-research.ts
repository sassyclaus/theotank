// ── Types ──────────────────────────────────────────────────────────

export interface Corpus {
  id: string;
  theologian: string;
  name: string;
  status: "live" | "processing" | "planned";
  sources: string[];
  totalPassages?: number;
  queries30d?: number;
  avgCitations?: number;
  satisfaction?: number;
  progress?: number;
  eta?: string;
  waitlist?: number;
}

export interface ResearchQuery {
  id: string;
  date: string;
  user: string;
  corpus: string;
  query: string;
  citations: number;
  satisfied: boolean;
}

// ── Corpora ───────────────────────────────────────────────────────

export const mockCorpora: Corpus[] = [
  {
    id: "corpus-1",
    theologian: "Thomas Aquinas",
    name: "Thomisticum",
    status: "live",
    sources: ["Summa Theologiae", "Summa Contra Gentiles", "De Veritate"],
    totalPassages: 48247,
    queries30d: 187,
    avgCitations: 4.2,
    satisfaction: 91,
  },
  {
    id: "corpus-2",
    theologian: "John Calvin",
    name: "Institutes",
    status: "processing",
    sources: ["Institutes of the Christian Religion"],
    progress: 72,
    eta: "~3 days",
    waitlist: 34,
  },
  {
    id: "corpus-3",
    theologian: "Karl Barth",
    name: "Church Dogmatics",
    status: "planned",
    sources: ["Church Dogmatics I-IV"],
    waitlist: 23,
  },
  {
    id: "corpus-4",
    theologian: "Martin Luther",
    name: "Selected Works",
    status: "planned",
    sources: ["95 Theses", "On the Freedom of a Christian", "Large Catechism"],
    waitlist: 18,
  },
  {
    id: "corpus-5",
    theologian: "Athanasius",
    name: "On the Incarnation",
    status: "planned",
    sources: ["On the Incarnation", "Against the Arians"],
    waitlist: 12,
  },
];

// ── Research Queries ──────────────────────────────────────────────

export const mockResearchQueries: ResearchQuery[] = [
  {
    id: "rq-1",
    date: "2026-02-23",
    user: "dr.williams@seminary.edu",
    corpus: "Thomisticum",
    query: "What is Aquinas's view on the relationship between faith and reason?",
    citations: 6,
    satisfied: true,
  },
  {
    id: "rq-2",
    date: "2026-02-22",
    user: "mthompson@divinity.org",
    corpus: "Thomisticum",
    query: "How does Aquinas define natural law?",
    citations: 4,
    satisfied: true,
  },
  {
    id: "rq-3",
    date: "2026-02-21",
    user: "s.chen@theologyhub.com",
    corpus: "Thomisticum",
    query: "Aquinas on the five ways and cosmological arguments",
    citations: 5,
    satisfied: true,
  },
  {
    id: "rq-4",
    date: "2026-02-20",
    user: "rev.jackson@church.net",
    corpus: "Thomisticum",
    query: "What does the Summa say about grace and free will?",
    citations: 3,
    satisfied: false,
  },
  {
    id: "rq-5",
    date: "2026-02-19",
    user: "a.martinez@college.edu",
    corpus: "Thomisticum",
    query: "Aquinas's doctrine of analogy in De Veritate",
    citations: 2,
    satisfied: true,
  },
  {
    id: "rq-6",
    date: "2026-02-18",
    user: "prof.kim@university.ac.kr",
    corpus: "Thomisticum",
    query: "Thomistic understanding of the virtues and their hierarchy",
    citations: 7,
    satisfied: true,
  },
];

// ── Roadmap (convenience filter) ──────────────────────────────────

export const mockRoadmap = mockCorpora.filter((c) => c.status === "planned");
