"use client";

import { useEffect, useRef, useState } from "react";
import type { BBox, StudentAnnotation } from "@/lib/types";
import { detectQuestionRegions, type PdfTextItem } from "@/lib/pdf/questions";
import { setLivePage } from "@/lib/pdf/live-page";
import { Overlay } from "./Overlay";

const MAX_VISION_WIDTH = 1024;

type PageView = {
  index: number;
  displayUrl: string;
  visionUrl: string;
  text: string;
  questionRegions: { label: string; bbox: BBox }[];
};

export function PdfViewer({
  psetId,
  title,
  fileUrl,
  pointer,
  highlight,
  onReady,
}: {
  psetId: string;
  title: string;
  fileUrl: string;
  onReady?: (info: { title: string; pages: number }) => void;
  pointer?: { page: number; x: number; y: number; label?: string };
  highlight?: { page: number; bbox: BBox };
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<PageView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [marks, setMarks] = useState<StudentAnnotation[]>([]);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      const doc = await pdfjs.getDocument({ url: fileUrl, withCredentials: false }).promise;
      const nextPages: PageView[] = [];

      for (let i = 0; i < doc.numPages; i++) {
        const page = await doc.getPage(i + 1);
        const unscaled = page.getViewport({ scale: 1 });
        const scale = Math.min(1.6, 800 / unscaled.width);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) continue;
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        await page.render({ canvasContext: context, viewport, canvas }).promise;

        const content = await page.getTextContent();
        const items: PdfTextItem[] = [];
        const strings: string[] = [];
        for (const raw of content.items) {
          if (!("str" in raw) || !raw.str) continue;
          const item = raw as {
            str: string;
            transform: number[];
            width: number;
            height: number;
          };
          const [x, y] = viewport.convertToViewportPoint(
            item.transform[4],
            item.transform[5],
          );
          const h = item.height * scale;
          items.push({
            str: item.str,
            x,
            y: y - h,
            w: item.width * scale,
            h,
            pageWidth: viewport.width,
            pageHeight: viewport.height,
          });
          strings.push(item.str);
        }

        nextPages.push({
          index: i,
          displayUrl: canvas.toDataURL("image/jpeg", 0.85),
          visionUrl: snapshot(canvas),
          text: strings.join(" "),
          questionRegions: detectQuestionRegions(items),
        });
      }

      if (cancelled) return;
      setPages(nextPages);
      const first = nextPages[0];
      if (first) {
        setLivePage({
          psetId,
          title,
          page: 0,
          pages: nextPages.length,
          imageUrl: first.visionUrl,
          text: first.text,
          questionRegions: first.questionRegions,
        });
        // Fired here rather than on upload, so that by the time the tutor
        // speaks it can actually read the page.
        onReadyRef.current?.({ title, pages: nextPages.length });
      }
    };

    void run().catch((err: unknown) => {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : "Could not read this PDF");
      }
    });

    return () => {
      cancelled = true;
      setLivePage(null);
    };
  }, [fileUrl, psetId, title]);

  useEffect(() => {
    if (!pointer || !hostRef.current) return;
    const index = Math.max(0, pointer.page - 1);
    const node = hostRef.current.querySelector(`[data-page="${index}"]`);
    node?.scrollIntoView({ behavior: "smooth", block: "center" });
    const page = pages[index];
    if (page) {
      setLivePage({
        psetId,
        title,
        page: index,
        pages: pages.length,
        imageUrl: page.visionUrl,
        text: page.text,
        questionRegions: page.questionRegions,
      });
    }
  }, [pointer, pages, psetId, title]);

  if (error) {
    return <p className="p-6 text-sm text-zinc-500">{error}</p>;
  }

  return (
    <div ref={hostRef} className="page-stack">
      {pages.map((page) => {
        const pageNumber = page.index + 1;
        const pagePointer =
          pointer && pointer.page === pageNumber
            ? { x: pointer.x, y: pointer.y, label: pointer.label }
            : undefined;
        const pageHighlight =
          highlight && highlight.page === pageNumber ? highlight.bbox : undefined;

        return (
          <div
            key={page.index}
            data-page={page.index}
            className="page-sheet"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={page.displayUrl} alt={`Page ${pageNumber}`} />
            <Overlay
              pointer={pagePointer}
              highlight={pageHighlight}
              annotations={marks.filter((mark) => mark.page === page.index)}
              onAnnotate={(kind, bbox) => {
                setMarks((current) => [
                  ...current,
                  {
                    page: page.index,
                    bbox,
                    kind,
                    at: new Date().toISOString(),
                  },
                ]);
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

function snapshot(canvas: HTMLCanvasElement): string {
  const scale = Math.min(1, MAX_VISION_WIDTH / canvas.width);
  if (scale === 1) return canvas.toDataURL("image/jpeg", 0.72);
  const out = document.createElement("canvas");
  out.width = Math.round(canvas.width * scale);
  out.height = Math.round(canvas.height * scale);
  const ctx = out.getContext("2d");
  if (!ctx) return canvas.toDataURL("image/jpeg", 0.72);
  ctx.drawImage(canvas, 0, 0, out.width, out.height);
  return out.toDataURL("image/jpeg", 0.72);
}
