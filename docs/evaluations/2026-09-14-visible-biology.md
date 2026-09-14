# First visible biology comparison

September 14, 2026. Two paid synthetic requests started through the review page. Same captured input/schema, low effort, 8,000 tokens, omitted temperature, sequential Opus then Astra, recorded rather than pinned providers. Raw reports are private under `.data/evaluation/review-run-80edd0cc-78b9-48e8-a507-f6606ae2ef78/`. The human review is still pending.

| Model / returned provider | Speech text ready | Board data ready | Complete | Words | Reported cost |
| --- | ---: | ---: | ---: | ---: | ---: |
| Claude Opus 5 / Anthropic | 2.915 s | 6.483 s | 15.570 s | 85 | $0.117160 |
| GPT-6 Astra / OpenAI | 9.516 s | 13.826 s | 16.949 s | 63 | $0.152015 |

Total reported usage: $0.269175. Both parsed, with five and four progress snapshots respectively. These are two samples, not a ranking or reliable tail latency estimate. Clocks exclude audio and full voice-loop overhead; local parsing/review-server work is included. No additional requests were made to improve an unfavorable result.

Opus exceeds the current under-70-word guidance. Its generated membrane and concentration labels are static DRAW items, while its animation introduces new molecule IDs m1/m2/m3. In the current store's loadAnimation rule, an animation without shared scene/object IDs starts a new page when existing non-topic work is present. The reconstruction therefore places the membrane on page 1 and the moving molecules on page 2. This is visible in the review page and explains why syntactically valid geometry is insufficient for speech/visual agreement. It is not evidence about David's still-uninspected saved Chrome session or exact audio playback.

Astra generates a single-page static diagram. Neither response has received David's quality rating. Review the generated labels, membrane placement, movement, spoken explanations, and whether the questions help. No runtime fix or model switch was made. The next action is human comparison, followed by controlled cross-subject repetitions and an isolated voice trial.
