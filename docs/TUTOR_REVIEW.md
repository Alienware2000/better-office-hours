# Watch and judge tutor tests

The local review page is [http://localhost:3106](http://localhost:3106). Start it from this checkout with `npm run review:tutor`. Keep that terminal running. This is a separate developer workshop; the voice tutor still runs at port 3105.

## Listen to the three candidates

The listening panel at the top now plays **Opus low, Astra low, then Fable low** on the same saved astronomy question. Press **Play comparison**, or replay one model with its listen button. **Pause / Resume** freezes and resumes both writing and audio; **Stop** cancels the sequence. New board groups appear in command order, with typewriter text and drawn strokes starting on actual audio playback. Existing groups remain visible. The page scrolls to the listening area once at the start. These are complete accepted sections, with no manual shortening or diagram repair.

This is newly synthesized, cached audio of the existing model responses, not a fresh model-latency run. Original speech/board readiness and model cost are displayed separately. No artificial model wait is inserted. The current renderer supplies layout and glyphs. The review schedules new groups sequentially using the clip clock, compressing the reveal if needed to finish within the section. This is a review presentation, not the original scheduler or complete student voice loop. Animation previews use the clip's audio time, with board refreshes driven by the audio timeupdate event, not word alignment.

On September 14, twelve clips were prepared through the existing TTS route implementation using Jessica and eleven_v3_conversational. Submitted normalized text totaled 1,386 characters. Audio duration was about 25.44 seconds for Opus, 27.12 for Astra, and 40.40 for Fable, excluding gaps between clips. All clips decoded and contained non-silent audio. Browser playback advanced automatically through the three candidates and updated their boards. That verifies software playback, not David's listening verdict or physical speaker volume.

Audio preparation consumes ElevenLabs credits. The existing route does not return dollar cost, so it remains explicitly unknown. Clips, per-clip synthesis timings, character counts, and comparison metadata are stored privately under `.data/evaluation/speech/`. Each clip is cached by normalized text, voice, TTS model, and route source hash. GET and replay do not make provider calls. Preparing again reuses completed clips. There were no new model calls for this listening comparison. The three source reports share the same input hash, low effort, and 8,000-token budget; returned providers still differ.

The speech service accepts only the fixed synthetic astronomy comparison, never arbitrary browser text or private session exports. It reads only speech configuration from the local environment file. Check it offline with `node scripts/check-tutor-speech.mjs`; this uses disposable fixtures and mocked audio. Restart the review server after changing speech source/configuration. The primary responsiveness metric is end-of-student-speech to the first useful audible response. Full generation time and audio length are secondary. A fresh isolated voice test must include recognition, routing, model readiness, synthesis, buffering, playback, and corresponding board readiness. Filler acknowledgments do not count as useful teaching.

## Your first review

1. Open the page. It selects the latest low-effort Opus and Astra results. Choose the same lesson in both result menus for a meaningful comparison. On a wide browser window they sit side by side; a narrow window stacks them.
2. Read the learner's request and the two responses. The three clocks show speech text readiness, board data readiness, and response completion. They do **not** measure when a student hears audio.
3. Use the board-stage menu to step from the introduction through each teaching beat. Speech shown below the board accumulates through that stage. For an animation, move the time slider to inspect its motion. Each page remains visible, so you can check whether a referenced object ended up elsewhere.
4. Expand the raw response and accepted-command inspectors when something looks wrong. Raw output is what the provider sent. Accepted commands are what the app's parser retained. The picture uses the actual BOH layout/store/drawing components. These can disagree, and that disagreement is useful evidence.
5. Mark correctness, teaching, and speech/board agreement as “Looks good” or “Needs work,” add a specific note, and click **Save my review**. No automated result fills in your judgment. Saved reviews survive a server restart. Unsaved notes survive changing result/stage within the current page, but not reloading or closing it. **Export my reviews** downloads the saved judgments.

A useful note identifies a moment: “Beat 2 refers to the membrane, but its animation is on a separate page.” Prefer that to just “bad.” The page includes lesson-specific review criteria under each response.

## Watching the next test

Choose one synthetic lesson, models, and sample count under **Next experiment**. The button tells you exactly how many paid requests will start. Click it to run. Nothing runs just because you open or refresh the page.

The live panel shows the current model/case, elapsed time, completed request count, and usable speech/board progress as it arrives. Models run sequentially. **Cancel remaining requests** aborts the active stream and prevents the next request; consumed provider usage is not undone. Completed reports remain available. When the batch finishes, **Compare the new results** loads its last two results.

The initial controls offer Opus 5 and GPT-6 Astra because the preceding compatibility pilot identified them for further evaluation. This is not a declaration that they are the best tutors. Both use low reasoning effort, an 8,000-token completion allowance, omitted temperature, latency-sorted provider routing, no provider fallback, no SDK retry, and a 60-second request deadline. Each batch is capped at ten requests. Provider choice is recorded but not pinned, so differences between endpoints remain a confounder.

## What this can and cannot show

The page can expose model output, parser rejection, dropped commands, missing highlight targets, layout/page changes, motion at a chosen time, and the delay before usable structured output arrives. Automatic warnings are structural checks, not a complete semantic review.

These are synthetic deep-teaching requests. The report comparison does not run the microphone, speech recognition, routing lane, retrieval, graded-content playback filtering, or the full student interface. The separate listening panel adds newly synthesized section-by-section playback, not the production scheduler. The static report panes show completed marks; the listening panel reveals them progressively with the current renderer. They do not prove what a student saw during an earlier session. Model progress snapshots contain accepted speech/board data and timestamps, not hidden reasoning or audio; listening clips are stored separately. Polling can add up to about two seconds to what you see live; the stored readiness clock is taken inside the benchmark, not from the poll.

The first eleven historical reports contain only readiness milestones, not incremental snapshots. Current input can be inspected only when its hash matches the historical report. Different hashes, effort/budget, providers, and source revisions should not be treated as a controlled model comparison. Source revision plus a dirty flag does not capture every uncommitted file.

After your quality review, the next step is repeated tests across the remaining subjects and an isolated voice trial measuring end-of-student-speech to actual audible response and the corresponding visual. No provider migration has been made.

## Storage and reproduction

- Server: `scripts/review-tutor-models.mjs`; page assets/renderer bridge: `scripts/evaluation/`.
- Immutable run reports: `.data/evaluation/review-run-<id>/`. Existing compatible pilot reports are discovered in `.data/evaluation` and its immediate subdirectories, with a 200-file scan bound.
- Saved judgments: `.data/evaluation/review/ratings.json`, keyed by report content/source identity, written atomically with private file permissions.
- Credential: ignored `.env.benchmark.local`, read only by the server when a paid test starts. Never copy it into browser code, reports, or Git.
- Offline checks: `node scripts/check-tutor-benchmark.mjs` and `node scripts/check-tutor-review.mjs`. The latter creates disposable fixtures and uses a fake provider. It never uses the credential.

The server binds only to loopback, serves an explicit asset/API list, rejects outside origins, and requires a per-process review token for writes. Do not expose it publicly. It does not load saved Chrome sessions or change the running tutor. Keep private reports and ratings out of Git. A new checkout will have the code but needs an explicit private data/config transfer to show the same local reports.

To reproduce this pattern in another project, reuse the four parts: synthetic cases captured from the real request path; immutable raw/accepted/timing reports; a renderer adapter using that project's real visual components; and a separate local page for human review and bounded live runs. Port the schema, parser, renderer, credential name, and safety boundaries deliberately. BOH's TypeScript loader and board adapter are project-specific, so copying only the HTML does not reproduce its evaluations.

## September 14 visual feedback

David rejected the quality of the Astra/Fable astronomy diagrams: concentric-circle labels overlap, the Astra heading collides with labels, and Fable's prose `line pattern = element fingerprint` appears as colored italic math. These are human observations, not automatically submitted ratings. No model winner is selected.

The replay previously mounted completed SVG stages, bypassing the app's glyph/stroke reveal. The listening panel now requests real entering-group markup, schedules only new/changed groups, and advances opacity/strokes from audio time. Pause preserves the frame; stop cancels updates. Reduced-motion users see completed marks. These changes do not repair layout or alter the generated commands.

The shared `math-source.ts` heuristic treats `=` as math even inside prose. The diagram label placer searches a bounded set of nearby positions and can choose an overlapping result when no candidate fits. Server text measurement is also approximate. Fix these with the saved synthetic examples in an isolated renderer slice, preserving equations and genuine geometry rather than patching each model's output. A full visual design language remains a later project.

During verification, clicking the browser's native audio pause through accessibility twice closed/crashed the inspected tab. The underlying cause is unconfirmed; do not attribute it conclusively to animation. Use the review's ordinary Pause / Resume button for automation. The abandoned experiment used a paused browser animation object per glyph; the final implementation uses direct media-clock styles. The final three-model comparison completed. Page Pause / Resume held media time and reveal state; Fable glyphs progressed from hidden to shown. Offline checks cover stroke progress, glyph order, seeking, and preserved completed dash styles.
