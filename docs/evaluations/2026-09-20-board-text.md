# Board text consistency

September 20, 2026. First bounded follow-up to the board-feedback and session-review reports. Renderer changes only; current candidate/model and voice pipeline retained.

## Changes

Removed character-code based variable coloring from text runs and MathJax paths. A mark now uses its authored color throughout. Explicit DRAW emphasis and literal diagram colors still work. SVG and canvas snapshot also use the mark color for previously cached math paths, without mutating saved records or student ink.

Short connective prose such as “T for m₂” and “m₂ is up” no longer enters equation typesetting merely because it includes TeX subscripts. Existing numeric subscript normalization preserves spaces. Actual equations, fractions, matrices and compact symbolic labels remain math.

## Evidence

Pass: check-math, check-teaching-repairs, check-board-writing, check-diagrams, check-diagram-motion; TypeScript and focused ESLint. Regression cases cover neutral/explicit color, cached old math colors in both SVG and mocked canvas drawing, short prose, mathematical layout, reveal order and existing collision/ink invariants.

Browser inspected a synthetic fixture rendered through the actual store and BoardDrawing at 360px and 640px. Neutral equation, spaced prose, compact subscript labels and deliberate rust emphasis are visible. This is renderer evidence, not a new model-generated lesson. Fixture: ignored .data/evaluation/2026-09-20-board-text/index.html. Initial fixture encoding lacked UTF-8 metadata; corrected before visual verification.

No provider requests or human acoustic checks. No first-audio latency claim. Current collision fixtures pass; cumulative semantic clutter, missing mechanism geometry and narration mismatches still need a reproducible follow-up. Old saved prose already baked into mathematical paths is not migrated by this slice.
