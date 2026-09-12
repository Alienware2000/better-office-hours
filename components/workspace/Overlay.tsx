"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { BBox } from "@/lib/types";
import { hitInk, inkPath } from "@/lib/whiteboard/ink-path";
import { strokeWidth, type InkColor, type InkPoint, type InkStroke, type InkTool, INK_HEX } from "./ink";

type Gesture = { pointer: number; tool: Exclude<InkTool, 'hand'>; color: InkColor; origin: DOMRect; points: InkPoint[]; before: InkStroke[]; erased: Set<string> };
export function Overlay({ page, highlight, strokes, tool, color, onStroke, onErase }: {
  page: number; highlight?: BBox; strokes: InkStroke[]; tool: InkTool; color: InkColor;
  onStroke: (stroke: InkStroke) => void; onErase: (ids: string[]) => void;
}) {
  const [draft, setDraft] = useState<InkPoint[] | null>(null);
  const [erased, setErased] = useState<string[]>([]);
  const gesture = useRef<Gesture | null>(null);
  const frame = useRef(0);
  useEffect(() => () => { cancelAnimationFrame(frame.current); gesture.current = null; }, []);
  const pointAt = (event: {clientX:number;clientY:number}, origin: DOMRect): InkPoint => ({ x: clamp01((event.clientX-origin.left)/origin.width), y: clamp01((event.clientY-origin.top)/origin.height) });
  const edit = (g: Gesture, event: {clientX:number;clientY:number}) => {
    const point = pointAt(event, g.origin);
    if (g.tool === 'eraser') {
      for (const stroke of g.before) if (hitInk(stroke.points, point, {x:12/g.origin.width,y:12/g.origin.height})) g.erased.add(stroke.id);
    } else if (g.points.length < 20000 && Math.hypot(point.x-g.points.at(-1)!.x,point.y-g.points.at(-1)!.y) > .0003) g.points.push(point);
  };
  const publish = () => {
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const g = gesture.current;
      if (g) { setDraft(g.tool === 'eraser' ? null : [...g.points]); setErased([...g.erased]); }
    });
  };
  const finish = (event: ReactPointerEvent<HTMLDivElement>, cancel=false) => {
    const g = gesture.current;
    if (!g || event.pointerId !== g.pointer) return;
    if (!cancel) edit(g,event);
    gesture.current = null;
    cancelAnimationFrame(frame.current); frame.current=0;
    setDraft(null);setErased([]);
    if(cancel)return;
    if(g.tool === 'eraser') {if(g.erased.size)onErase([...g.erased]);}
    else onStroke({id:crypto.randomUUID(),page,tool:g.tool,color:g.color,points:g.points});
  };
  return <div className={`overlay is-${tool}`}
    onPointerDown={event=>{
      if(event.button!==0 || tool==='hand' || gesture.current)return;
      event.preventDefault(); window.dispatchEvent(new Event('boh:student-writing'));
      const origin=event.currentTarget.getBoundingClientRect();
      const g:Gesture={pointer:event.pointerId,tool,color,origin,points:[pointAt(event,origin)],before:strokes,erased:new Set()};
      gesture.current=g;
      event.currentTarget.setPointerCapture(event.pointerId);
      if(tool==='eraser')edit(g,event);
      publish();
    }}
    onPointerMove={event=>{
      const g=gesture.current;if(!g || event.pointerId!==g.pointer)return;
      const samples=event.nativeEvent.getCoalescedEvents?.();
      for(const sample of samples?.length?samples:[event])edit(g,sample);
      publish();
    }}
    onPointerUp={event=>finish(event)} onPointerCancel={event=>finish(event,true)} onLostPointerCapture={event=>finish(event,true)}>
    {highlight ? <Marker key={boxKey(highlight)} bbox={highlight} /> : null}
    <svg className="ink-layer" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden>
      {strokes.filter(stroke=>!erased.includes(stroke.id)).map(stroke=><path key={stroke.id} className={stroke.tool==='highlighter'?'ink-high':'ink-pen'} d={inkPath(stroke.points)} stroke={INK_HEX[stroke.color]} strokeWidth={strokeWidth(stroke.tool)} />)}
      {draft && (tool==='pen'||tool==='highlighter') && <path className={tool==='highlighter'?'ink-high':'ink-pen'} d={inkPath(draft)} stroke={INK_HEX[color]} strokeWidth={strokeWidth(tool)} />}
    </svg>
  </div>;
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function boxKey(box: BBox) {
  return `${box.x}-${box.y}-${box.w}-${box.h}`;
}

function Marker({ bbox }: { bbox: BBox }) {
  const path = regionPath();

  return (
    <svg
      className="marker"
      viewBox="0 0 100 24"
      preserveAspectRatio="none"
      style={{
        left: `${bbox.x * 100}%`,
        top: `${bbox.y * 100}%`,
        width: `${bbox.w * 100}%`,
        height: `${bbox.h * 100}%`,
      }}
      aria-hidden
    >
      <path className="marker-ink" d={path} />
    </svg>
  );
}

function regionPath() {
  return [
    "M 1.4 3.2",
    "C 22 1.4, 48 4.1, 72 2.2",
    "C 86 1.1, 96 3.6, 98.6 2.8",
    "L 98.8 21.4",
    "C 78 22.8, 54 20.2, 32 22.1",
    "C 16 23.4, 6 21.6, 1.6 21.2",
    "Z",
  ].join(" ");
}
