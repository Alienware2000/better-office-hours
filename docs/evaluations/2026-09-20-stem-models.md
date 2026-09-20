# STEM model audit, September 20

Four real synthetic concept turns exposed a gap between valid drawing output and a trustworthy STEM explanation. Every response parsed and finished normally, but the projectile animation was physically misleading, the matrix picture used a non-square "unit square", and the chemistry response supplied labeled totals rather than the requested molecule-count picture. This is a small diagnostic sample, not a ranking of models or a STEM pass rate.

## Method and boundaries

Runner: `scripts/evaluation/stem-model-eval.mjs`. It captures the real trial request through `streamGrok`, including current prompt, diagram guidance and lesson schema, then uses the existing benchmark's incremental/final parser and the actual board store, layout, SVG and MathJax components. It deliberately runs the current free-form trial route, not the new authored document gallery.

- Source base: `dd72d8ac4002e7a09a7fcd81c6eb520a9da970bd`, with the new runner uncommitted and parallel evaluation work in progress. No product prompt or renderer was changed for the calls.
- Four sequential requests, one per case. Synthetic, explicitly ungraded self-study; no private PDF, history, image or student ink.
- Current `opus-low-v1`: `anthropic/claude-opus-5`, low effort, 8,000-token ceiling, provider-default temperature, latency-sorted capable providers, no fallbacks or SDK retries, 60-second request limit.
- All four returned model `anthropic/claude-opus-5`, provider `Anthropic`, finish reason `stop`. All returned zero cached prompt tokens. Returned reasoning-token counts were zero; that is provider metadata, not evidence about undisclosed internal computation.
- Local evidence: `.data/evaluation/stem-models-1789930467123/report.json` and `index.html`. Raw synthetic responses and SVGs remain ignored. Input/request hashes are in the report. Total returned cost: **$0.48855**.
- No STT, TTS, audio, browser playback, routing, retrieval, repair call, continuous interaction, mobile or learner test. The runner uses the real parser, but does not exercise the voice client's progress/idle deadlines or cancellation policy.

## Timings

Times below begin when the standalone deep request starts. Speech-ready means a complete app-parseable spoken unit. Board-ready means accepted structural output, not a visible or semantically correct diagram.

| Case | First content | First speech-ready | First board-ready | Completed | Reconstructed pages |
| --- | ---: | ---: | ---: | ---: | ---: |
| Matrix transformation | 2.008 s | 6.398 s | 6.402 s | 13.782 s | 2 |
| Projectile components | 2.326 s | 6.354 s | 6.355 s | 19.160 s | 2 |
| Balanced reaction | 1.225 s | 4.021 s | 4.022 s | 7.867 s | 3 |
| Membrane diffusion | 1.675 s | 6.892 s | 6.893 s | 12.392 s | 1 |

Inputs were 53,779 to 53,841 serialized message characters and 17,666 to 17,683 reported prompt tokens. First useful completion can arrive several seconds after the first content token because the app waits for a complete structured beat. This is not end-of-speech to audible-response latency. There is no matched control, repetition, p95, improvement claim or measured effect from the new board structure.

## Agent review of generated content

### Mathematics: representation and layout need work

Requested `A = diag(2,1)`, a unit square before/after, the two basis directions, and matrix notation. The equations correctly give `A e1 = 2 e1` and `A e2 = e2`; the after-picture doubles the drawn horizontal width and keeps its vertical height. MathJax output contains proper matrix paths.

However, the initial figure spans x = .18 to .34 and y = .38 to .62. Its width is .16 and height .24 in a square viewport. Without a declared unequal coordinate scale, it visually contradicts the claim that both basis arrows have length one and the object is a unit square. The two equations also do not remain together: current layout puts `eq2` on a second page. Neither failure triggers structural repair.

Required next evaluation: constrain coordinate scale for geometric quantities and reserve a shared region for a related equation pair. Check the rendered geometry, not just matching numbers in LaTeX.

### Physics: reject the generated motion

The model supplies horizontal/vertical component equations and a curved path, plus a dot and two attached arrows. But its path keyframes have `drawn: 1` at both t = 0 and t = 7. The dot uses Follow on that path throughout. The actual animation sampler therefore puts the ball at **(.78,.62)** at t = 0, .65, 3.5, 6.3 and 7 seconds. Only the vertical vector changes from upward to zero to downward, while the ball remains at the landing point.

