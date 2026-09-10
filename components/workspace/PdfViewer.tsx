"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import type { BBox } from "@/lib/types";
import { detectQuestionRegions, type PdfTextItem } from "@/lib/pdf/questions";
import { setLivePage } from "@/lib/pdf/live-page";
import { InkBar } from "./InkBar";
import { LeaveButton } from "./LeaveButton";
import { Overlay } from "./Overlay";
import { Pointer } from "./Pointer";
import {
  paintInkOnImage,
  type InkColor,
  type InkStroke,
  type InkTool,
} from "./ink";

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
  active = true,
  onReady,
  onExit,
}: {
  psetId: string;
  title: string;
  fileUrl: string;
  onReady?: (info: { title: string; pages: number }) => void;
  onExit?: () => void;
  active?: boolean;
  pointer?: { page: number; x: number; y: number; label?: string };
  highlight?: { page: number; bbox: BBox };
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<PageView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [strokes, setStrokes] = useState<InkStroke[]>([]);
  const [tool, setTool] = useState<InkTool>("hand");
  const [color, setColor] = useState<InkColor>("ink");
  const [current, setCurrent] = useState(0);
  const [laser, setLaser] = useState<{ x: number; y: number; label?: string } | null>(
    null,
  );
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const reduceMotion = useReducedMotion() ?? false;

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
      setCurrent(0);
      setStrokes([]);
      if (nextPages[0]) {
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

  // Whichever page the student is looking at is the page the tutor sees. This
  // used to update only when the tutor pointed, so scrolling left it blind.
  useEffect(() => {
    const host = hostRef.current;
    if (!host || !pages.length) return;
    const sheets = Array.from(host.querySelectorAll<HTMLElement>("[data-page]"));
    if (!sheets.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const best = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!best) return;
        const index = Number((best.target as HTMLElement).dataset.page);
        if (Number.isFinite(index)) setCurrent(index);
      },
      { root: host, threshold: [0.25, 0.5, 0.75] },
    );

    for (const sheet of sheets) observer.observe(sheet);
    return () => observer.disconnect();
  }, [pages]);

  useEffect(() => {
    if (!active) {
      setLivePage(null);
      return;
    }

    const page = pages[current];
    if (!page) return;
    const pageStrokes = strokes.filter((stroke) => stroke.page === current);
    let cancelled = false;

    const publish = async () => {
      const imageUrl = pageStrokes.length
        ? await paintInkOnImage(page.visionUrl, pageStrokes)
        : page.visionUrl;
      if (cancelled) return;
      setLivePage({
        psetId,
        title,
        page: current,
        pages: pages.length,
        imageUrl,
        text: page.text,
        questionRegions: page.questionRegions,
        studentMarks: pageStrokes.length,
      });
    };

    void publish();
    return () => {
      cancelled = true;
    };
  }, [active, current, strokes, pages, psetId, title]);

  const goToPage = (index: number) => {
    const clamped = Math.min(Math.max(index, 0), pages.length - 1);
    setCurrent(clamped);
    hostRef.current
      ?.querySelector(`[data-page="${clamped}"]`)
      ?.scrollIntoView({ block: "start" });
  };

  useEffect(() => {
    if (!pointer || !hostRef.current) return;
    const index = Math.max(0, pointer.page - 1);
    hostRef.current
      .querySelector(`[data-page="${index}"]`)
      ?.scrollIntoView({ block: "center" });
  }, [pointer]);

  // The laser lives on the visible frame, not on a single page sheet, so it
  // can travel between problems instead of unmounting and appearing again.
  useEffect(() => {
    const frame = frameRef.current;
    const stack = hostRef.current;
    if (!frame || !pointer) {
      setLaser(null);
      return;
    }

    const update = () => {
      const sheet = frame.querySelector<HTMLElement>(
        `[data-page="${Math.max(0, pointer.page - 1)}"]`,
      );
      if (!sheet) return;
      const frameBox = frame.getBoundingClientRect();
      const sheetBox = sheet.getBoundingClientRect();
      if (frameBox.width < 1 || frameBox.height < 1) return;
      const x =
        (sheetBox.left - frameBox.left + pointer.x * sheetBox.width) / frameBox.width;
      const y =
        (sheetBox.top - frameBox.top + pointer.y * sheetBox.height) / frameBox.height;
      // Off the visible frame: hide rather than pin a laser to the margin.
      if (x < -0.04 || x > 1.04 || y < -0.04 || y > 1.04) {
        setLaser(null);
        return;
      }
      setLaser({ x, y, label: pointer.label });
    };

    update();
    stack?.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    return () => {
      stack?.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [pointer]);

  if (error) {
    return <p className="p-6 text-sm text-zinc-500">{error}</p>;
  }

  return (
    <div className="desk-body">
      <div className="pdf-bar">
        {onExit ? <LeaveButton onLeave={onExit} /> : null}
        <span className="pdf-title">{title}</span>
        {pages.length > 1 ? (
          <>
            <button
              type="button"
              className="desk-button desk-step"
              onClick={() => goToPage(current - 1)}
              disabled={current === 0}
              aria-label="Previous page"
            >
              Prev
            </button>
            <span className="pdf-pages">
              {current + 1} / {pages.length}
            </span>
            <button
              type="button"
              className="desk-button desk-step"
              onClick={() => goToPage(current + 1)}
              disabled={current >= pages.length - 1}
              aria-label="Next page"
            >
              Next
            </button>
          </>
        ) : null}
      </div>
      <div className="pdf-tools">
        <InkBar
          tool={tool}
          color={color}
          onTool={(next) => {
            setTool(next);
            if (next === "highlighter" && color === "ink") setColor("gold");
          }}
          onColor={(next) => {
            setColor(next);
            if (tool === "hand" || tool === "eraser") setTool("pen");
          }}
        />
      </div>
      <div ref={frameRef} className="page-frame">
        <div ref={hostRef} className="page-stack">
          {pages.map((page) => {
            const pageNumber = page.index + 1;
            const pageHighlight =
              highlight && highlight.page === pageNumber ? highlight.bbox : undefined;

            return (
              <div key={page.index} data-page={page.index} className="page-sheet">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={page.displayUrl} alt={`Page ${pageNumber}`} />
                <Overlay
                  page={page.index}
                  highlight={pageHighlight}
                  strokes={strokes.filter((stroke) => stroke.page === page.index)}
                  tool={tool}
                  color={color}
                  onStroke={(stroke) => {
                    setStrokes((existing) => [...existing, stroke]);
                  }}
                  onErase={(ids) => {
                    const forget = new Set(ids);
                    setStrokes((existing) => existing.filter((stroke) => !forget.has(stroke.id)));
                  }}
                />
              </div>
            );
          })}
        </div>
        {laser ? (
          <Pointer
            x={laser.x}
            y={laser.y}
            label={laser.label}
            reduceMotion={reduceMotion}
          />
        ) : null}
      </div>
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
