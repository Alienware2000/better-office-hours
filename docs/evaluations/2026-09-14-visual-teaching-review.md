# Visual teaching review, September 14

David reports that the Astra/Fable astronomy diagrams remain poor and that Claude outputs generally look better to him. He specifically identifies overlapping labels, narration about a rainbow without a rainbow on screen, and textbook-like explanations. These are qualitative observations, not a completed model scorecard. Do not infer numeric ratings or a model selection.

## Corrected in this slice

The annotation scorer formerly combined label collisions with the number of geometry segments crossed. Enough segments made overlapping another label cheaper than crossing geometry. It now ranks label collisions first, geometry second, distance third, and searches farther when nearby positions all collide with text. Heading bounds use the final heading size. Only annotations move; underlying model geometry and student ink stay intact. Leaders retain object association. This is bounded placement, not a universal dense-page layout solver.

Browser inspection also caught a heading/axis-label collision absent from server estimates. The server fallback now reserves 12% extra text width for font variation. It remains approximate, not a guarantee across every font. Actual browser measurement remains in use in the student renderer.

A relation sign alone formerly triggered math typesetting, so `line pattern = element fingerprint` lost ordinary word spacing and acquired symbolic coloring. Longer prose words now prevent inferred math. Compact symbolic expressions and explicit LaTeX still typeset. Ambiguous short words or long variable names still need explicit notation; this heuristic is not a language parser.

Checks: math, diagram composition, diagram motion, review-server and speech-cache regressions, focused lint, and TypeScript passed. New fixtures cover both reported concentric-circle layouts, multiline headings, unchanged geometry, leaders, idempotence, prose, and preserved equations. Browser checks found no text/text overlap in the two saved final astronomy diagrams after correction; the Fable board was visually inspected. This does not establish scientific accuracy, ideal label placement, teaching quality, or all screen/font coverage. No new model/TTS requests, provider switch, or publication occurred.

## Visual meaning still unresolved

`Color` in `lib/types.ts` allows only ink, accent, muted, and warn. `boardStyle.colors` maps these to the paper theme. It cannot represent an actual rainbow. The theme can style the interface, but must not substitute for scientific color when color is the lesson. Merely labeling one rust arrow “all colors” does not show the claimed spectrum or its missing colors.

Fable also emitted `label` properties on line commands: spectrum, H, Na, and Ca. The line contract has no label and the renderer ignores it. The workshop now warns when this occurs, without rewriting the historical model response. Other models can make the same incompatible request; Opus biology's membrane is another example.

Proposed coordinated contract slice: add a bounded literal-color palette separate from role colors, and an optional attached label on straight lines, updating validators, renderer, snapshot, animation support where relevant, and model schema documentation together. Preserve old theme values and historical data; do not infer colors from topic words or fabricate missing content in saved answers. `lib/types.ts` is explicitly frozen, so this proposal is not implemented. A smaller immediate teaching correction can use supported text annotations and stop claiming an absent color display.

## Simpler teaching acceptance criteria

The problem is conceptual density, not just word count. Astra's 62-word answer can still be too dense. Judge whether the learner gets one concrete idea, the picture shows it, and technical language is explained before being used. Do not treat a short answer, valid schema, or clean diagram as a teaching pass.

For a novice's first explanation: begin with an observable idea in plain words; connect each spoken claim to the visible object/change; introduce one necessary new term at a time; defer extra notation and mechanisms until needed. A learner explicitly asking for advanced mathematics should still receive it. Preserve graded-work protections. Never make a novice guess unexplained prerequisites.

An editorial example of a simpler opening, not a model result or runtime script:

> A star's light contains many colors. Gas around the star absorbs some of them. When we spread the light into a rainbow, those missing colors show up as dark lines. Different elements leave different patterns, so the lines help us work out what the gas contains.

The corresponding board needs an actual continuous color strip, then visible missing lines, then a labeled comparison. Energy-level equations belong in a later explanation if the learner asks why particular colors are absorbed. This example illustrates the clarity target only; nothing is hardcoded into the tutor.

PROMPT.md already says “Plain words” and “not a textbook.” It remains human-owned and was not edited. Runtime teaching guidance and cached audio also remain unchanged. Next is a controlled simpler-teaching prompt experiment with actual matching visuals, after resolving the drawing contract. First useful audible response remains the latency metric, with complexity and semantic agreement assessed separately.
