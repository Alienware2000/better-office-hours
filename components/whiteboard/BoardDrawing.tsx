import type { BoardGroup, BoardStroke } from '@/lib/whiteboard/store';
import type { AnimationSpec } from '@/lib/types';
import { STUDENT_HEX } from '@/lib/whiteboard/colors';
import { inkPath } from '@/lib/whiteboard/ink-path';
import { groupReveal } from '@/lib/whiteboard/reveal';
import { BoardText } from './BoardText';
import { AnimLayer } from './AnimLayer';

export function BoardDrawing({ groups, student, animation, time, focus, enteringId = null, pulseId = null, earlier = false }: {
  groups: BoardGroup[]; student: BoardStroke[]; animation: AnimationSpec | null; time: number; focus: string | null;
  enteringId?: string | null; pulseId?: string | null; earlier?: boolean;
}) {
  return <>
    <g className="board-tutor-layer"><title>Tutor notes</title>
      {groups.map(group => {
        if (!earlier && group.appear === 'pending' && group.id !== enteringId) return null;
        const entering = !earlier && group.id === enteringId;
        const reveal = groupReveal(group);
        return <g key={`${group.id}:${group.version ?? 0}`} data-board-group={group.id} className={`board-group${pulseId === group.id ? ' is-pulse' : ''}`}>
          {group.drawables.map((mark, index) => mark.kind === 'text'
            ? <BoardText key={mark.key} mark={mark} entering={entering} delay={reveal.delays[index]} />
            : <path key={mark.key} className={[mark.kind === 'head' ? 'board-head' : 'board-path', mark.kind === 'path' && mark.dashed && !entering ? 'is-dashed' : '', entering ? 'is-entering' : ''].filter(Boolean).join(' ')} d={mark.d} pathLength={mark.kind === 'path' ? 1 : undefined} stroke={mark.color} />)}
        </g>;
      })}
      {animation && <AnimLayer spec={animation} time={time} focus={focus} />}
    </g>
    <g className="board-your-layer"><title>Your ink</title>
      {student.map(stroke => <path key={stroke.id} className={`board-student ${stroke.tool === 'highlighter' ? 'is-high' : 'is-pen'}`} data-ink-id={stroke.id} d={inkPath(stroke.points)} stroke={STUDENT_HEX[stroke.color]}><title>Your ink</title></path>)}
    </g>
  </>;
}
