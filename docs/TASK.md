# Active task

Updated: 2026-09-20
State: in_progress
Branch: lane/post-hackathon-local
Base: 3b3dceb85eed13bb9a0668423f18ba962365927e

## Objective

Establish a warm, modern voice-first interaction foundation: recognizable buttons/navigation, consistent welcome/desk surfaces, explicit listening/thinking/speaking states, optional typing closed initially. David also requested server cleanup and preservation of the broader product checklist.

## Scope and constraints

Local voice/workspace UI only. Keep plain orb, voice behavior, PDFs and saved sessions. No deployment or shared/frozen-contract change. Groundtrack unavailable. Do not reload the live 3114 session.

## Progress

Verified and stopped seven old BOH listeners (3107–3113), retaining snapshots/storage/browser saves. 3114 kept running. Button surfaces, shared colors, status labels/hints and activity indicators implemented. Typing already defaults closed; previous review tab was deliberately left open, so future handoffs must show voice first.

## Decisions

Voice remains primary. Use calm surfaces, bounded motion, consistent focus/hit targets, and visible state labels without relying on color. Typing/mute remain independent of inference. Keep diagnostics in disclosure. No model/board behavior change in this slice.

## Validation

Typecheck passed; focused lint and rendered state/desktop/mobile checks in progress. No provider calls.

## Next action

Verify isolated 3115 preview, record UI foundation and product checklist, checkpoint. Preserve current 3114 and stopped origins' data.

## Blockers

Saved sessions are not verified backups. Human acoustic/iPad review and diagram quality work remain open.
