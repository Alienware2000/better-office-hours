# Hussein's lane handoff

David owns voice, workspace, and whiteboard. Hussein owns context, recap, and shell. This handoff describes the current baseline and the first reviewable slices; it does not authorize replacing the working desk or starting every roadmap feature.

## Start from main, work through PRs

Read STATUS, DESIGN, ARCHITECTURE, PROMPT, PEDAGOGY where relevant, DEMO, NOTES, then this file. Create `lane/context`, `lane/recap`, or `lane/shell` from the latest `origin/main`. Do not start from the old scaffold or an old lane/voice checkout. Use separate checkouts if working on multiple lanes at once.

Commit and push the lane branch, then open a PR to `main`. David reviews and merges Hussein's PRs. Agents must not merge their own PRs or push directly to main without David explicitly asking. A pending mic or iPad review of David's desk does not block Hussein's first slices below. Stop at the boundary of the selected slice and report its remaining integration needs.

Every PR must state the problem, changed behavior, affected contracts, setup/migrations, validation, and any missing integration. Update only the relevant lane's notes and STATUS entries; preserve other agents' status. No automatic code-author attribution in commits or docs.

## What exists today

| Area | Actual baseline | Integration rule |
|---|---|---|
| Entry and desk | `app/page.tsx` renders `app/(session)/voice/VoiceSession.tsx`; one adaptive desk for homework, concepts, and other requests | Reuse this composition. Do not rebuild the orb, captions, or mode switching in a second shell. |
| Voice | Custom ElevenLabs STT/TTS loop in `useVoiceLoop.ts`, browser calls `/api/agent/llm` | The conversational SDK is not installed. Keep the fast spoken model, speech queue, interruption, and tab ownership. |
| Visuals | PDF.js with freehand ink and pointer; custom SVG DRAW/ANIM board | tldraw is not installed. Do not migrate renderers or insert projectile scenes into model behavior. |
| Live context | Current PDF JPEG and text, current board JPEG, conversation, allowlisted events | `lib/pdf/live-page.ts` and `lib/whiteboard/live-board.ts` are local runtime adapters, not database/session contracts. Preserve `documentKind: notes`. |
| Uploads | `/api/pset/upload` and `/api/pset/[id]/file`; files in ignored `.data/psets` | Local prototype storage, not durable or user-isolated production storage. Do not claim serverless deployment persistence. |
| Course context | Types in `lib/types.ts`; empty runtime course context; `grokbot/TASK.md` is a future collector specification | No ingestion/retrieval implementation, database schema, Canvas connection, or loaded course pack. Do not invent classes or lecture citations. |
| Recap | Shared `Session`, `Turn`, `Recap` types and RECAP tag recognition | No close-flow handler, recap API, persistence, or card is wired. Tag recognition is not a finished feature. |
| Identity | No NextAuth/Supabase packages or auth integration | The current display name is prototype context, not authenticated identity. Do not treat a client-supplied user ID as authorization. |

## Context: first PR

Own `lib/context/*`, `app/api/ingest/*`, `app/api/retrieve/*`, and `grokbot/*`. Start with a testable ingestion/chunking and retrieval module using the existing `CoursePack`, `CourseDocument`, and `Chunk` types and explicit input records. A small synthetic fixture is appropriate for tests, never live course context. Preserve document kind, title, page, and solution flags through chunking.

Acceptance: relevant chunks can be returned for a supplied course; student-visible results exclude solution text; hidden reference access is explicit and server-only; empty or missing course data stays empty; tests cover cross-course filtering and solution separation. Do not put solution text, embeddings, or credentials into client props or logs. Do not connect this module to the live voice route by silently editing David's lane.

The initial `lib/db/schema.sql` does not exist. A context PR may include a proposed initial schema as a documented shared-file exception, with course/user ownership and access policies. Do not apply migrations to a shared/live database as part of preparing the PR. Concrete ingest/retrieve request and response formats, embeddings provider/dimensions, authenticated identity, and storage ownership require agreement in the PR before live integration. Do not invent a competing set of shared types.

