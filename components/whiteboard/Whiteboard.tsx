"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { BoardDrawing } from "./BoardDrawing";
import { groupReveal } from "@/lib/whiteboard/reveal";
import { projectileFixture } from "@/components/scenes/projectile";
import { boardStyle } from "@/lib/whiteboard/style";
import type { StudentInk } from "@/lib/whiteboard/colors";
import { STUDENT_HEX } from "@/lib/whiteboard/colors";
import { boardProvenance, getLiveBoard, setLiveBoard, setBoardSnapshotProvider } from "@/lib/whiteboard/live-board";
import { snapshotBoard } from "@/lib/whiteboard/snapshot";
import {
  advanceAnimation, loadAnimation, pauseAnimation, playAnimation, seekAnimation, focusAnimation,
  addStudentStroke,
  applyDrawCommands,
  setStudentStrokes, undoStudentInk, redoStudentInk,
  getBoardState,
  markGroupShown,
  openBoard,
  resetBoard,
  subscribeBoard,
} from "@/lib/whiteboard/store";
import { BoardInkBar, type BoardTool } from "./BoardInkBar";
import { useBoardInk } from "./useBoardInk";
import { useBoardFollow } from './useBoardFollow';
import { inkBounds, inkPath } from "@/lib/whiteboard/ink-path";
import "./whiteboard.css";

