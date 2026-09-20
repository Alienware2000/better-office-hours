# Optional typing and independent mic mute

David explicitly requested typed tutor input with the existing voiceboard capabilities and a mic-only mute that does not interrupt inference or narration. This supersedes the older voice-only restriction; frozen teaching prompts/types remain unchanged.

## Behavior

Type instead opens a compact composer on the existing desk and mutes input without stopping output. Typed messages bypass microphone permission, capture, and STT; they use the same runTurn, history, context, graded-work guardrails, narration queue, board updates, and saved transcript. Deliberately typed bracketed text is not treated as a transcription noise marker. Speech-end latency is not fabricated for a typed message.

Typing retains audible tutor output and captions. This is not silent playback mode. Drafts may be edited during a response; Send waits until the response completes or the user explicitly stops it. Enter submits, Shift+Enter adds a line, composition Enter does not submit. Drafts survive hiding the composer/layout changes but are not persisted across sessions/reloads.

Mute mic only disables capture and discards an unfinished local recording. Submitted transcription, model inference, queued narration, and board playback continue. Mute stays active across completed turns until Turn mic on or a deliberate microphone-start action. Unmuting during an existing response does not open capture until completion. Stop/Interrupt and Escape remain explicit output cancellation. Session/visibility suspension still cancels as before.

## Evidence and limits

Lifecycle regressions verify typed requests without getUserMedia/STT, shared board/narration/transcript, deliberate bracketed content, mute during generation and audio, persistence across turn completion, unmute, and discarded unfinished recordings. Existing voice/diagram/disclosure checks remain required. No provider or hardware calls are needed for these tests.

Real acoustic/iPad review and silent-output controls are outside this slice. Existing 3111/3112 sessions and PDFs are preserved. No deployment or production change.
