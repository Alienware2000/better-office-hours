import type { BBox } from "@/lib/types";

export type LivePage = {
  psetId: string;
  documentKind?: "pset" | "notes";
  title: string;
  page: number;
  pages: number;
  imageUrl: string;
  text: string;
  questionRegions: { label: string; bbox: BBox }[];
  // Ink the student drew on this page. Count only; the marks themselves are
  // burned into imageUrl so the model can see them.
  studentMarks?: number;
};

let live: LivePage | null = null;

export function setLivePage(next: LivePage | null) {
  live = next;
}

export function getLivePage(): LivePage | null {
  return live;
}
