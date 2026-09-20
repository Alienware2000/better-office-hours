# Representation choice and augmented matrices

September 20, 2026. Local candidate after David's Gaussian-elimination session on 3117. No publication or replacement of that live session.

## Problem and changes

The reported lesson stacked scalar equations and an oversized back-substitution note without showing a matrix. Its calculation was valid, but the representation and compressed explanation did not meet the learner's expectation.

General presentation guidance now asks the tutor to choose the appropriate mathematical or scientific representation proactively, keep structured objects intact, and demonstrate one meaningful operation with its effect and justification. It no longer treats all equations as supplements to physical pictures or discourages intact arrays. Matrix syntax is documented through the existing DRAW text field. This introduces no topic routing, new contract or fixture selection. Human PROMPT/PEDAGOGY and graded-work protections remain unchanged.

Full equations use the .052 writing tier both alone and beside geometry. Compact symbols remain .038. Supporting prose in given/note/definition rows now also uses .038 even without geometry, after visual review found it overshadowed the matrices. Other prose retains its existing scale; prior resolved writing/student ink are not resized. Mathematical rows can use lateral space before paging; given/note IDs retain left alignment.

The real comparison exposed a separate rendering defect: MathJax emits an SVG `line` for an augmented array's vertical separator. The path extractor rejected it, causing even correctly escaped arrays to become literal text. Protocol acceptance had not detected this failure. Solid horizontal/vertical table rules now become finite filled rectangles using MathJax's 70-unit default or declared thickness. Unsupported line styles still fall back. Focused regressions cover vertical, horizontal and double rules without changing valid JSON escaping.

## Four real model requests

Two synthetic ungraded prompts, one baseline and one candidate response each, on the same Opus low profile and 8,000-token budget. Four calls total, zero retries. The deep-request harness used strict live lesson validation; all four were accepted. No routing, retrieval, STT, TTS, browser session or acoustic test was included. Raw requests/responses remain ignored under `.data/evaluation/representation/`; total reported provider cost was $0.44479.

| Prompt | Version | First speech ready | Total response | Spoken words |
| --- | --- | ---: | ---: | ---: |
| Gaussian elimination | Baseline | 5,029 ms | 9,348 ms | 71 |
| Gaussian elimination | Candidate | 8,352 ms | 13,195 ms | 93 |
| Enzyme catalysis | Baseline | 4,788 ms | 9,802 ms | 62 |
| Enzyme catalysis | Candidate | 5,547 ms | 11,087 ms | 67 |

Baseline Gaussian output selected scalar equations. Candidate selected an augmented matrix without an explicit matrix request and correctly replaced row 2 by row 2 minus three times row 1: `[3,1|10] - 3[1,2|5] = [0,-5|-5]`. It explained reversibility. JSON/LaTeX escaping was correct; nested serialization initially looked misleading when printed.

This is partial improvement, not an overall teaching pass. The candidate used 93 words despite the 70-word guidance and invited back-substitution before explaining it. Its arrays omitted outer brackets. After request capture, a bracketed syntax example was added and conflicting one-sentence-per-beat wording was removed. Those final wording refinements have not had another provider test. Matrix-column explanation, progression and arrangement still need human review.

The enzyme candidate drew an enzyme/substrate/product schematic and explained a lower energy barrier without enzyme consumption. Its bond-straining mechanism is not universal, and its pocket shape/labeling needs review. The baseline's energy sketch lacked axes. Neither response establishes broad STEM reliability.

Both candidate requests were slower in this small sequential sample. Most of the Gaussian difference occurred before the first content token (1,876 to 5,135 ms). This cannot isolate the cause or establish a latency distribution. No latency improvement or end-to-end voice claim is made.

## Reproducibility and next review

Renderer checkpoint: `e90ca02` (augmented rules, writing hierarchy and regressions). General guidance changes are a separate local candidate checkpoint.

Baseline source: `84a925948fc1a0b8a39338082a019293add83658`. Candidate requests captured the uncommitted general-guidance changes before the final bracket and sentence-count wording refinements. Message hashes: Gaussian `e929e1d6c5035599712e2a84d81a660e5cd6efb44c220ef85db4762c4cfa9ecd`; enzyme `0d1471549a23663cb71a201e8da704d52766e0af528d394c852aa04fda797d59`.

The offline structured-math check streams every JSON character boundary, verifies complete visual/narration releases, and renders valid two- and three-row augmented matrices with the actual store and drawing components. It asserts intact glyph geometry, bounds, separation, and a correct row operation. It cannot prove a model will choose that representation or teach it well.

Focused checks passed: math (including actual table-rule geometry), structured-math, board-writing, board-composition, teaching-repairs, concept-lessons, teaching-intent, candidate-profile, TypeScript, targeted ESLint, and diff/context checks. The new structured-math check is in the candidate gate; the entire gate was not rerun. No production build was run under a live snapshot.

Replaying the four saved outputs with the final renderer yields one page each, real paths for every math mark, no text collision pairs, and in-paper measured bounds. Candidate matrices have eight and nine paths at .052; their given/note IDs stack them on the left instead of retaining the requested two columns. Before the separator fix this same candidate made two pages of literal TeX.

Browser review at approximately 550 px paper width confirmed legible matrices/dividers and reduced supporting notes without text overlap. Both enzyme sketches were also inspected; the missing pocket/axes remain model-content issues. This was static reconstruction, not reveal/audio playback. [Local audit](http://localhost:3116/board-representation.html) serves only the new synthetic review artifact on the existing gallery server. Both versions use the current renderer, so this is a model-response comparison, not original before/after screenshots. No new server was started.

Current 3117 still runs source `19a3681`; its saved session and source stay untouched. The next app slice is a deliberate candidate restart after the current session is finished, followed by an actual multi-turn lesson with measured audible latency and preserved ink. Additional prompts alone are not evidence of better teaching.
