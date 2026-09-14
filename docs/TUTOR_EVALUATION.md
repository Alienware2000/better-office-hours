# Tutor latency and visual reliability

Updated: 2026-09-14. Local evaluation only. No provider migration or production change has been made.

The first live results are in [the strong-model pilot](evaluations/2026-09-14-model-pilot.md). Eleven synthetic requests completed; no winner was selected.

## David's priorities

Latency is the immediate product bottleneck. David clarified that teaching quality comes first: seek the best capable tutor, then reduce delay without sacrificing reasoning, correctness, or visual agreement. The earlier Flash/Haiku shortlist overemphasized speed and is superseded. Neither model was tested or proven unsuitable; they are simply excluded from this first quality-focused round. David supplied the OpenRouter credential and authorized trying the comparison. It is stored only in ignored .env.benchmark.local with mode 600; never include its value in documentation or reports.

David wants the whiteboard involved every time the tutor speaks, especially for explanations, descriptions, equations, and numbers. Use a relevant new mark, annotation, or focus on an existing visible item, rather than repeatedly redrawing the same scene. Spoken references must correspond to what is actually visible, on the page the student is viewing. Graded-answer protection still applies: show established givens, scaffolding, or a permissible hint, never the answer the learner is being asked to supply. An arbitrary decorative mark does not satisfy this requirement. The treatment of topic-selection/social turns with no relevant object needs a deliberate design rather than silently keeping the current verbal-only exception.

Review all saved sessions in David's existing Chrome tab when that review starts. They span subjects beyond physics. David reported a stars-related example, transcribed in this conversation as "texture from the stars," where the tutor insisted on something that did not match the board. The exact session/topic and failure mechanism are unverified. Do not rename it to a guessed scientific topic or claim to have replayed it. The synthetic astronomy case below is independent test data, not a reconstruction of that session.

## Findings from the current code

| Finding | Evidence and implication |
| --- | --- |
| Substantive teaching makes sequential model requests | concept-routing.ts routes to THINK, then useVoiceLoop.ts starts the deep request. Switching only the gateway cannot eliminate this orchestration. |
| Deep model is fixed to Grok 4.6 with low reasoning effort | grok.ts sets the model, 2,400-token completion budget, and the strict concept_lesson format. Earlier comments describe historical timings, not new measurements. |
| The current teaching input is substantial | Offline capture on September 14 produced 48,676 to 49,139 characters in serialized messages across five synthetic cases, even without images, retrieval, or a long transcript. This is an input-size measurement, not proof that prompt size causes the observed delay. |
| Content arrival is not speech readiness | conceptProgress emits a complete introduction or completed beats. Partial JSON cannot safely be spoken or drawn. Benchmarking the first content token alone understates usable-response latency. |
| Synthesis adds waiting after text is ready | useVoiceLoop prepares each TTS response as a complete Blob, then queues playback. Board actions are applied at sentence playback. Measure actual audible onset separately. |
| Existing timing boundaries omit some stages | The LLM route starts its server timer after identity/course retrieval. Client first_audio is measured from its individual LLM request, not the student's end of speech across routing and STT. Do not sum overlapping metrics or call these end-to-end latency. |
| The existing visual policy is weaker than David's new requirement | concept-routing.ts permits verbal definitions; teaching-intent.ts/concept-response.ts permit visual=none for some short questions/checks. Explanations already require visuals, but that does not guarantee semantic agreement or actual visible playback. |
| Missing visuals can add another call | The client can request bounded silent visual repair. A technically valid but misleading picture may evade a structural missing-visual check. Review generated content, validation, disclosure filtering, state, and playback separately. |
| Old bench-deep is not a current teaching comparison | It uses a manually assembled prompt and one physics case, without the actual structured lesson/board pipeline. Retain as historical tooling; use the new harness for this first comparison. |

Relevant source: [grok.ts](../lib/agent/grok.ts), [concept-routing.ts](../lib/agent/concept-routing.ts), [concept-response.ts](../lib/agent/concept-response.ts), [teaching-intent.ts](../lib/agent/teaching-intent.ts), [LLM route](../app/api/agent/llm/route.ts), and [voice loop](../app/(session)/voice/useVoiceLoop.ts).

## First model comparison

Use [bench-tutor-models.mjs](../scripts/bench-tutor-models.mjs). The default is offline. It intercepts the actual request generated by streamGrok with synthetic context, then uses the real incremental lesson parser and visual guards. It neither starts the tutor nor reads Chrome, saved sessions, .env files, uploaded PDFs, or student data.

