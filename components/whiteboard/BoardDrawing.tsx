'use client';

import { useEffect, useState } from 'react';
import type { BoardGroup, BoardStroke } from '@/lib/whiteboard/store';
import type { AnimationSpec } from '@/lib/types';
import { STUDENT_HEX } from '@/lib/whiteboard/colors';
import { inkPath } from '@/lib/whiteboard/ink-path';
import { groupReveal } from '@/lib/whiteboard/reveal';
import { BoardText } from './BoardText';
import { AnimLayer } from './AnimLayer';
import { BoardShape } from './BoardShape';

export function BoardDrawing({ groups, student, animation, time, focus, enteringId = null, pulseId = null, earlier = false }: {
  groups: BoardGroup[]; student: BoardStroke[]; animation: AnimationSpec | null; time: number; focus: string | null;
  enteringId?: string | null; pulseId?: string | null; earlier?: boolean;
}) {
  return <>
    <g className="board-tutor-layer"><title>Tutor notes</title>
      {groups.map(group => {
        if (!earlier && group.appear === 'pending' && group.id !== enteringId) return null;
        const entering = !earlier && group.id === enteringId;
        return <BoardGroupDrawing key={`${group.id}:${group.version ?? 0}`} group={group} entering={entering} pulse={pulseId === group.id} />;
      })}
      {animation && <AnimLayer spec={animation} time={time} focus={focus} backdrop={groups} student={student} />}
    </g>
    <g className="board-your-layer"><title>Your ink</title>
      {student.map(stroke => <path key={stroke.id} className={`board-student ${stroke.tool === 'highlighter' ? 'is-high' : 'is-pen'}`} data-ink-id={stroke.id} d={inkPath(stroke.points)} stroke={STUDENT_HEX[stroke.color]}><title>Your ink</title></path>)}
    </g>
  </>;
}

// One monotonic clock owns the entire writing sequence. Re-rendering or adding
// a later group cannot restart individual letters at different phases.
function BoardGroupDrawing({ group, entering, pulse }: { group: BoardGroup; entering: boolean; pulse: boolean }) {
  const [elapsed, setElapsed] = useState(0);
  const reveal = groupReveal(group);
  const duration = reveal.duration;
  useEffect(() => {
    if (!entering) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      setElapsed(Math.max(0, now - start));
      if (now - start < duration) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [entering, duration]);
  return <g data-board-group={group.id} className={`board-group${pulse ? ' is-pulse' : ''}`}>
    {group.drawables.map((mark, index) => mark.kind === 'text'
      ? <BoardText key={mark.key} mark={mark} entering={entering} elapsed={elapsed} delay={reveal.delays[index]} />
      : <BoardShape key={mark.key} mark={mark} entering={entering} />)}
  </g>;
}