export function Whiteboard({ active = true, expanded = false, onExpand }: { active?: boolean; expanded?: boolean; onExpand?: () => void }) {
  const [, setTick] = useState(0);
  const [tool, setTool] = useState<BoardTool>("pen");
  const [color, setColor] = useState<StudentInk>("blue");
  const paperRef = useRef<HTMLDivElement>(null);
  const ink = useBoardInk(tool, color);
  const reduceMotion = useReducedMotion() ?? false;
  const board = getBoardState();
  const isOpen = expanded || board.open;
  const { scrollRef, followRef, readingEarlier, latest, reveal, scrollHandlers } = useBoardFollow(board.pageId, active && isOpen, reduceMotion);
  const pendingKey = board.groups
    .filter((group) => group.appear === "pending" && !group.unresolved)
    .map((group) => `${group.id}:${group.version ?? 0}`)
    .join(",");

  useEffect(() => { if (expanded) openBoard(); }, [expanded]);

  useEffect(() => subscribeBoard(() => setTick((n) => n + 1)), []);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const w = window as Window & {
      __bohBoard?: {
        playFixture: (speed?: number, angle?: number) => boolean;
        loadAnimation: typeof loadAnimation;
        pause: typeof pauseAnimation;
        play: typeof playAnimation;
        seek: typeof seekAnimation;
        focus: typeof focusAnimation;
        getState: typeof getBoardState;
        openBoard: typeof openBoard;
        applyDrawCommands: typeof applyDrawCommands;
        resetBoard: typeof resetBoard;
        addStudentStroke: typeof addStudentStroke;
        getLiveBoard: typeof getLiveBoard;
      };
    };
    w.__bohBoard = { playFixture: (speed, angle) => loadAnimation(projectileFixture(speed, angle)), loadAnimation, pause: pauseAnimation, play: playAnimation, seek: seekAnimation, focus: focusAnimation, getState: getBoardState, openBoard, applyDrawCommands, resetBoard, addStudentStroke, getLiveBoard };
    // Fixtures require an explicit developer call. URLs and component mounts
    // must never introduce a subject into a student's conversation.
    return () => {
      delete w.__bohBoard;
    };
  }, []);

  useEffect(() => {
    const pending = getBoardState().groups.filter((group) => group.appear === "pending" && !group.unresolved);
    if (!pending.length) return;
    if (reduceMotion) {
      pending.forEach((group) => markGroupShown(group.id));
      return;
    }
    const wait = window.setTimeout(() => markGroupShown(pending[0].id), groupReveal(pending[0]).duration);
    return () => window.clearTimeout(wait);
  }, [pendingKey, reduceMotion, board.pageId]);

  useEffect(() => {
    setBoardSnapshotProvider(() => {
      const current = getBoardState();
      if (!active) return null;
      const metadata = { ...boardProvenance(current), open: current.open, studentShapesSince: current.studentSince, readingEarlier: !followRef.current };
      const surface = paperRef.current?.querySelector('.board-current .board-surface');
      const rect = surface?.getBoundingClientRect();
      if (!rect || rect.width < 8 || rect.height < 8) return { ...metadata, imageUrl: "" };
      const snap = snapshotBoard(
        current.groups.filter(g => g.appear === 'done'), current.student,
        rect.width, rect.height,
        current.animation ? { spec: current.animation, time: current.time, focus: current.focus } : undefined,
      );
      const studentImageUrl = current.student.length ? snapshotBoard([], current.student, rect.width, rect.height)?.imageUrl : undefined;
      return { imageUrl: snap?.imageUrl ?? "", ...metadata, studentImageUrl };
    });
    return () => { setBoardSnapshotProvider(null); setLiveBoard(null); };
  }, [active, followRef]);

  useEffect(() => {
    if (reduceMotion) pauseAnimation();
  }, [board.animation, reduceMotion]);

  useEffect(() => {
    if (!active) { pauseAnimation(); return; }
    if (!board.playing) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      advanceAnimation(Math.min((now - last) / 1000, 0.1));
      last = now;
      if (getBoardState().playing) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, board.playing]);

  const enteringId = reduceMotion
    ? null
    : board.groups.find((group) => group.appear === "pending" && !group.unresolved)?.id ?? null;

  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll || !followRef.current || !enteringId) return;
    const group = Array.from(scroll.querySelectorAll<SVGGElement>('.board-current [data-board-group]')).find(el => el.dataset.boardGroup === enteringId);
    if (!group) return;
    reveal(group);
  }, [enteringId, pendingKey, board.pageId, followRef, reveal, scrollRef]);

  const selectedStrokes = (ink.preview ?? board.student).filter(s => ink.selected.includes(s.id));
  const selectionBounds = selectedStrokes.length ? inkBounds(selectedStrokes.flatMap(s => s.points)) : null;

  const editInk = (action: () => void) => { pauseAnimation(); window.dispatchEvent(new Event('boh:student-writing')); action(); };

  return (
    <motion.section
      initial={false}
      animate={{ opacity: isOpen ? 1 : 0 }}
      transition={reduceMotion ? { duration: 0 } : boardStyle.motion.spring}
      className={["board-root", isOpen ? "is-open" : "", expanded ? "board-expanded" : ""].filter(Boolean).join(" ")}
      aria-hidden={!isOpen}
      aria-label="Whiteboard"
      tabIndex={0}
      onKeyDown={event => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); editInk(event.shiftKey ? redoStudentInk : undoStudentInk); }
        if ((event.key === 'Delete' || event.key === 'Backspace') && selectedStrokes.length) { event.preventDefault(); editInk(() => setStudentStrokes(board.student.filter(s => !ink.selected.includes(s.id)))); ink.setSelected([]); }
      }}
    >
      <div className="board-paper" ref={paperRef}>
        <div className="board-heading">
          <div className="board-authors" aria-label="Board authors">
            <span className="board-author-tutor" title="Equations and diagrams written by the tutor"><span aria-hidden>𝑓</span> Tutor notes</span>
            <span className="board-author-you" title="Your editable pen and highlighter marks"><span aria-hidden>〰</span> Your ink</span>
          </div>
          <div className="board-page-controls">
            {board.earlierPages.length > 0 && <span className="board-page-count">{readingEarlier ? 'Earlier notes' : `Page ${board.pageId}`}</span>}
            {readingEarlier && <button className="board-latest" type="button" onClick={latest}>Latest ↓</button>}
            {onExpand && <button className="board-expand" type="button" aria-label="Expand whiteboard" title="Expand whiteboard" onClick={onExpand}><svg viewBox="0 0 24 24" width="17" height="17" aria-hidden><path d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4M4 4l5 5m11-5-5 5M4 20l5-5m11 5-5-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg></button>}
          </div>
        </div>
        <div className="board-scroll" ref={scrollRef} {...scrollHandlers}>
          {board.earlierPages.map(page => <div className="board-note-page" key={page.id}>
            <div className="board-page-divider">Page {page.id} · Earlier notes</div>
            <div className="board-canvas board-archived" aria-label={`Earlier board page ${page.id}`}>
              <div className="board-surface"><svg className="board-layer" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden><BoardDrawing {...page} earlier /></svg></div>
            </div>
          </div>)}
          <div className="board-note-page board-current" data-board-page={board.pageId}>
            {board.earlierPages.length > 0 && <div className="board-page-divider">Page {board.pageId} · Working page</div>}
            <div className="board-canvas">
              <div className={`board-surface is-${tool}`} {...ink.handlers}>
                <svg className="board-layer" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden>
                  <BoardDrawing groups={board.groups} student={ink.preview ?? board.student} animation={board.animation} time={board.time} focus={board.focus} pulseId={board.pulseId} enteringId={enteringId} />
                  {ink.draft && <g className="board-your-layer"><path className={`board-student ${tool === 'highlighter' ? 'is-high' : 'is-pen'}`} d={inkPath(ink.draft)} stroke={STUDENT_HEX[color]} /></g>}
                  {selectionBounds && <rect className="board-selection" x={selectionBounds.x - .014} y={selectionBounds.y - .014} width={selectionBounds.w + .028} height={selectionBounds.h + .028} rx=".008" />}
                  {ink.box && <rect className="board-selection is-box" x={ink.box.x} y={ink.box.y} width={ink.box.w} height={ink.box.h} />}
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div className="board-selection-tools">
          {selectionBounds ? <><span>Your ink · {selectedStrokes.length} {selectedStrokes.length === 1 ? 'stroke' : 'strokes'}</span><button type="button" onClick={() => { editInk(() => setStudentStrokes(board.student.filter(s => !ink.selected.includes(s.id)))); ink.setSelected([]); }}>Delete selected ink</button></> : <span className="board-tool-hint">{tool === 'select' ? 'Drag around your ink to select it' : tool === 'eraser' ? 'Erase your ink, tutor notes stay in place' : board.earlierPages.length ? 'Your tools edit the working page' : 'Your pen and highlighter marks stay editable'}</span>}
        </div>
        {isOpen && <BoardInkBar tool={tool} color={color}
          onTool={next => { setTool(next); if (next !== 'select') ink.setSelected([]); }}
          onColor={next => { setColor(next); if (tool === 'select' && selectedStrokes.length) editInk(() => setStudentStrokes(board.student.map(s => ink.selected.includes(s.id) ? { ...s, color: next } : s))); }}
          canUndo={board.studentPast.length > 0} canRedo={board.studentFuture.length > 0}
          onUndo={() => editInk(undoStudentInk)} onRedo={() => editInk(redoStudentInk)} />}
        {board.animation && <div className="board-transport">
          <button type="button" aria-label={board.playing ? "Pause animation" : "Play animation"} onClick={board.playing ? pauseAnimation : playAnimation}>{board.playing ? 'Ⅱ' : '▶'}</button>
          <input aria-label="Animation time" type="range" min={0} max={board.animation.duration} step={0.01} value={board.time} onChange={event => { pauseAnimation(); seekAnimation(Number(event.target.value)); }} />
          <span>{board.time.toFixed(1)}s</span>
        </div>}
      </div>
    </motion.section>
  );
}