Five cases cover an astronomy explanation, cell-membrane diffusion, a graded algebra misconception, a supply/demand diagram, and a correction when the supplied board metadata lacks a promised arrow. These cases exercise broader subjects and failure types; they are not a representative user-study dataset. No images are included in this first harness, so visual understanding must be evaluated later with controlled screenshots and exported state.

Public [OpenRouter model metadata](https://openrouter.ai/api/v1/models) checked September 14 lists these candidates with image input and structured-output support. This is capability screening, not a tutoring-quality ranking:

| Candidate | Role in the comparison |
| --- | --- |
| Direct xAI grok-4.6 | Current tutor control |
| OpenRouter x-ai/grok-4.6 | Same-model route control; also a candidate at a larger reasoning allowance |
| OpenRouter openai/gpt-6-astra | Flagship reasoning candidate |
| OpenRouter anthropic/claude-opus-5 | Strong general reasoning/vision candidate |
| OpenRouter anthropic/claude-fable-5.1 | Additional demanding-reasoning reference |
| OpenRouter google/gemini-3.1-pro-preview | Pro-family reasoning/vision candidate |

[OpenAI's model page](https://developers.openai.com/api/docs/models/gpt-6-astra) identifies Astra as its most capable model. [Anthropic's lineup](https://platform.claude.com/docs/en/models/overview) distinguishes Opus for general complex workloads and Fable for demanding reasoning, with different latency profiles. [Google's model catalog](https://ai.google.dev/gemini-api/docs/models) supplies its current Gemini lineup. These vendor descriptions motivate candidates, not an automatic winner for BOH.

Do not cap every flagship at the old 2,400-token budget and call a truncated output poor reasoning. First run a compatibility/quality pilot with an 8,000-token allowance and model-default reasoning. Then compare successful candidates at matched, explicit budgets and supported effort levels. Keep the original Grok low-effort/2,400-token run as a separate current-stack control. The pilot is not a like-for-like proof of model superiority because settings differ from that control.

The catalog does not list temperature support for Astra or Fable 5.1. Use --temperature default to omit that parameter across the quality pilot while retaining strict provider capability routing. Provider defaults may differ; the report records the omission. The --max-tokens override changes only the standalone benchmark, never the tutor. Recheck metadata before running; model-default effort is not necessarily the same amount of computation across providers. Hiding reasoning content does not turn reasoning off. See [reasoning controls](https://openrouter.ai/docs/guides/best-practices/reasoning-tokens).

The harness requests latency-sorted providers, requires support for the supplied parameters, and disables provider fallbacks for the controlled comparison. SDK retries are also disabled and each request has a 60-second abort deadline. It records returned model/provider metadata when available; absent metadata stays null. The chosen provider is not pinned between runs, so a later controlled endpoint comparison should explicitly pin it. OpenRouter's latency preferences do not guarantee a response time. See [provider routing](https://openrouter.ai/docs/guides/routing/provider-selection).

All candidates receive the same messages and lesson schema. Temperature, output budget, model, effort, and provider options are explicit experimental settings. Match them when attributing a change to the model; distinguish capability pilots from current-stack controls. Request hashes, source revision, dirty state, completion reason, and usage are reported. A length-truncated or interrupted response fails even if some early content was usable. Token/cost usage is preserved when returned; no cost is inferred when unavailable.

## Commands

Run from this repository root with dependencies installed:

```sh
node scripts/bench-tutor-models.mjs --dry-run
node scripts/check-tutor-benchmark.mjs
```

The first prints request metadata, not measured model times. The second uses mocked streams and makes no API calls. There is no latency improvement claim from these checks.

The following commands are LIVE and consume credits. They require the selected API key in the process environment. Have the agent supply it through existing local secret handling; never paste a key into a chat, command history, or tracked file. The agent supplies OPENROUTER_API_KEY from ignored .env.benchmark.local to the benchmark child process. The script does not automatically load environment files, and the live tutor configuration is unchanged.

```sh
# One synthetic case first, to confirm compatibility:
node scripts/bench-tutor-models.mjs --live --route xai --model grok-4.6 --effort low --case astronomy-explanation
node scripts/bench-tutor-models.mjs --live --route openrouter --model x-ai/grok-4.6 --effort low --case astronomy-explanation
# Quality pilot, separate from the current-stack controls above:
node scripts/bench-tutor-models.mjs --live --route openrouter --model openai/gpt-6-astra --effort default --max-tokens 8000 --temperature default --case astronomy-explanation
node scripts/bench-tutor-models.mjs --live --route openrouter --model anthropic/claude-opus-5 --effort default --max-tokens 8000 --temperature default --case astronomy-explanation
node scripts/bench-tutor-models.mjs --live --route openrouter --model anthropic/claude-fable-5.1 --effort default --max-tokens 8000 --temperature default --case astronomy-explanation
node scripts/bench-tutor-models.mjs --live --route openrouter --model google/gemini-3.1-pro-preview --effort default --max-tokens 8000 --temperature default --case astronomy-explanation
```

After compatibility succeeds, omit --case to run all five; --runs 3 gives 15 requests for that candidate. Bounds are one to five repeats, run sequentially. Rotate candidate order across batches to reduce time-of-day effects. Save JSON stdout in an ignored local evaluation folder if retaining results; never overwrite a previous report. The report contains synthetic raw content and parsed speech/board for review, not hidden reasoning. Existing private sessions must not be substituted into this tool or sent to new providers without explicit scope and data authorization.

## What we score before choosing

- firstContentMs: arrival of the first nonempty content delta. Reasoning-only deltas do not count.
- firstSpeechReadyMs: the first complete app-parseable spoken unit. This may be an introduction, so human review still judges whether it helps.
- firstBoardReadyMs: the first parsed visual satisfying the current structural visual requirement, including a valid focus on an existing ID. This is not proof that the browser rendered it or that it agrees with speech.
- totalMs and finishReason: completion time and whether the stream ended normally. Failures remain in the report rather than disappearing from timing statistics.
- appParsed, boardPresent, boardRepairNeeded: current parser/guard results. A verbal-only response can parse successfully and still fail David's new product requirement.
- unresolvedHighlightIds: highlight targets absent from the supplied/preceding parsed items, including labels dropped by command limits. This is a structural warning, not complete scene verification.
- Human review: factual correctness, graded disclosure in both raw and filtered outputs, helpful teaching, repeated questioning, visual relevance, accurate labels/geometry, and agreement between every claimed visual and rendered state.

Choose only among candidates that meet the quality requirements. A one-case smoke test or three repeats per case cannot establish a reliable tail percentile. Report sample counts, failures, and per-case results; gather more repetitions before claiming p95. Then compare actual end-of-student-speech to useful audible reply, first corresponding rendered visual, and interruption behavior in an isolated runtime. Include routing, retrieval, STT, synthesis, buffering, and repair overhead. The harness deliberately measures only the deep teaching component.

Potential follow-up experiments include a faster substantive model, smaller repeated instruction blocks, less serial routing, and better synthesis streaming. Each needs evidence and a focused change. Keep the human PROMPT/PEDAGOGY and shared contracts frozen; do not restore the rejected fast-confirmation shortcut that misclassified misconceptions.

## Saved-session review, queued separately

When starting this review, identify David's actual Chrome tab and its origin. Preserve it and its browser storage. Inventory every saved session across topics, including parked desk conversations. Use read-only inspection and explicit local copies/exports for analysis. Do not resume conversations, activate the microphone, clear storage, reload away state, or call tutor providers just to inspect history.

For each session, record topic, student goal, what worked, first mismatch, repeated failure pattern, and evidence references. Review the transcript beside the board/chart/animation state, not the transcript alone. Use this case format:

```text
Session / origin / exported copy:
Topic and learner goal:
Turn timestamp or request ID:
What the student said:
What the tutor claimed:
What the saved/rendered board actually shows:
Latency evidence and its measurement boundary:
Confirmed mechanism, or competing hypotheses:
Expected behavior and a minimal regression case:
```

Existing exports contain captions, saved board state, and diagnostics, but not microphone recordings, word-aligned audio, every historical frame, or embedded PDF bytes. Missing evidence should remain unknown. Distinguish a model not generating an object, parser rejection, graded-content filtering, stale page/state, failed playback, and a semantically wrong but valid visual. A final board alone cannot prove exactly what was visible at an earlier sentence.

Keep private exports outside Git. Commit concise findings and synthetic regression cases instead. The review should produce an inventory covering every session, a prioritized issue list, and repeatable cases across subjects. It is recorded work to return to, not an unattended scheduled task.

## Current result

Source audit, capability screening, offline checks, and eleven live synthetic pilot requests completed. See the linked result report for timings, provider differences, costs, and failures. Opus and Astra are promising for further evaluation, not selected replacements. The all-turn board policy is not yet implemented. No private session has been inspected or sent to a provider, no acoustic test has run, and no runtime default has changed.