This reproduces the stationary-Follow failure already recorded in STATUS. It is a model/spec error that the renderer faithfully executes, not proof of broken interpolation. A valid animation schema cannot establish physical agreement with narration. For ideal projectile motion, the horizontal component is constant while vertical velocity changes with gravity; at the apex the vertical component is zero and the object must actually be at the apex. [OpenStax projectile motion](https://openstax.org/books/university-physics-volume-1/pages/4-3-projectile-motion).

Two more issues: `eq-y` flows to a second page apart from the motion, and the narration says the vertical speed "loses g times t each second". The decrease in vertical velocity is `g` per second, or `gt` after elapsed time t. The given `x = vx t` also assumes the launch point is x = 0, which the response does not label. No new retry was spent hiding these failures.

### Chemistry: counts correct, picture inadequate

The spoken atom totals and balanced equation are correct: four H and two O on both sides. The response distinguishes coefficients from subscripts, and the equation typesets successfully. These are the relevant distinctions when balancing an equation. [OpenStax chemical equations](https://openstax.org/books/chemistry-2e/pages/4-1-writing-and-balancing-chemical-equations).

The requested particle picture does not materialize. Instead, each panel contains two generic circles labeled with aggregate counts. The reactant panel labels one circle "H2 and H2: 4 H" and another "O2: 2 O". The product panel separates water's H and O totals into different circles. Those circles are categories, not the two hydrogen molecules, one oxygen molecule, and two water molecules the learner asked to see. A caption cannot substitute for visible grouping when counting atoms is the lesson.

The actual layout yields a heading-only page, a page containing the two panels, and a third page containing the equation. This fragments one small explanation. Current trial guidance permits panel mode and discourages mixing representations, which needs review against the new diagram-plus-equation direction rather than another model switch.

### Biology: closest to the requested explanation

The output contains a two-line membrane, three same-sized particles outside versus one inside, a crossing arrow each way, and a distinct net-flow arrow toward the less concentrated side. All stay on one reconstructed page. The static schematic distinguishes random individual crossings from the net effect and makes no pump or ATP mechanism claim. This matches the basic passive-diffusion model for small nonpolar molecules. [OpenStax passive transport](https://openstax.org/books/biology-2e/pages/5-2-passive-transport).

The phrase "no energy needed" should become "no cellular energy input required" so it does not suggest molecules lack thermal motion/energy. The picture is schematic rather than a realistic membrane or stochastic simulation. Browser-level label crowding, student interpretation and learning benefit are separate checks; they are not certified by this review.

All four responses exceeded the trial's 25-to-45-word aim: 49, 60, 63 and 47 whitespace-separated words. This is a presentation finding, not by itself a reason to truncate speech.

## What this changes

Keep the authored STEM gallery as a design/renderer test. Keep these untouched generated examples as a separate model audit. The next integration should improve general composition and semantic constraints: scale/units for geometry, consistent quantity identities, molecule grouping, motion invariants, and shared diagram/equation space. Do not select canned topic fixtures in the tutor or silently correct a scientifically wrong model output by guessing its intended lesson.

Test the same cases after that bounded change, retaining failures and comparing request-to-first-complete-beat timing as well as correctness. Then test audible onset and narrated visual agreement through an isolated voice runtime. Broader electricity, magnetism, advanced chemistry, cell mechanisms, image grounding, multi-turn correction and student-ink feedback remain outside this four-call model sample.

## Reproduction and validation

`node scripts/evaluation/stem-model-eval.mjs --dry-run` captures metadata without reading credentials or calling a provider. `--live` explicitly loads only the benchmark OpenRouter key from the existing ignored key file and makes exactly four paid calls. It creates a new ignored report directory each time and never overwrites the prior run. Do not use it as an automatic CI check.

Offline capture, runner ESLint and `git diff --check` passed. The four live calls completed; actual SVG reconstructions and five sampled projectile states were inspected. No live server was restarted or modified by this runner.

Browser review found an evaluation-wrapper error before accepting the visual artifact: the initial standalone HTML omitted `whiteboard.css`, including the required `vector-effect: non-scaling-stroke`. Pixel stroke widths consequently scaled with the normalized SVG viewport and covered the geometry. The preview generator now embeds the exact current board stylesheet, like the authored gallery. The saved report regenerated the HTML offline, and only that static HTML was copied to the existing 3116 preview. Model outputs, geometry, metrics and provider calls were unchanged. A future SVG audit must include the component's real CSS before attributing a visual failure to the model or renderer.
