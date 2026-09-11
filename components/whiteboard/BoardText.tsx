import { boardTextSize } from '@/lib/whiteboard/style';
import { isMathText, LABEL_FONT, MATH_FONT, textRuns } from '@/lib/whiteboard/text';
import { textReveal } from '@/lib/whiteboard/reveal';
import type { Drawable } from '@/lib/whiteboard/geometry';
import { typesetMath } from '@/lib/whiteboard/math-layout';

export function BoardText({ mark, entering = false, delay = 0 }: { mark: Extract<Drawable, { kind: 'text' }>; entering?: boolean; delay?: number }) {
  const reveal = textReveal(mark.text);
  let offset = 0;
  const formula = mark.mathDrawing ?? ((mark.math ?? (!mark.heading && isMathText(mark.text))) ? typesetMath(mark.text, mark.color) : null);
  if (formula) {
    const size = mark.fontSize ?? .068;
    const left = mark.at.x - (mark.textAnchor === 'start' ? 0 : formula.width * size / 2);
    return <g className="board-math" role="img" aria-label={mark.text} data-latex={mark.text}
      transform={`translate(${left} ${mark.at.y}) scale(${size / 1000})`}>
      <title>{mark.text}</title>
      {formula.paths.map((path, i) => <path key={i} d={path.d} fill={path.color} stroke="none"
        transform={`matrix(${path.matrix.join(' ')})`}
        className={entering ? 'board-math-glyph' : undefined}
        style={entering ? { animationDelay: `${delay + i * 32}ms` } : undefined} />)}
    </g>;
  }
  return <text className={`board-label${entering ? ' is-writing' : ''}${mark.heading ? ' is-heading' : ''}${mark.diagramLabel ? ' is-diagram' : ''}`}
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
