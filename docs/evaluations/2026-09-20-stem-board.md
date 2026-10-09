# STEM board evaluation and direction

September 20, 2026. Local slice based on dd72d8a. David clarified that named topics are examples: the intended product is an open-ended STEM visual tutor, with 3Blue1Brown-like explanatory clarity and a collaborative canvas. [The capability framework](../STEM_WHITEBOARD.md) records this scope, including untested representations and latency gates.

## Two review surfaces

- [Authored visual study](http://localhost:3116/board-stem.html): eight pages, actual SVG/MathJax components, ordered writing, linked focus and a separate projectile time control.
- [Unchanged model outputs](http://localhost:3116/board-stem-models.html): four real synthetic Opus-low requests through the current prompt, parser and renderer. [Results and exact timings](2026-09-20-stem-models.md).

The eight pages are matrix shear, projectile components, a uniform electric field, magnetic force, atom conservation, reaction energy, membrane diffusion and selected animal-cell structures. They demonstrate sampled renderer capabilities. They are never topic selectors in the tutor and do not establish general STEM competence. No image-input or student-ink feedback test was run.

## What changed

`lib/whiteboard/document.ts` now measures the vertical space required by adjacent notation. A matrix can stay with its diagram and caption at a readable size; the figure scales uniformly to preserve geometry. Equations too tall for that arrangement fail explicitly. Two-line headings now have sufficient line spacing. Errors identify the conflicting marks or unsupported primitive.

The new fixtures use geometric transforms, chemical subscripts, labeled molecular groups, nearby equations and meaningful colors. Chemistry distinguishes atom accounting from mechanism and reaction progress from time. Biology distinguishes individual crossings from net flux. These are authored explanations with assumptions, not claims of automated scientific validation.

The projectile study uses 81 explicit equal-time samples through the existing declarative animation runtime. The ball and vectors agree with the same position function; horizontal velocity stays constant, vertical velocity changes sign, and gravity remains downward. Separate controls distinguish drawing replay from physical time. The static gallery pre-renders sampled animation poses for offline inspection; this is not a new live simulation engine or performance benchmark.

The existing cross-subject gallery and the live tutor remain separate. No live prompt, model, voice, session storage, frozen contract or public deployment was changed. The tutor root at 3116 is still source snapshot 1770053. Only new static preview files were copied into its public directory; no server restart or new permanent server was needed.

## Validation and corrections

- `node scripts/check-board-document.mjs`: all nine prior pages and composition/replay regressions pass.
- `node scripts/check-stem-board.mjs`: eight STEM pages render; matrix aspect and caption clearance, two-line heading layout, sampled kinematics, atom counts and diffusion direction pass. Actual animation labels are checked against static and animated labels at all 81 poses.
- TypeScript and focused ESLint pass. `git diff --check` passes.
- Browser: all eight authored pages inspected at expanded and compact sizes, 16 combinations, with no detected text overlap or clipping in rendered DOM bounds. Representative screenshots inspected for geometry and label association, which bounds alone cannot establish.
- Browser: time seek from 0 to 4 seconds moves the ball from x=.2948 to x=.662 at the same starting/landing y=.5964. Typewriter pause at 263 ms hides 70 pending glyphs; seeking to the 5,359 ms end reveals every glyph. The motion layer stays hidden during construction and returns at completion.
- All four model outputs were visually inspected after restoring the actual board stylesheet in the audit wrapper. Model output was retained, including failures.

Testing exposed issues worth preserving: tall matrix descent originally collided with its caption; a wrapped title overlapped itself; the last projectile velocity label overlapped its equation; automatic axis-label placement sent a long leader through the energy equation. Measured space, wider heading leading, supported label-side metadata and deliberately placed axis labels resolved those authored cases. A general solver for every scientific annotation remains unproven. The audit wrapper initially omitted non-scaling-stroke CSS, making valid paths appear as solid blocks; embedding the actual stylesheet fixed the wrapper without changing any model geometry.

## Findings and next bounded step

The current model sample is structurally valid but visually unreliable: distorted matrix geometry, a stationary projectile with changing vectors, fragmented chemistry notes and an inadequate molecule picture. Biology comes closest, with a wording correction still needed. Four samples cannot establish prevalence or model rankings.

The first complete speech units arrived 4.02 to 6.89 seconds after the standalone reasoning request began. This excludes endpointing, STT, routing, TTS and audible playback. No speed improvement from the document prototype is claimed. Returned total cost was $0.48855.

Next, improve one general composition/validation path: preserve semantic object relationships, scale, shared diagram/equation regions and state changes. Evaluate both the recorded cases and held-out topics from the representation families in STEM_WHITEBOARD. Then compare matched live turns including useful audio, visuals, student ink and complete playback. Do not solve the failures by routing topics to these fixtures. Multi-step derivations, data/statistical plots, circuits, computing, engineering, general 3D, image grounding and student revision feedback remain open coverage.

## Reproduction

`node scripts/evaluation/board-gallery.mjs --stem` generates `.data/evaluation/2026-09-20-board-stem/index.html` offline. Without the flag it still generates the prior gallery. Fixture sources are `stem-physical-documents.ts`, `stem-life-documents.ts` and the existing animal-cell fixture in `board-documents.ts`.

The four-call runner is offline by default: `node scripts/evaluation/stem-model-eval.mjs --dry-run`. Only explicit `--live` spends provider credits. Existing synthetic responses and SVGs are in ignored `.data/evaluation/stem-models-1789930467123/`. Regenerate the audit HTML with exported `stemModelPreview(report)` without repeating calls.

Scientific references for the authored relationships: [MIT matrix transformations](https://math.mit.edu/~djk/18_022/chapter16/section01.html), [OpenStax projectile motion](https://openstax.org/books/college-physics-2e/pages/3-4-projectile-motion), [parallel-plate field](https://openstax.org/books/university-physics-volume-2/pages/6-1-electric-flux), [magnetic force](https://openstax.org/books/university-physics-volume-2/pages/11-2-magnetic-fields-and-lines), [chemical equations](https://openstax.org/books/chemistry-2e/pages/4-1-writing-and-balancing-chemical-equations), [reaction barriers](https://openstax.org/books/chemistry-2e/pages/12-5-collision-theory) and [passive transport](https://openstax.org/books/biology-2e/pages/5-2-passive-transport). These support scientific content, not a claim of improved learning from this UI.
