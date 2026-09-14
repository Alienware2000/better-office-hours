# Strong-model compatibility and latency pilot

September 14, 2026. Eleven live synthetic requests after David supplied an OpenRouter key and asked for a quality-first comparison. No private sessions, images, TTS, or live tutor changes. No model selected.

## Method

One synthetic astronomy explanation per model/configuration, using the actual teaching prompt and concept_lesson schema. All request message hashes were identical across models for this case. First run: the current Grok low-effort/2,400-token controls, then flagship alternatives at default effort with an 8,000-token ceiling and temperature omitted. Second run: all five OpenRouter candidates at low effort, 8,000 tokens, temperature omitted. Two benchmark subprocesses ran concurrently at most. This is a compatibility pilot, not a statistically controlled model ranking.

Reports preserve prompt hashes, reported provider, usage, raw synthetic response, parsed speech/board, source HEAD and dirty status. The starting source commit was 0193c9a with the benchmark option changes uncommitted; those changes are committed with this report. The pipeline uses provider defaults when temperature is omitted, requires parameter support, disables fallbacks and SDK retries, and aborts after 60 seconds. Default effort differs across models. Providers were not pinned; Opus changed from Amazon Bedrock in the first run to Azure in the second. Cache behavior also differs. Do not attribute every timing change to effort.

Raw evidence is in the ignored local directories `.data/evaluation/quality-pilot-20260914-083503/` and `.data/evaluation/quality-low-effort-20260914-083836/`. These are machine-local artifacts, not tracked files or guaranteed to exist in another checkout. No credential is in these reports.

## First run

Times are seconds from the deep model request. Speech ready means a complete app-parseable spoken segment, potentially an introduction. Board ready means a structurally accepted visual. Neither means audible or rendered playback.

| Route/model | Effort / ceiling | Speech ready | Board ready | Complete | Result |
| --- | --- | ---: | ---: | ---: | --- |
| Direct Grok 4.6 | low / 2,400 | 18.758 | 20.144 | 22.159 | Parsed |
| OpenRouter Grok 4.6 | low / 2,400 | 20.097 | 22.850 | 25.668 | Parsed |
| GPT-6 Astra | default / 8,000 | 21.997 | 21.999 | 28.405 | Parsed |
| Claude Opus 5 | default / 8,000 | unavailable | unavailable | 45.182 | Fenced JSON rejected |
| Claude Fable 5.1 | default / 8,000 | 32.799 | 32.801 | 40.539 | Parsed; later focus target missing |
| Gemini 3.1 Pro preview | default / 8,000 | unavailable | unavailable | 32.683 | Empty object; required fields absent |

## Second run

All through OpenRouter, low effort, 8,000-token ceiling, temperature omitted.

| Model | Reported provider | Speech ready | Board ready | Complete | Result |
| --- | --- | ---: | ---: | ---: | --- |
| Claude Opus 5 | Azure | 2.389 | 6.743 | 11.379 | Parsed, 64 spoken words |
| GPT-6 Astra | OpenAI | 6.595 | 12.902 | 16.182 | Parsed, 62 spoken words |
| Claude Fable 5.1 | Anthropic | 7.590 | 7.591 | 15.458 | Parsed, 108 spoken words |
| Grok 4.6 | xAI | 22.460 | 24.017 | 26.886 | Parsed, 53 spoken words |
| Gemini 3.1 Pro preview | Google | unavailable | unavailable | 12.471 | Empty object again |

The fastest observed valid speech segment came from Opus, but it did not have a valid board action until 6.743 seconds and a different provider served it than the failed first run. These individual samples justify further tests, not a winner, a percentile, an end-to-end latency claim, or proof of equivalent quality at low effort. All downstream voice stages would add time. Fable's second response exceeded the current 70-word guidance.

## Concrete findings

1. Stronger models have promising low-effort configurations. Opus and Astra warrant wider quality/reliability testing. Keeping a flagship model while tuning effort/provider/request construction is worth investigating before considering smaller models.
2. A catalog advertising structured output and require_parameters=true does not itself prove our integration will receive usable lessons. Opus's first response wrapped JSON in a Markdown fence. Gemini returned an empty JSON object twice. Neither exhausted the 8,000-token ceiling. Keep these failures visible. Stop repeating the unchanged Gemini request and investigate its schema/provider handling separately; do not declare the model unintelligent or weaken validation to hide the result.
3. Fable's first response generated seven DRAW strings in its second beat. The production conceptResponse parser keeps the first six. That dropped the text item abs-label; a later beat still emitted highlight for abs-label. This is a reproduced generator/parser mismatch that can remove something the tutor expects to be present. It is not a confirmed explanation of David's uninspected Chrome session.
4. The benchmark now reports unresolvedHighlightIds and includes an offline test for that seven-command/later-focus pattern. It does not change the app's six-command limit or repair behavior. Structural board presence can still pass while an individual reference is invalid.
5. Raw/spec review is not a rendered quality verdict. Some responses use line markers for absorption features; Astra produces a plotted dip curve. Actual layouts, labels, geometry, narration timing, scientific precision, and graded-work behavior need review across more subjects. This astronomy-only pilot contains no attempt to prove performance on graded assignments.

OpenRouter reported a total cost of $1.31251 across ten gateway requests, including failures. The separate direct xAI request is excluded from that sum. Usage and cost reporting are provider-sourced, not estimated savings.

## Next

Run a small repeated cross-subject evaluation of Opus and Astra with pinned/recorded providers, including the existing algebra misconception and missing-visual correction cases. Inspect synthetic rendered boards and raw vs filtered responses. Include Fable if it can meet concise-turn and visual-reference requirements. Investigate Gemini's schema incompatibility as a bounded separate probe before spending on more identical failures. Do not deploy or select a production model from this pilot.

The current tutor remains Grok 4.6. Latency, all-turn board coverage, private saved-session review, and actual microphone/audio validation remain open.
