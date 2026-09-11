import { boardTextSize } from '@/lib/whiteboard/style';
import { isMathText, LABEL_FONT, MATH_FONT, textRuns } from '@/lib/whiteboard/text';
import type { Drawable } from '@/lib/whiteboard/geometry';

export function BoardText({ mark, entering = false }: { mark: Extract<Drawable, { kind: 'text' }>; entering?: boolean }) {
  return <text className={`board-label${entering ? ' is-writing' : ''}`}
    x={mark.at.x} y={mark.at.y} fill={mark.color}
    fontSize={(mark.fontSize ?? boardTextSize(mark.text, mark.size, mark.at.x))}
    style={{ fontFamily: isMathText(mark.text) ? MATH_FONT : LABEL_FONT }} textAnchor="middle">
    {textRuns(mark.text, mark.color).map((run, i) => <tspan key={i} fill={run.color}>{run.text}</tspan>)}
  </text>;
}