Canvas/Grok Bot is the later source that makes the tutor already know a student's classes. It is not an attachment tab or a prerequisite for this first module. Do not start account login, scraping, bot operation, or collector deployment until David assigns that integration. Manual notes PDFs are already supported and stay usable independently.

## Recap: first PR

Own `components/recap/*`, `lib/session/*`, and `app/api/session/*`. Start with a recap card consuming the existing `Recap` type plus validation/serialization utilities and a persistence interface proposal. Keep the card visually consistent with the cream desk. Use synthetic completed recaps in tests; do not hardcode a successful demo outcome or fabricate a review citation in the live product.

Acceptance: display the sticking point, what changed, and a specific review reference when real reference data exists. Handle missing context honestly. No answer key or graded final answer appears in a card. Document how save/load will be scoped to an authenticated user and course, and how retrying a save avoids duplicates.

The student must summarize first, followed by a spoken recap and card. Implementing this flow needs coordination with David in `useVoiceLoop.ts`, the tag parser, and the model runtime. The first isolated card PR must not add a text chat, an End lesson tutor-command menu, a second TTS queue, or an unauthenticated persistence endpoint. Do not rewrite PROMPT.md or PEDAGOGY.md. After David reviews the card and session identity/API proposal, implement persistence and wire the spoken close flow in a coordinated slice.

## Shell: first PR

Own `app/(auth)/*`, `app/layout.tsx`, `components/orb/*`, `components/transcript/*`, and README.md. The live orb and captions are currently in David's voice directory; the similarly named shell directories are not a request to replace them. Begin with an authentication/application-shell proposal and its isolated implementation around the existing desk, keeping the familiar layout and first-tap voice activation.

Acceptance: the existing desk still runs locally; missing auth configuration is reported honestly; sign-in/out and session identity behavior are documented and tested for the chosen auth setup; no fake enrolled courses, judge credentials, or preloaded course materials are presented as real. Course switching must eventually supply actual course identity and isolate context, not merely change a label.

Auth route/helper additions such as `app/api/auth/*` and `lib/auth/*`, changes to `app/page.tsx`, package manifests, and new environment-variable names are shared integration touchpoints. List the proposed changes in the PR and coordinate before changing another lane's files. David reviews the auth/session contract before context and recap depend on it. Do not gate or redesign the working desk merely to match old scaffold text.

## Contracts and current risks

`lib/types.ts` remains the shared contract. If a contract cannot express the needed behavior, stop at that interface, describe the proposed change in the PR, and coordinate with David. Update ARCHITECTURE and the type in the same reviewed change. Package manifests, root layout/entry, environment names, and database schema are shared files even when one lane prepares the first version.

The LLM prototype uses module-level live-page/live-board adapters, and local uploads have no production user isolation. These are known limitations to resolve with session/auth/storage integration, not permission to deploy the prototype as a secure multi-user service. Credentials remain server-only. Never commit `.env.local`, `CLAUDE.md`, uploaded PDFs, or local harness files. `.env.example` contains names only.

## Checks and review

Run `npm ci`, `npm run build`, `npx tsc --noEmit`, `node scripts/check-workspace.mjs`, and `node scripts/check-anim.mjs --unit`. Add focused tests for the lane's new behavior and lint its changed files. Full repo lint currently has existing ref-access failures; report the baseline and do not disable rules to conceal new errors.

Live checks (`check-board.mjs`, `check-anim.mjs`, `check-turns.mjs`, `check-lanes.mjs`) require the dev server and real API keys and can consume API credits. Model output is variable. Hardware checks still include speech-to-desk entry, interruption/cadence, marked-page reactions, and iPad/Apple Pencil feel. Do not claim those passed from unit tests.
