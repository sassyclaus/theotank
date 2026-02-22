export interface TrendingItem {
  id: string;
  question: string;
  tool: "Ask" | "Poll" | "Review";
  team: string;
}

export const trendingItems: TrendingItem[] = [
  {
    id: "1",
    question: "Did the early church pray to saints?",
    tool: "Ask",
    team: "Church Fathers",
  },
  {
    id: "2",
    question: "Is sola scriptura biblical?",
    tool: "Poll",
    team: "All Theologians",
  },
  {
    id: "3",
    question: "What did Aquinas think about predestination?",
    tool: "Ask",
    team: "Medieval Voices",
  },
  {
    id: "4",
    question: "Was the Trinity a later doctrinal invention?",
    tool: "Poll",
    team: "Church Fathers",
  },
  {
    id: "5",
    question: "How did the Reformers view the Eucharist?",
    tool: "Ask",
    team: "Reformation Voices",
  },
];
