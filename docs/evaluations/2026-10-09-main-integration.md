# October 9 main integration candidate

David requested relevant accumulated work on main, a light README refresh, and selected Opus over slow Grok. This packet is the concrete review step. Implementation commit: `830980a`. All work remains local on `lane/post-hackathon-local`. No push, PR, main merge, deployment or public reopening occurred.

## Publication scope

Fetched base and rollback reference: `3163d7ffea5ff820247403298546993295c70298`. It was merged conflict-free into the development lane at `d0d4d31e426d07aca91a2816b70ed12e60b2929a`, preserving the new LinkedIn demo link. Local main is stale. The accumulated candidate contains interdependent voice, workspace, whiteboard, optional typing/mic mute, session recovery, workflow and evaluation changes; retain dependencies instead of blindly cherry-picking 66 prior local commits.

The current slice promotes the pinned `anthropic/claude-opus-5` profile through OpenRouter to normal routing, teaching, silent visual repair and recap. `lib/agent/provider.ts` owns explicit selection. `BOH_TUTOR_PROVIDER=grok` with `XAI_API_KEY` restores the earlier fast/deep xAI models. Missing keys fail visibly without switching providers. The OpenAI SDK is reused. Temperature is omitted for Opus; low reasoning effort, required parameter support, latency sorting, no provider fallback and zero SDK retries are pinned. These settings are not a universal speed guarantee. Normal semantic routing, course selection and student-first recap remain active; the direct-teaching development trial stays separate.

README now leads with the product, describes the hackathon as its origin, retains hosted/LinkedIn links, moves build screenshots below usage, and explains local setup and current limits. Full-repository lint fixes publish PDF event-handler refs in a layout effect and avoid assigning a script variable named module. Generated voice assets and ignored runtime snapshots are excluded from lint.

The authored STEM gallery and document composition system remain studies, not the live tutor's general layout engine. Generated matrices, declarative diagrams/animation, MathJax writing and editable student ink are live capabilities. Diagram semantics, density and pacing remain unfinished. No broad STEM correctness claim or completed board-design sign-off is implied.

PR #11 remains outside this integration: its persistence/identity assumptions need reconciliation. Frozen human PROMPT/PEDAGOGY and `lib/types.ts` were not edited in this slice. Public Vercel remains paused. Candidate `vercel.json` disables git-triggered deployments across branches, as supported by [Vercel's configuration documentation](https://vercel.com/docs/project-configuration/git-configuration). This is a checked-in publication guard, not a remote pause/unpause action.

## Existing shared-contract review

The accumulated branch already extends DrawCommand with bounded panels, six literal colors and optional line labels under David's September 14 exception. These additions were inspected, not expanded:

- `lib/whiteboard/panel.ts`: bounded slots/items/bands/gaps and color validation, semantic panel geometry.
- `lib/whiteboard/parse-draw.ts` and lesson parsing: panel/line validation before consumption.
- `lib/whiteboard/geometry.ts`: panel geometry and midpoint line labels.
- `lib/whiteboard/style.ts`: complete literal color mapping.
- `lib/whiteboard/store.ts`: panel page ownership and new-topic behavior.
- `lib/agent/concept-response.ts`: per-beat visual validation, disclosure metadata and current-object references.

Offline panel/diagram/lesson tests cover these consumers. No schema deletion or session storage version change is introduced. This technical review does not claim Hussein personally reviewed the candidate. Shared integration should remain visible in the publication review.

## Validation and evidence boundaries

All provider prompts used for this review were synthetic. Raw provider output, generated audio, uploaded test PDF and session exports remain outside tracked source. Groundtrack tools are unavailable; local docs are the engineering record.

| Check | Result |
| --- | --- |
| Offline candidate gate | All 18 pass, including actual adapter mocks for production Opus routing/course selection/repair/closing/recap, missing-key failure and explicit Grok rollback. |
| Full lint and integration smoke | Pass after the six existing source errors and generated-directory scanning were fixed. |
| Isolated production build | Default Turbopack build and TypeScript pass. Test clone has separate .data and copied dependencies. |
| Live generated matrix lesson | Browser rendered before/after augmented matrices and `R2 - 3R1`, with correct arithmetic and a same-solution-set caption. Speech exceeded the requested 70-word ceiling. |
| Browser recovery | Synthetic board ink, transcript and matrix survive reload. Uploaded one-page synthetic PDF, pen mark and 125% zoom survive reload. PDF undo/redo work. Mic remains off after recovery. |
| Real ElevenLabs TTS | HTTP 200, 90,741 audio bytes, about 1.25 seconds for one short synthetic sentence. No human listening rating. |
| Real ElevenLabs STT | HTTP 200, about 0.886 seconds for the generated audio; returned the row-operation sentence accurately. This is not a human microphone/acoustic check. |
| Live routing/recap | Biology teaching, student-first summary request and grounded recap succeed without parser errors; invented review sources are removed. |
| Graded disclosure | Initial equation test FAILED by giving the correct value as a guess on board and in speech. Tightened presentation guidance; fresh equation and chemistry checks both withheld final values and asked a first-step question. No universal semantic guarantee. |

Live retests: first accepted output 2.854/3.138 seconds; total responses 7.079/7.042 seconds. These clocks start at the deep HTTP request and include accepted teaching metadata. They do not measure first useful visual, first audible teaching, endpointing/STT/routing, cost or human perception. Do not use them as end-to-end latency claims.

Offline report: `.data/evaluation/consolidation/offline-1791519612346.json` in the working checkout. Live records are under `.data/evaluation/opus-promotion/` in the isolated `/var/folders/pv/g5wp8n9d0ks14g87hdyh6vyh0000gn/T/boh-opus-review-0n3fmnbl` clone. A synthetic rendered recovery screenshot is `/tmp/boh-opus-matrix-recovered.jpg`. Temporary paths are local evidence, not durable Git backups.

## Runtime and remaining decisions

The isolated review app runs at localhost:3120. The old localhost:3116 snapshot and its saves are untouched. The review server was rebuilt/restarted only at its own verified cwd. Refreshing 3116 cannot reveal these source changes.

Persistence currently means browser-origin IndexedDB records for transcript, board, ink and recap, plus server-held PDF references. PDF bytes need their own local/private storage. Saves restore the selected desk with audio paused. Clearing browser data can erase sessions. This is not cross-device sync or cross-session learner memory.

Before publication: David reviews this concrete candidate and the diff, then authorizes push/PR/main integration. Public deployment stays a separate decision. Before release: human microphone/listening/interruption testing, useful-response timing, broader graded adversarial tests and STEM teaching/diagram quality. The first graded failure and long speech remain explicit risks; two passing retests are limited evidence. No more prompt-loop tuning or unrelated renderer redesign is included in this slice.
