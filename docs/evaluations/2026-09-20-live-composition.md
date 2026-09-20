# Live diagram and equation composition

September 20, 2026. Local candidate, no publication.

## Change

The existing live writing layout sized medium equations at .085 board units, then searched vertically at one horizontal position. Saved matrix and projectile model responses split related equations from their figures despite usable lateral space.

Equations alongside static or animated geometry now use the shared .052 type tier. Placement tries the requested column, center and safe paper edges at each candidate baseline before paging. Existing resolved writing, geometry and student ink are not resized/reflowed by this rule. Compact symbol labels and standalone writing retain their existing sizes. Tall math still reserves measured MathJax ascent/descent. No topic routing, model, prompt, provider, voice timing or frozen-contract changes.

The document-composition prototype remains separate. Panel/non-panel transitions still page explicitly. This patch does not validate scientific geometry, add continuous ink awareness, fix arbitrarily long math, or make the model validator aware of renderer overflow.

## Offline evidence

Saved synthetic report: ignored `.data/evaluation/stem-models-1789930467123/report.json`, replayed through `renderReview` with current live parser/store/React drawing. No repeat provider calls for this comparison.

| Saved case | Before pages | Candidate pages |
| --- | --- | --- |
| Matrix transformation | 2 | 1 |
| Projectile components | 2 | 1 |
| Balanced reaction | 3 | 3 |
| Membrane diffusion | 1 | 1 |

Both matrix equations fit at .052, with a .04688 horizontal gap and no text collisions. The previously generated figure's incorrect square proportions remain a separate model failure. Projectile motion semantics are also unchanged.

`node scripts/check-board-composition.mjs` tests the real parser/store/renderer with synthetic commands, without private report dependencies. It fails at the expected two-page matrix assertion against baseline fd84303 and passes the candidate. It covers stable prior writing/geometry/labels, exact student-ink retention, update-ID reuse, genuinely full handwritten-page continuation, tall matrices/fractions and animation clearance. Added to the repeatable candidate gate.

Other passing checks: board-writing, math, teaching-repairs, teaching-intent, diagrams, diagram-motion, TypeScript and targeted ESLint. `check-board.mjs` could not run because its default localhost:3100 server was absent; it is a live-provider check, not an offline gate. It is not counted as a pass. No production build was run under a live snapshot.

## App candidate and pending review

Clean source `19a3681c93235577c3eab7a4bfd1fffc69b97840`, runtime `.data/voice-trial-3117/run-1789934945716`, http://localhost:3117/. Manifest `.data/voice-trial-3117/latest.json` records source SHA256 `b1195165df5207cf6bf57e4b9c854d094bc839a2710e8454534df328341ca285` and unchanged profile SHA256 `5994397e00ac3b67620161ae0c64acc4717ce0a94d37a029ec4e31a1c7d9c639`.

3114/3115/3116 listeners were identified by cwd and preserved with their data. Candidate uses independent origin and storage. Two fresh ungraded typed turns ran through the real app and configured providers: initial matrix explanation, then a clarification referring to a blue student underline. Both remained on one page. Inspected at approximately 361 px and 642 px board width; equations were readable without label overlap. The first response still drew a non-square “unit square”, an accuracy failure independent of this layout fix.

The clarification retained the figure/equations and student stroke and added one short worked relation. The tutor referred to the underlined vertical basis vector consistently, but the text prompt also described the mark, so this is not proof of independent visual recognition. Speaking UI returned to idle; the microphone stayed off for typed input. No human listening assessment was performed.

After browser reload, all nine rendered tutor groups matched the earlier geometry/markup after ignoring empty style attributes left by reveal animation; the one student path matched exactly. Both conversational turns reappeared and typing was closed by default. Export was clicked, but a downloaded JSON was not located in Downloads, so export backup is unverified. No runtime replacement depends on that attempt.

Server diagnostics for the two turns reported first complete speech readiness at 6,944 ms and 3,382 ms after deep request start. These exclude student endpointing, STT and audible playback, and are not an end-to-end latency benchmark. Real acoustic interruption, full lesson progression, PDF recovery and broader subject sampling remain the next test protocol. No learning-outcome claim.
