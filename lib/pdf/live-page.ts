import type { BBox } from "@/lib/types";

export type LivePage = {
  psetId: string;
  title: string;
  page: number;
  pages: number;
  imageUrl: string;
  text: string;
  questionRegions: { label: string; bbox: BBox }[];
};

let live: LivePage | null = null;

export function setLivePage(next: LivePage | null) {
  live = next;
}

export function getLivePage(): LivePage | null {
  return live;
}
