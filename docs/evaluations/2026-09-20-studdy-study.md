# Studdy: lessons for Better Office Hours

September 20, 2026. Research and design analysis, not a product integration or a measured competitor benchmark. BOH source inspected at `df97cdd`. Current tutor on 3116 remains `1770053`; the newer document galleries are still separate.

## Evidence and its limits

David supplied sixteen screenshots and reports that he tried Studdy, found it responsive, and returned to a lesson that remembered and highlighted where he had stopped. Screenshots 1–6 show marketing examples, 7–14 show his lesson sequence, and 15–16 show entry choices. The screenshots support visual analysis; his report supports perceived responsiveness and continuity. Neither establishes timing distributions, how anatomy illustrations are produced, or general reliability across STEM.

The [official site](https://studdyai.com/) matches the supplied imagery. It markets document-based lessons, narrated diagrams/equations, interruptions and practice from uploaded material. The [partnerships page](https://studdyai.com/partnerships) describes an interactive canvas and embedding options. These are first-party claims, not independently verified performance. Browser inspection of the public entry reached sign-in. No account was created, authenticated lesson started, student material uploaded or paid test run.

The [company profile](https://www.ycombinator.com/companies/studdy) describes speech, text and image recognition without naming the current implementation. The [privacy policy](https://studdyai.com/privacy-policy) includes uploaded material, whiteboard drawings and voice/text interactions among collected content; that does not identify a memory architecture. The reviewed public sources did not disclose a current model, STT/TTS provider, renderer, image sourcing method, latency breakdown or resume algorithm. Older mobile-product material, similarly named apps, founder side projects and competitor claims cannot establish the current web tutor's stack.

## What the screenshots make concrete

| Visible pattern | Why it is useful for BOH | Adoption boundary |
| --- | --- | --- |
| The board fills almost the whole lesson view; compact controls sit around its edges | The object being explained receives most of the available space. Voice can remain the primary input while the board is the primary visual surface | Preserve the plain orb, optional typing and PDF access; this is a later focused layout pass, not permission to replace the whole shell |
| Projectile equations remain beside their diagram; new working appears below existing working | Stable placement lets the learner relate notation to geometry without rebuilding the mental picture every turn | Use general composition that stacks on narrow displays. A fixed two-column physics scene is not the product architecture |
| Successive frames add a heading, equations and component diagram, then circle or highlight a step | The current teaching step is visually identifiable while previous reasoning stays available | Still frames suggest construction order but do not prove narration synchronization. Our test must inspect actual playback |
| Red, teal and blue distinguish geometric elements; ordinary prose stays mostly neutral | Selective color gives relationships visual identity | Do not copy arbitrary token coloring. Labels and geometry must remain sufficient without color |
| The examples combine mathematical drawings with richer anatomical imagery | Different explanations need different representations | Image quality in marketing is not proof of live image generation. BOH should evaluate sourced illustrations or student-material crops with editable annotations alongside native diagrams, not approximate every structure with circles |
| Captions are compact near the bottom; secondary settings live in a menu | The transcript need not compete with the board during explanation | Keep captions readable and controls discoverable, with clear accessible labels. Do not reproduce the exact mascot, gradients or handwriting treatment |
| Navigation help lists pan/zoom; a follow control is visible | Learners can inspect prior work and return to the tutor's current focus | Preserve manual browsing. Automatic focus must not continually pull the learner away from what they chose to inspect |
| David reports a highlighted return point | Re-entry feels continuous because the learner can locate the unfinished idea | Verify this behavior separately. Resuming a lesson is not proof of cross-session learner memory or mastery tracking |

The key design lesson is coordination: a stable workspace, a clearly indicated current step, incremental construction and peripheral controls. Decorative styling alone would not produce that behavior. Diagrams still need scientific checking, including angle definitions, units, geometry and symbol correspondence. Marketing checks such as “mastered” are not evidence that the learner can independently apply an idea.

## What BOH already has

`saved-sessions.ts` and `useVoiceLoop.ts` retain the transcript, model history, current/earlier board pages, student ink, animation state and parked desks. PDF view state is also saved locally. Restore pauses playback. Static-object highlights, animation focus and working-page following already exist. Concept mode already places an expanded board in the workspace; the surrounding 62/38 desk leaves substantial room for the orb/transcript.

The real gaps are dependable composition of related elements, explicit meaning between equation terms and diagram features, and a saved return point tied to what was actually taught. A transcript sentence enters history at playback start; it is not proof that the learner heard its ending. An incidental stored highlight is not a reliable resume anchor.

The first resume experiment should store a local page/object reference and the last completed teaching beat, restore the existing board, and gently focus that location. Record interrupted work separately. Missing or revised targets must fall back safely; old saves must remain usable. This could use existing playback completion events without adding a model call or automatic spoken recap. It is a proposal, not implemented behavior. Any shared persistence/recap changes require the existing lane coordination.

Richer images are another distinct gap. Our native geometry/math renderer should coexist with a tested image-and-annotation path for cases like anatomy. Source provenance, image meaning, label placement and scientific accuracy need evaluation. This does not establish Studdy's approach or authorize a new image service now.

## Latency: investigate the whole interaction

“Feels like no latency” is valuable user feedback, but a numeric comparison needs measurements. Separate preparation after an upload, an ordinary lesson follow-up, an unexpected change of direction and returning to a saved lesson. A smooth continuation may have a different cost from a new explanation. Precomputation, streaming, caching and parallel work are possible engineering approaches, not facts about Studdy.

BOH already streams complete accepted teaching beats and prepares upcoming speech. Do not reintroduce fragmented audio or announce streaming as a new feature. Its automatic endpoint path in `app/(session)/voice/useVoiceLoop.ts` waits over 3000 ms since the last confident speech frame before submitting a recording. This is a deliberate pause allowance, not measured total latency or necessarily three seconds after the physical end of every utterance. Recognition, generation, synthesis and playback add further stages.

Measure automatic endpointing and explicit end-of-turn separately, with typed input as a separate diagnostic condition. Test both short answers and a learner thinking aloud with pauses. Shortening a timer blindly could recreate interrupted thinking or background-noise turns. A follow-up experiment can examine earlier complete, useful narration and visual readiness only if traces show that boundary is the bottleneck; preserve complete speech and paired visual validation.

For a controlled comparison, use fresh synthetic material and the same tasks. Start with three repetitions per condition to find large delays, then expand if results warrant it. Retain individual times and sample counts; this small sample cannot establish tail performance. Record:

- Upload/initialization to lesson-ready, separately from conversation latency.
- End of student speech to first useful audible teaching, not an acknowledgment or animated placeholder.
- End of speech to first relevant visual, plus whether it agrees with the words.
- Recovery after an unexpected follow-up and an intentional interruption.
- Correct board, location, paused/listening state and unfinished step on return.

For BOH, include endpoint detection, STT completion, model dispatch, complete usable beat, speech readiness and browser playback diagnostics. Physical audio still needs human observation. Prior 4.02–6.89 s STEM speech-unit readiness excluded the voice pipeline and is not comparable to David's subjective Studdy observation.

## Apply the findings without restarting the project

1. Keep the current live composition milestone: reproduce the saved matrix equation/page split and improve the general layout path. Treat stable diagram-plus-working composition as an acceptance criterion.
2. Run the full-session protocol in [APP_TEST_PLAN](../APP_TEST_PLAN.md), measuring the actual bottleneck and testing return-to-session behavior. Preserve graded-work safeguards and student ink.
3. Follow with a narrowly scoped local return-point improvement. Judge whether a learner can identify where to continue without scanning the transcript.
4. Review a board-dominant teaching layout and image/annotation support separately, using real lesson failures to set priority. Preserve voice-first entry, the plain orb and the existing design language.

Success is a complete, responsive and understandable lesson on unfamiliar material, including a follow-up and a return visit. No model migration, new renderer, infinite-canvas implementation, cloud memory service, live-runtime update or public reopening was performed in this research slice.
