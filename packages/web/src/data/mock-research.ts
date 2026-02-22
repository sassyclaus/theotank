// ── Types ────────────────────────────────────────────────────────────

export interface Corpus {
  id: string;
  theologianSlug: string;
  theologianName: string;
  initials: string;
  color: string;
  corpusName: string;
  description: string;
  available: boolean;
  cta: string;
}

export interface CitationRef {
  id: string;
  marker: string;
  source: string;
  originalText: string;
  translation: string;
}

export interface CitationExample {
  question: string;
  responseExcerpt: string;
  citations: CitationRef[];
}

export interface RecentResearchItem {
  id: string;
  question: string;
  theologianName: string;
  date: string;
  citedSourcesCount: number;
}

// ── Data ─────────────────────────────────────────────────────────────

export const corpora: Corpus[] = [
  {
    id: "aquinas",
    theologianSlug: "thomas-aquinas",
    theologianName: "Thomas Aquinas",
    initials: "TA",
    color: "#1B6B6D",
    corpusName: "Corpus Thomisticum",
    description:
      "The complete works of Thomas Aquinas — Summa Theologiae, Summa contra Gentiles, Quaestiones Disputatae, and commentaries. Every response is grounded in verified Latin source text with inline citations.",
    available: true,
    cta: "Ask Aquinas →",
  },
  {
    id: "calvin",
    theologianSlug: "john-calvin",
    theologianName: "John Calvin",
    initials: "JC",
    color: "#5A7A62",
    corpusName: "Institutes of the Christian Religion",
    description:
      "Calvin's magnum opus across all four books — systematic theology covering knowledge of God, Christ the Redeemer, the Holy Spirit, and the Church. Citation-grounded inquiry into Reformed doctrine.",
    available: false,
    cta: "Notify me",
  },
];

export const citationExample: CitationExample = {
  question:
    "How does Aquinas distinguish the analogy of proportionality from the analogy of attribution?",
  responseExcerpt:
    'Aquinas holds that when we predicate terms like "good" or "wise" of both God and creatures, we do so neither univocally nor equivocally, but analogically. In the analogy of attribution, a term is predicated primarily of one subject and secondarily of others by reference to it — as "healthy" is said of medicine only because it causes health in the animal [1]. In the analogy of proportionality, each analogate possesses the perfection intrinsically but according to its own mode of being, so that the creature\'s goodness is to the creature as God\'s goodness is to God [2].',
  citations: [
    {
      id: "c1",
      marker: "1",
      source: "Summa Theologiae I, q. 13, a. 5, co.",
      originalText:
        "Dicendum quod in huiusmodi analogia, non est eadem ratio nominis, sicut est in univocis; nec totaliter diversa, sicut in aequivocis; sed nomen quod sic multipliciter dicitur, significat diversas proportiones ad aliquid unum.",
      translation:
        "It must be said that in this kind of analogy, the meaning of the term is not entirely the same, as in univocal predication; nor entirely different, as in equivocal predication; but the term used in these many ways signifies various proportions to some one thing.",
    },
    {
      id: "c2",
      marker: "2",
      source: "De Veritate, q. 2, a. 11, co.",
      originalText:
        "Aliquando vero nomen commune imponitur ab aliqua proportione duorum ad duo diversa, sicut sanum dicitur de medicina et urina, inquantum utrumque habet ordinem et proportionem ad sanitatem animalis.",
      translation:
        "Sometimes, however, a common term is imposed from some proportion of two things to two different things, as 'healthy' is said of medicine and of urine insofar as each has an order and proportion to the health of the animal.",
    },
  ],
};

export const recentResearchItems: RecentResearchItem[] = [
  {
    id: "rr1",
    question: "What is the relationship between faith and reason in Aquinas?",
    theologianName: "Thomas Aquinas",
    date: "Feb 20, 2026",
    citedSourcesCount: 4,
  },
  {
    id: "rr2",
    question:
      "How does the Summa address the problem of evil in the context of divine omnipotence?",
    theologianName: "Thomas Aquinas",
    date: "Feb 17, 2026",
    citedSourcesCount: 3,
  },
  {
    id: "rr3",
    question:
      "What does Aquinas say about the natural law and its relation to eternal law?",
    theologianName: "Thomas Aquinas",
    date: "Feb 14, 2026",
    citedSourcesCount: 5,
  },
];
