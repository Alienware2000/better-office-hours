"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
const ZOOM_MIN = 0.75;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 0.25;

function clampZoom(value: number) {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(value * 20) / 20));
}

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
  onRemove,
}: {
  psetId: string;
  title: string;
  fileUrl: string;
  onReady?: (info: { title: string; pages: number }) => void;
  onExit?: () => void;
  onRemove?: () => void;
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
  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(1);
  zoomRef.current = zoom;
  const [fitWidth, setFitWidth] = useState(0);
  const [panning, setPanning] = useState(false);
  const [laser, setLaser] = useState<{ x: number; y: number; label?: string } | null>(
    null,
  );
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const activeRef = useRef(active);
  activeRef.current = active;
  const toolRef = useRef(tool);
  toolRef.current = tool;
  const zoomFocusRef = useRef<{ x: number; y: number; fx: number; fy: number } | null>(
    null,
  );
  const resetFitRef = useRef(false);
  const gestureZoomRef = useRef(1);
  const reduceMotion = useReducedMotion() ?? false;

  const zoomAround = (next: number, clientX?: number, clientY?: number) => {
    const stack = hostRef.current;
    const prev = zoomRef.current;
    const clamped = clampZoom(next);
    if (clamped === prev) return;
    if (clamped === 1 && clientX === undefined) {
      resetFitRef.current = true;
      setZoom(1);
      return;
    }
    if (stack) {
      const rect = stack.getBoundingClientRect();
      const styles = getComputedStyle(stack);
      const padLeft = parseFloat(styles.paddingLeft) || 0;
      const padTop = parseFloat(styles.paddingTop) || 0;
      const fx = (clientX ?? rect.left + rect.width / 2) - rect.left;
      // Buttons zoom around the reading band, not the empty middle of the desk.
      const fy =
        (clientY ?? rect.top + Math.min(rect.height * 0.32, 220)) - rect.top;
      zoomFocusRef.current = {
        x: (stack.scrollLeft + fx - padLeft) / prev,
        y: (stack.scrollTop + fy - padTop) / prev,
        fx,
        fy,
      };
    }
    setZoom(clamped);
  };
  const zoomAroundRef = useRef(zoomAround);
  zoomAroundRef.current = zoomAround;

  useLayoutEffect(() => {
    const stack = hostRef.current;
    if (!stack) return;
    if (resetFitRef.current) {
      resetFitRef.current = false;
      stack.scrollLeft = 0;
      return;
    }
    const focus = zoomFocusRef.current;
    zoomFocusRef.current = null;
    if (!focus) return;
    const styles = getComputedStyle(stack);
    const padLeft = parseFloat(styles.paddingLeft) || 0;
    const padTop = parseFloat(styles.paddingTop) || 0;
    stack.scrollLeft = focus.x * zoom + padLeft - focus.fx;
    stack.scrollTop = focus.y * zoom + padTop - focus.fy;
  }, [zoom]);

  useEffect(() => {
    const stack = hostRef.current;
    if (!stack) return;
    const measure = () => {
      const styles = getComputedStyle(stack);
      const pad =
        (parseFloat(styles.paddingLeft) || 0) + (parseFloat(styles.paddingRight) || 0);
      setFitWidth(Math.max(0, stack.clientWidth - pad));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stack);
    return () => observer.disconnect();
  }, [pages.length]);

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
      setZoom(1);
      if (nextPages[0]) {
        // Publish before onReady so the pset_ready turn can actually see the page.
        if (activeRef.current) {
          setLivePage({
            psetId,
            title,
            page: 0,
            pages: nextPages.length,
            imageUrl: nextPages[0].visionUrl,
            text: nextPages[0].text,
            questionRegions: nextPages[0].questionRegions,
            studentMarks: 0,
          });
        }
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
    const frame = frameRef.current;
    if (!frame) return;

    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const factor = Math.exp(-event.deltaY * 0.01);
      zoomAroundRef.current(zoomRef.current * factor, event.clientX, event.clientY);
    };

    const onGesture = (event: Event) => {
      event.preventDefault();
      const gesture = event as Event & { scale?: number };
      if (event.type === "gesturestart") {
        gestureZoomRef.current = zoomRef.current;
        return;
      }
      if (event.type === "gesturechange" && typeof gesture.scale === "number") {
        const rect = frame.getBoundingClientRect();
        zoomAroundRef.current(
          gestureZoomRef.current * gesture.scale,
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
        );
      }
    };

    frame.addEventListener("wheel", onWheel, { passive: false });
    frame.addEventListener("gesturestart", onGesture, { passive: false });
    frame.addEventListener("gesturechange", onGesture, { passive: false });
    return () => {
      frame.removeEventListener("wheel", onWheel);
      frame.removeEventListener("gesturestart", onGesture);
      frame.removeEventListener("gesturechange", onGesture);
    };
  }, [pages]);

  useEffect(() => {
    const stack = hostRef.current;
    if (!stack || tool !== "hand") return;

    let dragging = false;
    let pointerId = 0;
    let originX = 0;
    let originY = 0;
    let startLeft = 0;
    let startTop = 0;

    const onDown = (event: PointerEvent) => {
      if (event.button !== 0 || toolRef.current !== "hand") return;
      dragging = true;
      pointerId = event.pointerId;
      originX = event.clientX;
      originY = event.clientY;
      startLeft = stack.scrollLeft;
      startTop = stack.scrollTop;
      setPanning(true);
      try {
        stack.setPointerCapture(pointerId);
      } catch {
        // Capture is best-effort; move/up still land on the stack.
      }
      event.preventDefault();
    };
    const onMove = (event: PointerEvent) => {
      if (!dragging || event.pointerId !== pointerId) return;
      stack.scrollLeft = startLeft - (event.clientX - originX);
      stack.scrollTop = startTop - (event.clientY - originY);
    };
    const onUp = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      dragging = false;
      setPanning(false);
    };

    stack.addEventListener("pointerdown", onDown);
    stack.addEventListener("pointermove", onMove);
    stack.addEventListener("pointerup", onUp);
    stack.addEventListener("pointercancel", onUp);
    return () => {
      stack.removeEventListener("pointerdown", onDown);
      stack.removeEventListener("pointermove", onMove);
      stack.removeEventListener("pointerup", onUp);
      stack.removeEventListener("pointercancel", onUp);
    };
  }, [pages, tool]);

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
      ?.scrollIntoView({ block: "start", behavior: reduceMotion ? "auto" : "smooth" });
  };

  useEffect(() => {
    if (!pointer || !hostRef.current) return;
    const index = Math.max(0, pointer.page - 1);
    hostRef.current
      .querySelector(`[data-page="${index}"]`)
      ?.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
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
  }, [pointer, zoom]);

  if (error) {
    return <p className="p-6 text-sm text-zinc-500">{error}</p>;
  }

  return (
    <div className="desk-body">
      <div className="pdf-bar">
        {onExit ? <LeaveButton onLeave={onExit} /> : null}
        <span className="pdf-title">{title}</span>
        {onRemove ? (
          <button
            type="button"
            className="desk-button desk-remove"
            onClick={onRemove}
            aria-label="Remove this problem set"
          >
            Remove
          </button>
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
        >
          <div className="ink-cluster" role="group" aria-label="Zoom">
            <button
              type="button"
              className="ink-tool view-mark"
              aria-label="Zoom out"
              disabled={zoom <= ZOOM_MIN}
              onClick={() => zoomAround(zoom - ZOOM_STEP)}
            >
              −
            </button>
            <button
              type="button"
              className="view-zoom"
              aria-label="Reset zoom"
              onClick={() => zoomAround(1)}
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              className="ink-tool view-mark"
              aria-label="Zoom in"
              disabled={zoom >= ZOOM_MAX}
              onClick={() => zoomAround(zoom + ZOOM_STEP)}
            >
              +
            </button>
          </div>
          {pages.length > 1 ? (
            <div className="ink-cluster" aria-label="Pages">
              <button
                type="button"
                className="ink-tool view-mark"
                onClick={() => goToPage(current - 1)}
                disabled={current === 0}
                aria-label="Previous page"
              >
                ‹
              </button>
              <span className="view-pages">
                {current + 1} / {pages.length}
              </span>
              <button
                type="button"
                className="ink-tool view-mark"
                onClick={() => goToPage(current + 1)}
                disabled={current >= pages.length - 1}
                aria-label="Next page"
              >
                ›
              </button>
            </div>
          ) : null}
        </InkBar>
      </div>
      <div ref={frameRef} className="page-frame">
        <div
          ref={hostRef}
          className={[
            "page-stack",
            tool === "hand" ? "is-hand" : "",
            panning ? "is-panning" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {pages.map((page) => {
            const pageNumber = page.index + 1;
            const pageHighlight =
              highlight && highlight.page === pageNumber ? highlight.bbox : undefined;

            return (
              <div
                key={page.index}
                className="page-zoom"
                style={{ width: fitWidth > 0 ? fitWidth * zoom : `${zoom * 100}%` }}
              >
                <div data-page={page.index} className="page-sheet">
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
                      setStrokes((existing) =>
                        existing.filter((stroke) => !forget.has(stroke.id)),
                      );
                    }}
                  />
                </div>
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
