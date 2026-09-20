# Voice-first foundation and server cleanup

September 20, 2026. Local candidate `10c0720`, localhost:3115. David requested voice-first entry, clearer affordances/state cues, coherent welcome/desk styling, and fewer running servers. [Foundation](../UI_FOUNDATION.md) and [product checklist](../PRODUCT_CHECKLIST.md) retain these decisions.

## Result and correction

Typing already defaults closed in new/resumed SessionDesk instances. The prior agent review left it open, creating the wrong first impression. Handoffs now explicitly leave voice entry visible. No new microphone or model behavior was introduced.

Shared paper/surface/navigation treatment, session drawer styling, clearer Back to start wording, and listening/thinking/speaking labels/activity hints were added. The orb remains plain. Keyboard focus and reduced-motion behavior remain explicit.

David then rejected the boxed welcome treatment as less premium than the earlier version. Removed start-button fill/icon, secondary/action borders, arrow suffixes, and idle instruction. David further clarified that Tap to speak must be a plain caption: removed its button semantics/click handler so the orb is the sole start action. Retained the restrained welcome hierarchy and active-state cues. This correction is authoritative; do not repeat the all-buttons-in-boxes approach.

## Checks and limits

TypeScript, focused ESLint, and diff checks pass. Desktop entry and sessions drawer were inspected. An ignored snapshot-only `/interaction-check` fixture rendered ready/listening/thinking/speaking using actual Orb/ResponseStatus components without provider, microphone or audio calls. That fixture is not product behavior or an acoustic test and is absent from the final refreshed snapshot. Physical iPad/acoustic review and final narrow-device review remain pending. Earlier composer tests covered multiline entry, retention, and disabled empty send.

## Servers and preservation

Stopped only the verified BOH listeners on 3107–3113, using SIGTERM after inspecting cwd. Their snapshot/storage directories and browser origins remain preserved. Evidence: ignored `.data/evaluation/input-design/server-cleanup.json`. Kept 3114 for David's existing session and 3115 for review. Only the empty agent test draft on 3115 was restarted/reloaded during iteration. No student export, PDF, save, or production resource was deleted.

Final browser check: exactly one Tap to speak button (the orb), plain text caption, and Type a message collapsed. Source `10c0720`; manifest marks dirty because documentation was in progress, while implementation was committed. Runtime `.data/voice-trial-3115/run-1789893786823`. Final typecheck/lint pass. Two listeners remain: 3114 and 3115.

Welcome copy updated to “What do you want to work on?” in `9e0e00b`; 3115 runs that clean snapshot. On post-reload inspection, 3115 showed a saved homework conversation, so entry was not forced for a screenshot. Preserve this origin as live from now on. Copy change checked in source/diff; no additional provider calls or voice tests.
