import type { InkStroke } from '@/components/workspace/ink';

export type PdfViewState = {
  current: number;
  zoom: number;
  ink: { past: InkStroke[][]; present: InkStroke[]; future: InkStroke[][] };
};
