export interface PersonaData {
  title: string;
  slug: string;
  icon: string;
  description: string;
}

export const personas: PersonaData[] = [
  {
    title: "Content creators",
    slug: "creator",
    icon: "video",
    description:
      "Ground your next video in 2,000 years of church history. Share simulated poll results and theologian perspectives your audience will debate for days.",
  },
  {
    title: "Pastors & preachers",
    slug: "pastor",
    icon: "book-open",
    description:
      "Get simulated feedback on your sermon from the Reformers. Browse what others have already asked. Prep faster with a theological panel on call.",
  },
  {
    title: "Students & academics",
    slug: "student",
    icon: "graduation-cap",
    description:
      "Cited primary sources in the original language. Research-grade engagement with Aquinas, with Calvin and more coming.",
  },
  {
    title: "The theology-curious",
    slug: "enthusiast",
    icon: "compass",
    description:
      "Ask anything. See how simulations of history's brightest minds might answer. No seminary degree required.",
  },
];
