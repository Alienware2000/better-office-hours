"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { hitInk, inkBounds, moveInk, type InkBounds, type InkPoint } from '@/lib/whiteboard/ink-path';
import { getBoardState, pauseAnimation, setStudentStrokes, type BoardStroke } from '@/lib/whiteboard/store';
import type { StudentInk } from '@/lib/whiteboard/colors';
import type { BoardTool } from './BoardInkBar';

type Gesture = {
  pointer: number; tool: BoardTool; color: StudentInk; origin: DOMRect;
  start: InkPoint; points: InkPoint[]; before: BoardStroke[]; next: BoardStroke[];
  ids: string[]; box: InkBounds | null; moved: boolean;
};
const pointAt = (event: { clientX: number; clientY: number }, rect: DOMRect) => ({
  x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
  y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
});

export function useBoardInk(tool: BoardTool, color: StudentInk) {
  const [draft, setDraft] = useState<InkPoint[] | null>(null);
  const [preview, setPreview] = useState<BoardStroke[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [box, setBox] = useState<InkBounds | null>(null);
  const gesture = useRef<Gesture | null>(null);
  const frame = useRef(0);

  useEffect(() => () => { cancelAnimationFrame(frame.current); gesture.current = null; }, []);

  const publish = () => {
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const g = gesture.current;
      if (!g) return;
      if (g.tool === 'pen' || g.tool === 'highlighter') setDraft([...g.points]);
      else { setPreview(g.next); setBox(g.box); }
    });
  };
  const edit = (g: Gesture, event: { clientX: number; clientY: number }) => {
    const point = pointAt(event, g.origin);
    g.moved ||= Math.hypot((point.x - g.start.x) * g.origin.width, (point.y - g.start.y) * g.origin.height) > 3;
    if (g.tool === 'eraser') {
      g.next = g.next.filter(stroke => !hitInk(stroke.points, point, { x: 12 / g.origin.width, y: 12 / g.origin.height }));
    } else if (g.tool === 'select') {
      if (g.ids.length) g.next = moveInk(g.before, g.ids, { x: point.x - g.start.x, y: point.y - g.start.y });
      else g.box = { x: Math.min(point.x, g.start.x), y: Math.min(point.y, g.start.y), w: Math.abs(point.x - g.start.x), h: Math.abs(point.y - g.start.y) };
    } else if (g.points.length < 20000 && Math.hypot(point.x - g.points.at(-1)!.x, point.y - g.points.at(-1)!.y) > .0003) g.points.push(point);
  };
  const finish = (event: ReactPointerEvent<HTMLDivElement>, cancel = false) => {
    const g = gesture.current;
    if (!g || event.pointerId !== g.pointer) return;
    if (!cancel) edit(g, event);
    gesture.current = null;
    cancelAnimationFrame(frame.current); frame.current = 0;
    setDraft(null); setPreview(null); setBox(null);
    if (cancel) return;
    if (g.tool === 'pen' || g.tool === 'highlighter') {
      setStudentStrokes([...g.before, { id: crypto.randomUUID(), tool: g.tool, color: g.color, points: g.points }]);
    } else if (g.tool === 'select' && g.box) {
      const area = g.box;
      setSelected(g.before.filter(s => { const b = inkBounds(s.points); return b.x >= area.x && b.y >= area.y && b.x + b.w <= area.x + area.w && b.y + b.h <= area.y + area.h; }).map(s => s.id));
    } else if (g.tool === 'eraser' ? g.next.length !== g.before.length : g.moved) {
      setStudentStrokes(g.next);
    }
  };

  return { draft, preview, selected, box, setSelected,
    handlers: {
      onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => {
        if (event.button !== 0 || gesture.current) return;
        event.preventDefault();
        event.currentTarget.closest<HTMLElement>('.board-root')?.focus({ preventScroll: true });
        pauseAnimation();
        window.dispatchEvent(new Event('boh:student-writing'));
        const origin = event.currentTarget.getBoundingClientRect();
        const point = pointAt(event, origin), before = getBoardState().student;
        const hit = [...before].reverse().find(s => hitInk(s.points, point, { x: 9 / origin.width, y: 9 / origin.height }));
        const ids = tool === 'select' && hit ? selected.includes(hit.id) ? selected : [hit.id] : [];
        setSelected(ids);
        gesture.current = { pointer: event.pointerId, tool, color, origin, start: point, points: [point], before, next: before, ids, box: null, moved: false };
        event.currentTarget.setPointerCapture(event.pointerId);
        if (tool === 'eraser') edit(gesture.current, event);
        publish();
      },
      onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => {
        const g = gesture.current;
        if (!g || event.pointerId !== g.pointer) return;
        const samples = event.nativeEvent.getCoalescedEvents?.();
        for (const sample of samples?.length ? samples : [event]) edit(g, sample);
        publish();
      },
      onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => finish(event),
      onPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => finish(event, true),
      onLostPointerCapture: (event: ReactPointerEvent<HTMLDivElement>) => finish(event, true),
    },
  };
}
