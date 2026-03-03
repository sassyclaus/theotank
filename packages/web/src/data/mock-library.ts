// ── Types ────────────────────────────────────────────────────────────

export type LibraryToolType = "ask" | "poll" | "super_poll" | "review" | "research";
export type LibraryItemStatus = "complete" | "processing" | "failed";
export type LibraryTab = "my-library" | "explore";
export type ExploreSortOption = "relevance" | "recent" | "most-viewed" | "most-saved";

export interface PollBar {
  label: string;
  percentage: number;
}

export type LibraryPreview =
  | { type: "ask"; conclusion: string }
  | { type: "poll"; bars: PollBar[] }
  | { type: "super_poll"; bars: PollBar[]; totalRespondents: number }
  | { type: "review"; grade: string }
  | { type: "research"; citedSourcesCount: number };

export interface MyLibraryItem {
  id: string;
  title: string;
  tool: LibraryToolType;
  team: string;
  date: string;
  status: LibraryItemStatus;
  preview: LibraryPreview;
  pdfKey?: string | null;
}

export interface CuratedCollection {
  id: string;
  title: string;
  description: string;
  resultCount: number;
  coverColor: string;
}

export interface LibraryFilterOption {
  id: string;
  label: string;
}

// ── Config Maps ─────────────────────────────────────────────────────

import { MessageCircle, BarChart3, FileCheck, BookOpen, type LucideIcon } from "lucide-react";

import { Globe } from "lucide-react";

export const TOOL_ICONS: Record<LibraryToolType, LucideIcon> = {
  ask: MessageCircle,
  poll: BarChart3,
  super_poll: Globe,
  review: FileCheck,
  research: BookOpen,
};

export const TOOL_LABELS: Record<LibraryToolType, string> = {
  ask: "Ask",
  poll: "Poll",
  super_poll: "Super Poll",
  review: "Review",
  research: "Research",
};

export const TOOL_COLORS: Record<LibraryToolType, { bg: string; text: string }> = {
  ask: { bg: "bg-teal/10", text: "text-teal" },
  poll: { bg: "bg-teal/10", text: "text-teal" },
  super_poll: { bg: "bg-teal/10", text: "text-teal" },
  review: { bg: "bg-teal/10", text: "text-teal" },
  research: { bg: "bg-oxblood/10", text: "text-oxblood" },
};

// ── Filters ─────────────────────────────────────────────────────────

export const toolTypeFilters: LibraryFilterOption[] = [
  { id: "all", label: "All" },
  { id: "ask", label: "Ask" },
  { id: "poll", label: "Poll" },
  { id: "review", label: "Review" },
  { id: "research", label: "Research" },
];

export const teamFilters: LibraryFilterOption[] = [
  { id: "all", label: "All Teams" },
  { id: "church-fathers", label: "Church Fathers" },
  { id: "reformers", label: "Reformers" },
  { id: "modern-theologians", label: "Modern Theologians" },
  { id: "catholic-doctors", label: "Catholic Doctors" },
  { id: "all-theologians", label: "All Theologians" },
];

// ── My Library Items ────────────────────────────────────────────────

export const myLibraryItems: MyLibraryItem[] = [
  {
    id: "ml-1",
    title: "How did the early church understand justification?",
    tool: "ask",
    team: "Church Fathers",
    date: "Feb 20, 2026",
    status: "complete",
    preview: {
      type: "ask",
      conclusion:
        "The panel identified three distinct strands of justification theology in the ante-Nicene period, noting that Irenaeus emphasized recapitulation while Augustine later shifted toward imputed righteousness.",
    },
  },
  {
    id: "ml-2",
    title: "Is penal substitutionary atonement the best framework for understanding the cross?",
    tool: "ask",
    team: "All Theologians",
    date: "Feb 18, 2026",
    status: "complete",
    preview: {
      type: "ask",
      conclusion:
        "The panel was divided: Reformed voices strongly affirmed PSA as central, while Orthodox and Catholic panelists preferred Christus Victor and satisfaction models respectively.",
    },
  },
  {
    id: "ml-3",
    title: "What role does natural theology play in modern apologetics?",
    tool: "ask",
    team: "Modern Theologians",
    date: "Feb 17, 2026",
    status: "processing",
    preview: { type: "ask", conclusion: "" },
  },
  {
    id: "ml-4",
    title: "Can a coherent doctrine of the Trinity be articulated without the filioque clause?",
    tool: "ask",
    team: "Church Fathers",
    date: "Feb 14, 2026",
    status: "complete",
    preview: {
      type: "ask",
      conclusion:
        "Eastern panelists argued persuasively that the monarchy of the Father provides sufficient trinitarian structure, while Western voices maintained that filioque guards against subordinationism.",
    },
  },
  {
    id: "ml-5",
    title: "Should women be ordained to pastoral ministry?",
    tool: "poll",
    team: "All Theologians",
    date: "Feb 15, 2026",
    status: "complete",
    preview: {
      type: "poll",
      bars: [
        { label: "In favor", percentage: 44 },
        { label: "Opposed", percentage: 39 },
        { label: "Nuanced", percentage: 17 },
      ],
    },
  },
  {
    id: "ml-6",
    title: "Is infant baptism scripturally warranted?",
    tool: "poll",
    team: "Reformers",
    date: "Feb 10, 2026",
    status: "complete",
    preview: {
      type: "poll",
      bars: [
        { label: "Yes", percentage: 62 },
        { label: "No", percentage: 25 },
        { label: "Unclear", percentage: 13 },
      ],
    },
  },
  {
    id: "ml-7",
    title: "Review of 'Mere Christianity' Chapter 3 argument",
    tool: "review",
    team: "Reformers",
    date: "Feb 12, 2026",
    status: "complete",
    preview: { type: "review", grade: "B+" },
  },
  {
    id: "ml-8",
    title: "Review of student paper on Barth's doctrine of election",
    tool: "review",
    team: "Modern Theologians",
    date: "Feb 8, 2026",
    status: "failed",
    preview: { type: "review", grade: "" },
  },
  {
    id: "ml-9",
    title: "What does Aquinas say about the natural law and eternal law?",
    tool: "research",
    team: "Thomas Aquinas",
    date: "Feb 19, 2026",
    status: "complete",
    preview: { type: "research", citedSourcesCount: 5 },
  },
  {
    id: "ml-10",
    title: "How does Aquinas distinguish the analogy of proportionality from attribution?",
    tool: "research",
    team: "Thomas Aquinas",
    date: "Feb 16, 2026",
    status: "complete",
    preview: { type: "research", citedSourcesCount: 3 },
  },
];

// ── Curated Collections ─────────────────────────────────────────────

export const curatedCollections: CuratedCollection[] = [
  {
    id: "cc-1",
    title: "The Atonement Debate",
    description:
      "Penal substitution, Christus Victor, moral influence, and satisfaction — the major theories explored across traditions.",
    resultCount: 42,
    coverColor: "border-t-teal",
  },
  {
    id: "cc-2",
    title: "Baptism Through the Ages",
    description:
      "From the Didache to the Baptist confessions — how the church has understood the waters of initiation.",
    resultCount: 31,
    coverColor: "border-t-gold",
  },
  {
    id: "cc-3",
    title: "Reformation's Unfinished Arguments",
    description:
      "Justification, sola scriptura, and ecclesiology — the debates that still divide and define Protestantism.",
    resultCount: 57,
    coverColor: "border-t-oxblood",
  },
];

