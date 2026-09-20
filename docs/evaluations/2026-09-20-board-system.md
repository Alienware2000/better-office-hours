# A structured board across subjects

September 20, 2026. Local prototype, synthetic ungraded examples. No provider calls or live-session changes.

## Direction

David approved the neutral typography preview, then requested a board that supports mathematics, science, humanities, intricate diagrams and mind maps. Keep the voice-first tutor, warm paper, intentional motion and readable notation. Physics must not define the underlying board model.

The tutor supplies meaning and the teaching sequence. The application handles typography, spacing, annotation placement and page boundaries. A consistent visual language should make results more predictable. Its effect on model tokens or response latency is still unmeasured.

## Implemented prototype

`lib/whiteboard/document.ts` composes sections into ordinary ShapeGroups consumed by the existing BoardDrawing, MathJax and SVG renderer. It introduces no shared tutor contract and is not imported by the voice/store path.

- Roles: prose, equation, figure, mind map and ordered explanation. Sections carry a title and eyebrow. Marks retain explicit identities.
- Styles: shared warm ink, muted annotations, restrained emphasis, fixed role sizes, margins and page rhythm. Prose is explicitly prose. Equations use real MathJax metrics and authored color.
- Layout: prose continues at the same type size; equations/captions stay together; ordered steps break between steps. Maps continue after four branches with the root repeated. Figures retain their proportions and use the existing annotation solver around reserved headers/captions.
- Overflow: long words split at grapheme boundaries. Oversized equations, dense branches, off-page or overlapping text, oversized circles, long labels and duplicate identities fail explicitly rather than silently lose content. Page/section/primitive counts are bounded. This is a typed local API, not an untrusted model-output parser.
- Continuity: later sections leave earlier content in place. The footer total updates. Topic examples live only in `scripts/evaluation/board-documents.ts`.

Generate the offline gallery with `node scripts/evaluation/board-gallery.mjs`. It writes `.data/evaluation/2026-09-20-board-system/index.html`. Four subjects and eleven pages demonstrate algebra/area, a cell schematic, literary interpretation and longer study notes. These fixtures are never selected by the tutor.

The gallery offers expanded/compact views, page navigation, staged visual replay, pause/continue, a reveal slider, keyboard-accessible detail focus and reduced-motion CSS. Replay uses complete content groups and stroke reveals; it does not simulate speech timing or learning outcomes. A later live integration must use the actual narration clock.

## Review location

`http://localhost:3116/board-system.html` is a self-contained generated file copied into the existing ignored 3116 snapshot's public directory. No new server, app rebuild, HMR source update, database write or origin migration occurred. Root 3116 still runs typography candidate 1770053; 3114/3115 and the earlier board-text preview remain intact. The gallery uses the current composition source, independent of that older root-app revision.

## Validation

- `node scripts/check-board-document.mjs`: eleven pages, non-overlapping bounds, content conservation, deterministic/nonmutating composition, overflow without type shrinkage, grapheme preservation, repeated map roots, prior-page stability, real SVG/MathJax output, invalid-input rejection and preserved circle proportions passed.
- Existing board-writing, math, diagram and diagram-motion checks passed. Typecheck and focused lint passed.
- In-app browser: every page at 640px and 360px sheet widths, 22 combinations, had zero actual text-bound collisions and zero off-page text boxes. Visually inspected math, area diagram, biology labels, humanities map and compact view. Top dimension labels were moved above their reference lines; compact map detail type was increased after inspection.
- Focus dimmed other details to 0.22 opacity. Replay hid unrevealed content/accessibility targets, pause held the step, continue advanced, and page navigation reset it. These are synthetic UI checks, not acoustic or iPad evidence.

## Remaining architecture work

This is a foundation for review, not a claim of general diagram intelligence. It does not yet handle rich inline prose/math spans, arbitrary graph topology, nested maps, diagram editing, responsive text reflow, collaborative persistence or model-generated document validation. Compact pages still scale; expanded reading remains preferable for dense notes. Figure semantics and scientific correctness still depend on authored content.

Next integrate one generic structured writing path in an isolated candidate, keeping custom diagrams available. Validate model output separately; commit only completed narrated beats so later content cannot leak graded answers. Keep current page identity and student ink stable across additions/revisions. Then compare existing versus structured output on a fixed cross-subject set, measuring complete speech, first audible response, first useful visual, layout quality and output size. Do not add a planning model or extra provider round trip without measured benefit.

After that, develop relationship-based graphs/labels and coordinated transforms that retain object identity. Use motion to explain relationships, with replay and learner control. Do not assume decorative animation or an attractive fixture proves retention.
