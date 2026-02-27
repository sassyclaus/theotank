export interface Theologian {
  name: string;
  dates: string;
  era: string;
  initials: string;
  color: string;
  portraitSrc?: string;
}

export const eras = [
  "Apostolic",
  "Patristic",
  "Medieval",
  "Reformation",
  "Post-Reformation",
  "Modern",
] as const;

export type Era = (typeof eras)[number];

export const theologians: Theologian[] = [
  // Apostolic
  { name: "Paul of Tarsus", dates: "c. 5–c. 64", era: "Apostolic", initials: "PT", color: "#7A2E2E" },
  { name: "Ignatius of Antioch", dates: "c. 35–c. 108", era: "Apostolic", initials: "IA", color: "#1B6B6D" },
  { name: "Polycarp", dates: "c. 69–c. 155", era: "Apostolic", initials: "Po", color: "#5A7A62" },
  { name: "Clement of Rome", dates: "c. 35–c. 99", era: "Apostolic", initials: "CR", color: "#B8963E" },

  // Patristic
  { name: "Origen", dates: "c. 185–c. 253", era: "Patristic", initials: "Or", color: "#7A2E2E" },
  { name: "Athanasius", dates: "296–373", era: "Patristic", initials: "At", color: "#1B6B6D" },
  { name: "Augustine", dates: "354–430", era: "Patristic", initials: "Au", color: "#5A7A62" },
  { name: "John Chrysostom", dates: "347–407", era: "Patristic", initials: "JC", color: "#B8963E" },
  { name: "Basil of Caesarea", dates: "329–379", era: "Patristic", initials: "BC", color: "#C4573A" },
  { name: "Gregory of Nazianzus", dates: "329–390", era: "Patristic", initials: "GN", color: "#7A2E2E" },

  // Medieval
  { name: "Anselm of Canterbury", dates: "1033–1109", era: "Medieval", initials: "AC", color: "#1B6B6D" },
  { name: "Thomas Aquinas", dates: "1225–1274", era: "Medieval", initials: "TA", color: "#5A7A62" },
  { name: "Bonaventure", dates: "1221–1274", era: "Medieval", initials: "Bo", color: "#B8963E" },
  { name: "Hildegard of Bingen", dates: "1098–1179", era: "Medieval", initials: "HB", color: "#C4573A" },
  { name: "Peter Lombard", dates: "c. 1096–1160", era: "Medieval", initials: "PL", color: "#7A2E2E" },
  { name: "Duns Scotus", dates: "1266–1308", era: "Medieval", initials: "DS", color: "#1B6B6D" },

  // Reformation
  { name: "Martin Luther", dates: "1483–1546", era: "Reformation", initials: "ML", color: "#5A7A62" },
  { name: "John Calvin", dates: "1509–1564", era: "Reformation", initials: "JCa", color: "#B8963E" },
  { name: "Huldrych Zwingli", dates: "1484–1531", era: "Reformation", initials: "HZ", color: "#C4573A" },
  { name: "Menno Simons", dates: "1496–1561", era: "Reformation", initials: "MS", color: "#7A2E2E" },
  { name: "Thomas Cranmer", dates: "1489–1556", era: "Reformation", initials: "TC", color: "#1B6B6D" },
  { name: "Philip Melanchthon", dates: "1497–1560", era: "Reformation", initials: "PM", color: "#5A7A62" },

  // Post-Reformation
  { name: "John Wesley", dates: "1703–1791", era: "Post-Reformation", initials: "JW", color: "#B8963E" },
  { name: "Jonathan Edwards", dates: "1703–1758", era: "Post-Reformation", initials: "JE", color: "#C4573A" },
  { name: "Friedrich Schleiermacher", dates: "1768–1834", era: "Post-Reformation", initials: "FS", color: "#7A2E2E" },
  { name: "John Owen", dates: "1616–1683", era: "Post-Reformation", initials: "JO", color: "#1B6B6D" },
  { name: "Blaise Pascal", dates: "1623–1662", era: "Post-Reformation", initials: "BP", color: "#5A7A62" },

  // Modern
  { name: "Karl Barth", dates: "1886–1968", era: "Modern", initials: "KB", color: "#B8963E" },
  { name: "Dietrich Bonhoeffer", dates: "1906–1945", era: "Modern", initials: "DB", color: "#C4573A" },
  { name: "C.S. Lewis", dates: "1898–1963", era: "Modern", initials: "CL", color: "#7A2E2E" },
  { name: "N.T. Wright", dates: "1948–", era: "Modern", initials: "NW", color: "#1B6B6D" },
  { name: "Hans Urs von Balthasar", dates: "1905–1988", era: "Modern", initials: "HB", color: "#5A7A62" },
  { name: "Wolfhart Pannenberg", dates: "1928–2014", era: "Modern", initials: "WP", color: "#B8963E" },
];
