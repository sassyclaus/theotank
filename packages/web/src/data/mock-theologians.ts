export interface Theologian {
  name: string;
  initials: string;
  tradition: string;
  color: string;
}

export const featuredTheologians: Theologian[] = [
  { name: "Augustine of Hippo", initials: "AH", tradition: "Patristic", color: "#7A2E2E" },
  { name: "Thomas Aquinas", initials: "TA", tradition: "Catholic", color: "#1B6B6D" },
  { name: "John Calvin", initials: "JC", tradition: "Reformed", color: "#5A7A62" },
  { name: "Martin Luther", initials: "ML", tradition: "Lutheran", color: "#B8963E" },
  { name: "Karl Barth", initials: "KB", tradition: "Neo-Orthodox", color: "#6B6560" },
  { name: "John Wesley", initials: "JW", tradition: "Methodist", color: "#1B6B6D" },
  { name: "Athanasius", initials: "AT", tradition: "Patristic", color: "#7A2E2E" },
  { name: "Jonathan Edwards", initials: "JE", tradition: "Reformed", color: "#5A7A62" },
  { name: "Irenaeus of Lyon", initials: "IL", tradition: "Patristic", color: "#B8963E" },
  { name: "John Chrysostom", initials: "JC", tradition: "Orthodox", color: "#6B6560" },
  { name: "Tertullian", initials: "TE", tradition: "Patristic", color: "#1B6B6D" },
  { name: "Anselm of Canterbury", initials: "AC", tradition: "Catholic", color: "#7A2E2E" },
];
