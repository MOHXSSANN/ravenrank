import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function percent(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

export function pairwise<T>(arr: T[]): [T, T][] {
  const pairs: [T, T][] = [];
  for (let i = 0; i < arr.length - 1; i++) {
    pairs.push([arr[i], arr[i + 1]]);
  }
  return pairs;
}

export const TERM_SEASONS: Record<number, string> = {
  0: "Winter",
  1: "Summer",
  2: "Fall",
};

export function termIdToString(termId: number): string {
  const year = Math.floor(termId / 10);
  const season = termId % 10;
  return `${TERM_SEASONS[season] || "Unknown"} ${year}`;
}
