import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Split text on newline characters into non-empty paragraph strings. */
export function splitParagraphs(text: string): string[] {
  return text.split(/\n+/).filter(Boolean);
}
