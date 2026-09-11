import { boardTextSize } from '@/lib/whiteboard/style';
import { isMathText, LABEL_FONT, MATH_FONT, textRuns } from '@/lib/whiteboard/text';
import { textReveal } from '@/lib/whiteboard/reveal';
import type { Drawable } from '@/lib/whiteboard/geometry';

export function BoardText({ mark, entering = false, delay = 0 }: { mark: Extract<Drawable, { kind: 'text' }>; entering?: boolean; delay?: number }) {
  const reveal = textReveal(mark.text);
  let offset = 0;
  return <text className={`board-label${entering ? ' is-writing' : ''}${mark.heading ? ' is-heading' : ''}`}
    x={mark.at.x} y={mark.at.y} fill={mark.color}
    fontSize={mark.fontSize ?? boardTextSize(mark.text, mark.size, mark.at.x)}
    style={{ fontFamily: (mark.math ?? (!mark.heading && isMathText(mark.text))) ? MATH_FONT : LABEL_FONT }} textAnchor={mark.textAnchor ?? 'middle'}>
    {textRuns(mark.text, mark.color).map((run, i) => <tspan key={i} fill={run.color}>
      {entering ? textReveal(run.text).glyphs.map(glyph => {
        const index = offset++;
        return <tspan className="board-glyph" key={index} style={{ animationDelay: `${delay + (reveal.delays[index] ?? 0)}ms` }}>{glyph}</tspan>;
      }) : run.text}
    </tspan>)}
  </text>;
}
