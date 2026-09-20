# Board experience: research and second visual study

September 20, 2026. Local-only continuation of [the first document study](2026-09-20-board-system.md). David's correction: useful colors, diagrams/equations together, concise board content and ordered writing. [Research and next architecture decisions](../WHITEBOARD_EXPERIENCE_RESEARCH.md).

## Review surface

`http://localhost:3116/board-system-v2.html`

The existing `board-system.html` remains available for comparison. The 3116 root tutor still runs snapshot 1770053; no restart, live source swap, session migration or provider call. Existing student sessions and PDFs were not touched. No additional server was started.

Reproduce: `node scripts/evaluation/board-gallery.mjs` writes `.data/evaluation/2026-09-20-board-system/index.html`. To expose the static study, copy it to the current 3116 snapshot's `public/board-system-v2.html`, using `.data/voice-trial-3116/latest.json` to identify that directory. Do not replace its source or data. Generated HTML is ignored, not a committed provider output.

## Changes

- The default math page combines a partitioned square, actual MathJax labels and its identity. Gray, teal and rust have explicit meanings. Both `ab` regions share the `2ab` term's color and selection link. Plus/equality signs remain neutral.
- One short takeaway replaces the old first page's paragraphs. Requested long notes remain a distinct pagination fixture. Nine synthetic pages still cover mathematics, biology, humanities and notes.
- `document.ts` supports optional adjacent equation terms and explicit concept links on figures. Labels within regions have stable positions; long or overlapping content fails clearly. No subject lookup or scripted scene is added to live tutor behavior.
- `document-replay.ts` builds a timeline from the existing `groupReveal`. The gallery uses the real BoardText and BoardShape components. One clock controls stroke reveal, ordered graphemes and MathJax paths, pause/resume and backwards seeking. It preserves complete text layout during writing. Reduced-motion preference skips glyph/stroke motion within each step.
- Native transparent HTML buttons over measured SVG regions provide pointer and keyboard selection. Linked regions retain emphasis together. This is local preview interaction, not new student editing or model perception.

## Validation

- `node scripts/check-board-document.mjs`: nine pages deterministic, authored content unchanged, no overlapping/off-page text, overflow preserves prose size/content, intact graphemes, stable earlier pages, explicit invalid/dense input rejection, consistent geometry proportions, symmetric local concept links, paper/tint distinction, complete final glyphs and sequential timing.
- `node scripts/check-board-writing.mjs`, `check-math.mjs`, `check-diagrams.mjs`, `check-diagram-motion.mjs`: pass. These are offline regression checks, not new provider or acoustic evidence.
- `npx tsc --noEmit --incremental false`: pass.
- Focused ESLint on document/replay, fixtures, gallery generator and document checks: pass.
- Browser: inspected the new math composition; all nine pages at expanded and compact settings had zero measured text overlaps or out-of-page text (18 combinations). No iPad/Pencil or physical-device claim.
- Browser: paused writing held position across calls; mid-page seek showed a complete prefix followed by hidden glyphs; seeking to the end revealed every final glyph; seeking backward hid later steps. Pointer selection of `2ab` selected exactly its term and the two rectangles after the native-hit-control correction. Keyboard selection and the Focus menu also worked.

## Corrections discovered during validation

Recoloring every fill accidentally recolored the opaque paper underlay and hid region labels. Preserve that underlay, recolor only tint and marks. A regression checks this explicitly.

SVG group/glyph pointer selection repeatedly chose the caption even when measured bounds were distinct. Adding SVG hit rectangles and disabling glyph pointer events did not resolve it in this browser. Replaced that approach with ordinary HTML hit buttons over the measured regions; pointer selection then reached the correct term and linked regions. Do not assume an SVG role or an accurate bounding box proves reliable hit testing. The exact browser-internal cause remains unconfirmed.

A range step of 10ms made some timeline endpoints unreachable. The scrubber now uses 1ms steps, matching integer timeline durations.

## Limits and next step

This is a typed, local prototype, not an external model-output parser or a promoted live tutor integration. It demonstrates drawing/reveal and relational selection; it does not implement semantic morphing, simulation controls, voice alignment, student ink feedback or a model render-review loop. Notes and later biology/humanities pages still explore prose/sequence layouts; they are not a prescribed text density for all explanations.

Research supports investigating these choices, not claiming measured learning or latency gains. Review the diagram-led page and writing cadence; then integrate one bounded structured writing path and compare matched live turns. Student-ink feedback and pen-down interruption policy need a distinct UX/provider check. Preserve narration, typed access, graded-work disclosure and page/ink identity.
