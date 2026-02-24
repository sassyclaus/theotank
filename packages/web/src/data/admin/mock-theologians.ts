// ── Types ──────────────────────────────────────────────────────────

export interface AdminTheologian {
  id: string;
  name: string;
  era: string;
  tradition: string;
  birthYear: number;
  deathYear?: number;
  hasPortrait: boolean;
  hasResearchCorpus: boolean;
  profileCompleteness: "full" | "partial" | "minimal";
  publicResults: number;
  customTeamInclusions: number;
  bio?: string;
  aliases?: string;
  keyWorks?: string[];
}

// ── Mock Theologians ──────────────────────────────────────────────

export const mockAdminTheologians: AdminTheologian[] = [
  {
    id: "augustine-of-hippo",
    name: "Augustine of Hippo",
    era: "Patristic",
    tradition: "Catholic",
    birthYear: 354,
    deathYear: 430,
    hasPortrait: true,
    hasResearchCorpus: true,
    profileCompleteness: "full",
    publicResults: 187,
    customTeamInclusions: 42,
    bio: "Augustine of Hippo was a theologian and philosopher whose writings influenced the development of Western Christianity and Western philosophy. He was the bishop of Hippo Regius in North Africa. Among his most important works are The City of God, On Christian Doctrine, and Confessions.",
    aliases: "Saint Augustine, Aurelius Augustinus",
    keyWorks: [
      "Confessions",
      "The City of God",
      "On Christian Doctrine",
      "On the Trinity",
      "Enchiridion",
    ],
  },
  {
    id: "thomas-aquinas",
    name: "Thomas Aquinas",
    era: "Medieval",
    tradition: "Catholic",
    birthYear: 1225,
    deathYear: 1274,
    hasPortrait: true,
    hasResearchCorpus: true,
    profileCompleteness: "full",
    publicResults: 203,
    customTeamInclusions: 56,
    bio: "Thomas Aquinas was an Italian Dominican friar, philosopher, Catholic priest, and Doctor of the Church. An immensely influential philosopher, theologian, and jurist in the tradition of scholasticism, he is known for his synthesis of Aristotelian philosophy with Christian theology.",
    aliases: "Saint Thomas, Doctor Angelicus, The Angelic Doctor",
    keyWorks: [
      "Summa Theologica",
      "Summa contra Gentiles",
      "Disputed Questions on Truth",
      "Compendium Theologiae",
    ],
  },
  {
    id: "john-calvin",
    name: "John Calvin",
    era: "Reformation",
    tradition: "Reformed",
    birthYear: 1509,
    deathYear: 1564,
    hasPortrait: true,
    hasResearchCorpus: true,
    profileCompleteness: "full",
    publicResults: 156,
    customTeamInclusions: 38,
    bio: "John Calvin was a French theologian, pastor, and reformer in Geneva during the Protestant Reformation. He was a principal figure in the development of the system of Christian theology later called Calvinism. His Institutes of the Christian Religion is one of the most influential works in Protestant theology.",
    aliases: "Jean Cauvin",
    keyWorks: [
      "Institutes of the Christian Religion",
      "Commentary on Romans",
      "Commentary on the Psalms",
      "The Bondage and Liberation of the Will",
    ],
  },
  {
    id: "martin-luther",
    name: "Martin Luther",
    era: "Reformation",
    tradition: "Lutheran",
    birthYear: 1483,
    deathYear: 1546,
    hasPortrait: true,
    hasResearchCorpus: true,
    profileCompleteness: "full",
    publicResults: 174,
    customTeamInclusions: 45,
    bio: "Martin Luther was a German professor of theology, priest, author, composer, and a seminal figure in the Protestant Reformation. Luther came to reject several teachings and practices of the Roman Catholic Church, most notably the practice of indulgences.",
    aliases: "Dr. Martin Luther",
    keyWorks: [
      "The Ninety-Five Theses",
      "The Bondage of the Will",
      "On the Freedom of a Christian",
      "Large Catechism",
      "Small Catechism",
    ],
  },
  {
    id: "karl-barth",
    name: "Karl Barth",
    era: "Modern",
    tradition: "Reformed",
    birthYear: 1886,
    deathYear: 1968,
    hasPortrait: true,
    hasResearchCorpus: false,
    profileCompleteness: "partial",
    publicResults: 89,
    customTeamInclusions: 31,
    bio: "Karl Barth was a Swiss Reformed theologian widely regarded as the greatest Protestant theologian of the twentieth century. His magnum opus, the Church Dogmatics, reshaped Protestant theology by emphasizing the sovereignty of God and the centrality of Christ.",
    aliases: undefined,
    keyWorks: [
      "Church Dogmatics",
      "The Epistle to the Romans",
      "Evangelical Theology: An Introduction",
    ],
  },
  {
    id: "athanasius-of-alexandria",
    name: "Athanasius of Alexandria",
    era: "Patristic",
    tradition: "Orthodox",
    birthYear: 296,
    deathYear: 373,
    hasPortrait: false,
    hasResearchCorpus: false,
    profileCompleteness: "partial",
    publicResults: 34,
    customTeamInclusions: 12,
    bio: "Athanasius of Alexandria was a Christian theologian, Church Father, and the 20th pope of Alexandria. He is best known for his role in the conflict with Arianism and his defense of Trinitarian theology at the Council of Nicaea.",
    aliases: "Athanasius the Great, Pope Athanasius I",
    keyWorks: [
      "On the Incarnation",
      "Against the Arians",
      "Life of Antony",
    ],
  },
  {
    id: "dietrich-bonhoeffer",
    name: "Dietrich Bonhoeffer",
    era: "Modern",
    tradition: "Lutheran",
    birthYear: 1906,
    deathYear: 1945,
    hasPortrait: true,
    hasResearchCorpus: false,
    profileCompleteness: "partial",
    publicResults: 67,
    customTeamInclusions: 22,
    bio: "Dietrich Bonhoeffer was a German Lutheran pastor, theologian, and anti-Nazi dissident. He was a key founding member of the Confessing Church and his writings on Christianity's role in the secular world have become widely influential.",
    aliases: undefined,
    keyWorks: [
      "The Cost of Discipleship",
      "Life Together",
      "Letters and Papers from Prison",
      "Ethics",
    ],
  },
  {
    id: "jonathan-edwards",
    name: "Jonathan Edwards",
    era: "Modern",
    tradition: "Reformed",
    birthYear: 1703,
    deathYear: 1758,
    hasPortrait: false,
    hasResearchCorpus: false,
    profileCompleteness: "minimal",
    publicResults: 23,
    customTeamInclusions: 8,
    aliases: undefined,
    keyWorks: [
      "Religious Affections",
      "Freedom of the Will",
      "Sinners in the Hands of an Angry God",
    ],
  },
  {
    id: "cs-lewis",
    name: "C.S. Lewis",
    era: "Modern",
    tradition: "Anglican",
    birthYear: 1898,
    deathYear: 1963,
    hasPortrait: true,
    hasResearchCorpus: false,
    profileCompleteness: "partial",
    publicResults: 112,
    customTeamInclusions: 47,
    bio: "Clive Staples Lewis was a British writer and lay theologian. He is best known for his fictional works, especially The Screwtape Letters, The Chronicles of Narnia, and The Space Trilogy, as well as his non-fiction Christian apologetics such as Mere Christianity and The Problem of Pain.",
    aliases: "Clive Staples Lewis, Jack Lewis",
    keyWorks: [
      "Mere Christianity",
      "The Screwtape Letters",
      "The Problem of Pain",
      "The Abolition of Man",
      "Surprised by Joy",
    ],
  },
  {
    id: "nt-wright",
    name: "N.T. Wright",
    era: "Modern",
    tradition: "Anglican",
    birthYear: 1948,
    hasPortrait: false,
    hasResearchCorpus: false,
    profileCompleteness: "minimal",
    publicResults: 15,
    customTeamInclusions: 5,
    aliases: "Tom Wright, Nicholas Thomas Wright",
    keyWorks: [
      "The New Testament and the People of God",
      "Jesus and the Victory of God",
      "The Resurrection of the Son of God",
      "Surprised by Hope",
    ],
  },
];

// ── Completeness Summary ──────────────────────────────────────────

export const theologianCompleteness = {
  full: 214,
  partial: 98,
  minimal: 38,
  total: 350,
};
