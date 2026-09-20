# A visual, participatory board

September 20, 2026. Research and local prototype decision record following David's review of `board-system.html`. This extends [the architecture research](WHITEBOARD_RESEARCH.md) and [the learning/cinema research](WHITEBOARD_LEARNING_RESEARCH.md). It supersedes the prototype's text-heavy first math page, not the standing tutor guardrails. Public deployment remains paused.

## Recommendation

Build a board that helps the learner see a relationship, manipulate or annotate it, and explain what changed. A useful default is a central diagram, nearby labels, the equation or claim it explains, and one short takeaway. Longer explanations remain available in narration and the transcript; deliberately requested reading notes can still be longer.

This is a design recommendation, not a scientifically established universal layout. Humanities may need quotations and competing interpretations; a proof may need several symbolic steps; a biological process may need a sequence. Choose the representation for the learning question. Do not turn every subject into a physics diagram, or every idea into a node-and-arrow map.

David's corrections are specific: ordered typewriter writing; meaningful color rather than random character colors; diagrams and equations together; key ideas rather than duplicated narration; smooth interaction; student authorship and tutor awareness. Latency remains a coequal constraint.

## What the references actually teach us

### Sketchplanations: explain a relationship with a picture

I inspected the rendered **[Melody and Harmony](https://sketchplanations.com/melody-and-harmony)** sketch and its accompanying explanation. Blue identifies a sequence of notes; warm vertical bands identify notes sounding together. Those marks share a single musical staff. The color carries a relationship, the labels name it, and the spatial arrangement does explanatory work. BOH can borrow that correspondence without copying the illustration or handwriting.

The rendered **[El Niño comparison](https://sketchplanations.com/el-nino)** keeps three related ocean scenes in a common orientation above aligned comparison rows. The shared layout makes differences easier to inspect. It is also quite dense at small sizes. Our inference: reveal one comparison dimension at a time on a compact board, retain the other states as context, and allow a settled overview afterward. Do not shrink an entire reference poster into a tutor card.

Sketchplanations is useful craft evidence, not an experiment establishing retention. Its [about page](https://sketchplanations.com/about) describes an authored and revised illustration practice. We should copy the discipline of selecting what explains the idea, not assume that a sketch aesthetic itself makes teaching effective.

### 3Blue1Brown and Manim: continuity makes an abstraction visible

In **[The Essence of Calculus](https://www.3blue1brown.com/lessons/essence-of-calculus/)**, the circle-area question develops through rings, unrolling and approximation into an area-under-a-graph relationship. Variables continue to refer to recognizable features. The written adaptation includes questions that ask the reader to use the relationship. My analysis: the useful pattern is object → operation → invariant → notation, with space to think, rather than an equation arriving on an unrelated page.

[Manim's TransformMatchingTex](https://docs.manim.community/en/stable/reference/manim.animation.transform_matching_parts.TransformMatchingTex.html) matches rendered pieces by their TeX strings. It demonstrates a mechanism for maintaining visual identity across equations. It does not verify that a transformation is mathematically valid. For BOH, mathematical meaning must determine the transition; matching glyphs alone is insufficient.

[Manim Voiceover bookmarks](https://voiceover.manim.community/en/stable/quickstart.html) attach animation actions to spoken landmarks. Our current board releases visuals at audio-clip start, not at aligned words. A future cue track could connect stable object IDs to narration landmarks. Keep Manim outside the live loop: borrow the sequencing concepts for the existing browser renderer.

Cinema offers useful craft ideas: establish the scene, direct attention, preserve the object through a transition, then hold a readable result. These are design inferences. Decoration, frequent cuts and perpetual motion have no automatic learning benefit. Physical motion must obey the represented relationship; a decorative easing curve must not change a supposedly constant velocity.

## Learning science: findings, limits, and product decisions

This is a focused research synthesis, not an exhaustive systematic review. Sources include original experiments, meta-analyses and an explanatory framework. Where a source was available only as an abstract or publisher excerpt, that is identified. No study below evaluates BOH.

| Evidence | What it supports and what it does not | BOH decision to test |
| --- | --- | --- |
| [Mayer and Johnson, 2008](https://doi.org/10.1037/0022-0663.100.2.380), two narrated-diagram experiments, full author-uploaded paper inspected | Two or three relevant words placed beside the depicted event improved retention, not transfer, compared with no printed labels. This does not establish that all text is harmful or prescribe an exact word limit for our app. | Keep names, units, a needed assumption, a key phrase and notation near their referents. Avoid copying the whole spoken paragraph onto the canvas. Retain captions and text access for quiet use and accessibility. |
| [Richter, Scheiter and Eitel, 2016](https://doi.org/10.1016/j.edurev.2015.12.003), signaling meta-analysis, publisher abstract/sections inspected | 27 studies and 45 comparisons examine cues linking textual and pictorial information. The relevant intervention is correspondence, not a more colorful interface. | Use the same explicitly assigned color for a quantity, its label and its equation term. Pair color with position and notation so color is not the sole cue. |
| [Ginns, 2006](https://doi.org/10.1016/j.learninstruc.2006.10.001), contiguity meta-analysis, publisher record inspected | Reviews spatial and temporal proximity in multimedia explanations. Applying it to this particular live-board layout is an inference. | Keep a diagram and its directly related equation together. Time the cue with the explanation. A new page is for a new reasoning context or genuine overflow. |
| [Rey et al., 2019](https://maria-wirzberger.de/wp-content/uploads/2019/01/Rey2019_Article_AMeta-analysisOfTheSegmentingE.pdf), full meta-analysis | 56 investigations, 88 comparisons: meaningful segmentation benefited retention/transfer on average and reduced load, but increased learning time. It supplies no universal ideal beat duration. | Break at conceptual boundaries, allow pause/replay, and hold completed states. Do not equate fastest playback with the best experience. |
| [Höffler and Leutner, 2007](https://www.leibniz-ipn.de/en/research/publications/instructional-animation-versus-static-pictures-a-meta-analysis), authors' institutional abstract | An overall animation advantage across heterogeneous studies, with benefits depending on the kind of animation and learning target. This is not evidence for animating every mark. | Animate motion, transformation or causal change when that is what the learner needs to understand. Use a static comparison where it communicates the relationship more clearly. |
| [Guo, Kim and Rubin, 2014](https://juhokim.com/files/LAS2014-Engagement.pdf), original observational study | 6.9 million viewing sessions across four edX courses; short videos and tablet-style drawing were associated with engagement proxies. Engagement measures are not a causal test of delayed retention, and MOOCs are not today's Shorts. | Borrow immediate visual orientation and concise explanations. Do not justify rapid cuts, constant novelty or a strict short-form duration with this study. |
| [Chi and Wylie, 2014](https://education.asu.edu/sites/g/files/litvpz656/files/lcl/chiwylie2014icap_2.pdf), ICAP framework | Distinguishes manipulating material from generating ideas and reciprocally constructing an explanation. A click by itself does not demonstrate understanding. | Offer meaningful actions: predict, sketch a relation, identify an assumption, explain a change. Use the response to change the next explanation. A highlight control is useful navigation, not proof of learning. |
| [Leutner and Biele, 2025](https://link.springer.com/article/10.1007/s10648-025-10067-7), open meta-analysis | 14 studies, 16 comparisons, N=1,213. Drawing support overall did not reliably improve outcomes; support promoting integration, such as comparing representations, showed a comprehension benefit. Its scope excludes concept maps and collaborative drawing. | After a student sketch, help them compare the marks with the concept and revise the relationship. Treat this as a promising design for feedback, not validation of an AI collaborator. |
| [Karpicke and Blunt, 2011](https://doi.org/10.1126/science.1199327), original study abstract | Retrieval practice outperformed elaborative concept mapping in the tested conditions, including inference questions. It does not mean concept maps are useless. | Let students reconstruct or apply an idea later. A beautiful completed board and an immediate “I get it” are not sufficient learning measures. |

**Typewriter effect:** implement it because David wants the feeling of a live explanation and because orderly appearance avoids a known rendering defect. The research reviewed here does not establish a learning advantage for character-by-character animation. Preserve layout while revealing whole graphemes, offer instant completion/replay and reduced motion, and avoid making a learner wait for a long paragraph. Reading order for a complex formula is a separate design problem from animating its glyph paths.

**Text density:** use a review heuristic, not a universal scientific quota: one central relationship, labels that identify features, only the symbolic steps needed now, and a short takeaway. If the page requires another paragraph to explain itself, first ask whether a diagram, comparison or clearer label could carry that meaning. Keep equations that matter even when they are visually dense. Explicitly requested reading notes remain a valid page type.

## What Opus's visual demonstrations do and do not establish

Anthropic's [March 12 visual-chat announcement](https://claude.com/blog/claude-builds-visuals) describes interactive charts and diagrams that change during conversation. Its [help documentation](https://support.claude.com/en/articles/13979539-custom-visuals-in-chat-and-cowork) documents SVG/HTML downloads. These are code-rendered interactive representations, not evidence that an API model emits a finished raster drawing or a film by itself.

The dated [Claude Design announcement, April 17](https://www.anthropic.com/news/claude-design-anthropic-labs) explicitly describes an Opus 4.7 product with design-system context, visual inputs, direct adjustments and iterative editing. The page's Brilliant testimonial concerns prototype production, not a controlled evaluation of teaching or diagram correctness. This announcement is evidence about that product and workflow, not a ranking of today's models.

[Anthropic's vision documentation](https://platform.claude.com/docs/en/build-with-claude/vision) warns about spatial and low-quality-image limitations. A capable model can still misread small notation or place a label incorrectly. Generated SVG and code need geometry, text, content and interaction checks.

We cannot verify the exact viral examples David saw without their source conversations, prompts and revision history. I found no controlled evidence in this review that a particular Opus configuration guarantees better live-tutoring diagrams than BOH's alternatives. Do not treat a curated demo as a zero-revision latency measurement.

### The local source audit changes the question

`lib/agent/trial.ts` already pins `anthropic/claude-opus-5`, low effort, 8,000 maximum tokens, one to three beats and at most six DRAW commands per beat. `lib/agent/concept-response.ts` also guides at most five primary shapes and short speech. The model produces a structured lesson translated into our existing SVG/MathJax primitives, not unrestricted HTML/SVG/JavaScript. These are source facts, not provider capability tests.

Possible contributors to the quality gap are composition guidance, representational limits, competing compactness instructions, reasoning effort, annotation layout and the absence of a render-review loop. Their relative importance is unmeasured. Increasing the token budget or changing models without controlling those variables would not isolate the cause.

Recommended comparison, pending a separate provider evaluation: same ungraded prompts, teaching boundaries and context; first vary composition guidance within the current schema, then compare a richer structured representation; keep model/effort fixed. In another arm vary effort while keeping representation fixed. Log first useful audio, first meaningful visual, total completion, invalid output/repair rate, label collisions and human teaching-quality judgments. Repeated cases are needed because output varies. No live generated scripts or model migration is part of this slice.

A shared design system could reduce repeated coordinate/style decisions and output verbosity. A larger planner or visual critic could add latency. Neither latency improvement nor regression has been measured for this prototype.

## Student ink: what exists and the missing experience

Inspected source paths:

- `components/whiteboard/useBoardInk.ts`: student pen gestures are local; beginning work dispatches `boh:student-writing`.
- `app/(session)/voice/useVoiceLoop.ts`: writing stops current playback/inference and returns to listening unless paused. Ink changes do not automatically launch another tutor response. This behavior deserves a deliberate UX review because annotating while listening can currently interrupt the tutor.
- `components/whiteboard/Whiteboard.tsx`: the active board snapshot provider renders settled tutor content plus student strokes and, separately, student strokes alone. It includes page/revision/ownership metadata. Earlier pages are not the same as the working-page image.
- `lib/agent/grok.ts`: reasoning requests, including the Opus trial, use `toApiMessages`, attaching the combined image and the separately labeled student-only image when available. The fast router receives a compact metadata summary, not those images.
- `lib/whiteboard/live-board.ts`: ownership instructions prohibit treating tutor notes as student attempts or mastery.

Therefore, student ink awareness is partly implemented. It is turn-boundary image context, not continuous visual understanding or verified handwriting recognition. An inactive/unmounted board can lack an image; a pen gesture in progress has not necessarily committed to the snapshot. No provider recognition accuracy or iPad/Pencil quality was tested in this research slice.

Proposed interaction: student writes → finishes a stroke/idea → speaks or types a request, or chooses a quiet “Check my work” action → capture the committed page and revision → tutor refers to a specific visible mark → clarify ambiguous notation → invite a meaningful comparison or revision. Preserve student strokes; put suggestions in a separate tutor layer. Do not trigger a new explanation after every pen movement. Decide separately whether pen-down should pause only the animation, or also interrupt speech. That policy needs review before changing existing voice behavior.

## Board architecture and concrete next steps

A reusable foundation should separate six concerns:

1. **Teaching intent:** the relationship, what is already known, what may be disclosed now, and the learner action if useful.
2. **Semantic scene:** objects, quantities, labels, equations, connections and student-authored marks with stable IDs. A diagram quantity and its equation term can refer to the same concept.
3. **Composition:** typography, color roles, measured text, label anchors, reserved ink space, page continuation and overflow rejection. The application supplies consistency; the model supplies meaning.
4. **Presentation:** reveal, emphasize, transform, hold and revisit. Use a single clock per scene; narration alignment and physical simulation time are distinct from decorative reveal timing.
5. **Observation:** a page/revision-stamped snapshot, provenance and uncertainty, gathered at intentional turn boundaries.
6. **Learning evidence:** what the student actually predicted, explained, drew or applied. Tutor-created content never substitutes for that evidence.

This is a proposed direction within David's lane, not a new frozen shared contract. General graph topology, responsive reflow, theorem/proof layout, rich inline notation, safe custom simulations and semantic animation remain future slices.

Implemented in this slice: a generic local figure-plus-equation composition, explicit concept colors/links, same-page area example, linked selection, and ordered writing/replay using the real BoardText/BoardShape components. The static gallery is a synthetic review surface; it does not call Opus or connect student ink/narration. [Validation and reproduction](evaluations/2026-09-20-board-experience.md).

Next: review this smaller visual direction; choose one structured writing integration while keeping the existing tutor and ink contracts; evaluate matched live turns against the current candidate. Then test student-ink feedback with ambiguous handwriting, corrections, earlier-page browsing, busy narration and graded-work boundaries. Keep the broader [product checklist](PRODUCT_CHECKLIST.md), especially audio completion, latency and recovery, active.

For an eventual learning evaluation, separate preference, immediate comprehension, transfer to a changed example and delayed retrieval. Control narration/content and exposure, account for prior knowledge, counterbalance order, and have content correctness reviewed independently of polish. The aim is an explanation a learner can use, with an attractive interface supporting it.
