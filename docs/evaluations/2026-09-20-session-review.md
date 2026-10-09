# Saved-session review

September 20, 2026. David requested a study of the saved sessions alongside consolidation. This committed report contains engineering findings only. The private title-by-title study guide is in ignored `.data/session-review/2026-09-20-review.md`; student transcripts and uploaded materials are not committed.

## Coverage and limits

Read all 33 session transcripts found in the checked histories: 21 in Chrome's already-loaded public-site tab, eight in the in-app browser on 3109, one on 3110, two on 3107, and one on 3108. Chrome's separate 3109 history was empty. This is a complete transcript pass over those inventories, not a claim to have found every browser profile, closed origin, or computer. Records can represent repeated attempts at the same lesson.

No tutor/provider request was started. Existing selections were restored; live snapshots, servers, and saved data were preserved. Reading the already-loaded public tab did not lift the Vercel pause. Generic page export was unsupported; no restorable backup was verified. Raw transcripts remain in browser storage. The study guide is not a session backup.

Transcripts show recorded text, not word-aligned acoustic completion. Historical model/prompt/renderer versions are not consistently attached. All diagrams and animation moments have not been replayed. Visual claims below rely on supplied screenshots or are labeled as learner-reported disagreements. Do not use these sessions as a controlled model ranking, latency benchmark, or retention study.

## Findings and proposed regression cases

| Pattern | Evidence type | Next behavior to verify |
| --- | --- | --- |
| Repeated questions after confusion | Transcripts across older and newer trials | After a learner says they lack a prerequisite, explain it or change representation before testing again. Do not count a leading answer as independent mastery. |
| Requested equations/symbol definitions deferred | Explicit learner requests and subsequent tutor turns | Give the requested general relationship and explain symbols in the current appropriate teaching move. Preserve graded-solution boundaries. |
| Tutor insists something is visible | Learner-reported equation/label disagreements | Treat a visibility complaint as a repair request, verify current rendered objects, and then highlight or repair. Replay frames to locate the actual cause. |
| Setup, forces, motion, and coordinates accumulate | Current supplied screenshots | Distinguish these views, preserve the mechanism, keep labels legible, and avoid layering unrelated explanations onto one scene. |
| Ordinary prose rendered as multicolored mathematics | Screenshot plus prior code audit in board-feedback report | Keep prose readable and neutrally colored; apply mathematical typesetting and color only where their meaning is explicit. |
| Background speech becomes learner turns | Transcripts including an explicit report of another speaker | Investigate detector/turn ownership using real acoustic evidence. Do not filter by language: multilingual tutoring is legitimate. |
| Language/page requests not acted upon | Explicit requests followed by mismatched responses | Follow the requested language and supported board action, or state an actual limitation. |
| Short responses still assume too much | Novice concept transcripts | Explain one complete idea with defined terms. Evaluate clarity separately from word count. Review simplifying assumptions for accuracy. |
| Lesson stops after setup | Short saved responses and prior user reports | Correlate accepted beats, validation failure, generation completion, audio start/end, and heard ending. A complete first sentence is not proof of a complete lesson. |

Positive cases show the value of responsive visualization: changing a motion illustration after confusion led the learner to articulate a distinction they had missed. Preserve that behavior. The current candidate also shows useful correction after mishearing and restraint around graded final answers. Neither assent nor tutor-authored notes prove learning.

## Priority and measurement

1. Retain speech completion/interruption checks and measure first useful audible response. No fresh real-provider benchmark was run in this audit.
2. Implement the already-selected prose/math and board composition slice against a fixed candidate. Use synthetic cases, with no topic-specific runtime templates. Compare a full turn and follow-up, not only the final frame.
3. Evaluate teaching repairs using confusion, equation requests, visibility complaints, and language requests. Human PROMPT/PEDAGOGY remain frozen; this report does not authorize editing shared contracts.
4. Validate background-speaker behavior on a real device before changing acoustic thresholds. Preserve deliberate language switching and barge-in.

For each retest record: synthetic case ID, exact revision/profile, input, first useful audible response, completion, narration/visual agreement, technical accuracy, clarity, cost where known, and the human judgment. Separate transcript, screenshot, acoustic evidence, and inference. No invented scores or percentages from this collection.

Jev and a broader board redesign remain deferred. See [consolidation](2026-09-20-consolidation.md) for the candidate and evidence boundaries, and [board feedback](2026-09-20-board-feedback.md) for the first bounded product change.
