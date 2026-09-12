# Architecture and Interface Contracts

Read DESIGN.md first. This doc defines the system shape and the contracts between lanes so that agents on two machines can build in parallel without talking.

## Implementation baseline

The diagram and interfaces below include target integrations. Read LANES.md for an inventory of actual files and first PR boundaries. Currently the browser owns the custom voice loop and calls the LLM route; STT and TTS are separate ElevenLabs API calls. The whiteboard is custom SVG. Auth, Supabase, ingest/retrieve endpoints, persistent session/recap endpoints, and the spoken recap flow are not implemented. Shared types describe their target data, not working services.

Keep the existing adaptive desk in `app/(session)/voice/VoiceSession.tsx`. All three entry choices use the same shell; PDF and Whiteboard are views within it. Client speech intent switches the desk before waiting for model tags. Reference notes use optional `documentKind: notes` in the local LivePage adapter and do not replace the homework PDF. The working orb and captions remain in the voice lane until a coordinated integration explicitly moves them.

Hussein can start the isolated context, recap, and shell slices in LANES.md from main. David reviews their PRs before merging. Root entry/layout, package files, environment names, and schema are shared touchpoints; do not overwrite another lane's integration to make an isolated slice run.

## Browser-local session recovery

David's explicitly requested local recovery slice is owned by voice/workspace, separate from Hussein's unmerged recap/session endpoint proposal. `app/(session)/voice/SessionLibrary.tsx` owns selection and serial autosaves; `saved-sessions.ts` defines a versioned local record in IndexedDB (`better-office-hours-sessions`, version 1). Each session row is written independently with an atomic expected-updatedAt check to reject stale-tab overwrites. Active selection is a separate metadata transaction. Storage errors leave the current desk available for export. `VoiceSession` captures after transcript/layout/document changes and throttles board writes at 500ms, with best-effort hide/pagehide flush. An abrupt kill can still lose the latest unsaved update.

`VoiceArchive` in `useVoiceLoop.ts` holds current and parked history/captions/BoardState, cloned on capture and restored with playback paused. `lib/pdf/view-state.ts` holds PDF ink history, current page, and zoom per uploaded document ID; `PdfViewer` publishes changes to the voice-owned record. Page aspect ratios are reserved before image decoding and initial page scrolling waits for measured layout. The voice hook's new-session binding lets Remove preserve the old desk before creating a fresh one. No shared contract or recap/auth endpoint is changed.

Text/JSON export includes unique session identity and caption timestamps. JSON additionally carries state and local request IDs, first-audio times, board-playback records, and recoverable errors. The model only receives the resumed desk's context, not the whole library. PDF data is an existing server-file reference; no PDF bytes, microphone audio, provider credentials, or hidden solutions are copied into the record. This is per-origin browser storage, not cloud backup, account isolation, cross-session learner memory, or a complete analytics pipeline. Coordinate those features with context/recap/shell after their PR reviews.

## Student turn ownership

Current capture uses the existing local detector's mono 16kHz PCM frames, a bounded 320ms pre-roll, and WAV encoding. Only completed, confirmed utterance fragments go to STT; pause/discard clears the local buffer. STT may receive up to 24 vocabulary terms from recent tutor/page text, excluding numeric answers. Continued fragments share ordered cancellation-scoped transcription state. The quiet endpoint is 1.5s. The older MediaRecorder startup/finalization path is removed.

The local LiveBoard adapter extends the frozen BoardSnapshot contract with revision, tutor item IDs/text and entering/visible status, student stroke count, and an optional student-only JPEG. The combined image is not a student submission. Current item IDs let the model revise its actual notes rather than relying on spoken history. A changed reserved `topic` heading archives the current page and begins a new tutor note; DRAW clear removes only tutor content. Student ink survives on its original page through topic changes and remains on the working page through clear. Session reset still resets the whole board. These extensions are internal to the voice/whiteboard lanes; lib/types.ts remains frozen.

Board UI separates tutor and student SVG layers and labels both authors. Blue is the initial student color. Student-only selection, movement, recoloring, deletion, undo, and redo operate on local BoardState; its past/future stacks are bounded to 30 edits and restored with each parked desk. They never restore or modify tutor groups. `useBoardInk` keeps gesture previews outside the store until pointer release. Both ink surfaces use coalesced samples, frame-batched previews, shared quadratic paths, and segment-distance hit testing with measured pixel radii. PDF history is edited in the viewer and persisted in the selected local session. Earlier board pages are read-only local scrollback; only the current working page is edited or sent as the main board image. Local LiveBoard also includes earlier topic summaries and whether the student scrolled back. New working pages automatically resume following. useBoardFollow tracks the programmatic scroll destination so intermediate smooth-scroll events cannot disable it; new writing is revealed relative to that destination. Manual input can interrupt scrolling, same-page additions respect history browsing, and Latest returns to the working page. Group reveal timing follows grapheme count and wraps sequentially, while the complete SVG text layout stays fixed. These are local implementation types, not additions to the frozen shared contracts.

Attachments and ink update live context without starting speech. Readiness callbacks remain for desk compatibility, but only a student utterance or initial greeting starts spoken interaction. The current voice loop waits about 1.5s of non-speech to submit recorded speech, or accepts an orb tap to finish. The orb never cancels a turn; the separate Pause control and Escape stop voice without leaving the desk. During playback, browser echo cancellation plus sustained Silero speech probability can interrupt. This needs real-device validation and is not semantic endpoint detection or speaker identification. Background vocals can still be classified as speech.

The speech queue prepares upcoming TTS audio and plays one chunk at a time. Captions and assistant history advance at sentence start, not model token arrival. There is no silent client word/sentence cap. Completed visual tags are queued after their preceding words. Short symbolic equations use existing DRAW text, with bounded line length and shared SVG/snapshot sizing; no new shared contract is required. The speech-only normalizer expands common SI notation while the board retains written symbols. A partially interrupted sentence is not word-aligned.

Speech detection uses pinned `@ricky0123/vad-web` 0.0.30 with Silero v5 and ONNX Runtime WASM, on the client. This voice repair changes the shared package manifests and adds predev/prebuild asset preparation. `scripts/prepare-voice-assets.mjs` copies the installed model, worklet, and WASM assets to ignored `public/voice-assets`; no runtime CDN or microphone audio leaves the browser for detection. The STT service still receives completed recordings. Initialize and retry failures are visible. Recording finalization, STT, TTS, and model generation have deadlines, with late completions ignored.

At spoken desk entry, live board context falls back to current store availability/provenance until React mounts the image provider. Concept and homework desks use a local structured routing decision on the fast model. Greetings/brief definitions remain direct; substantive explanations and attempted work use the existing reasoning handoff. The reasoning response declares a teaching move and up to three narrated beats. The server translates complete beats incrementally into the existing TEACH/DRAW/ANIM/POINT/HIGHLIGHT stream, so the client keeps its playback ordering, disclosure guard, PDF anchor resolution, authorship, and cancellation. Diagram content is generated per turn; there is no topic-to-scene mapping. Supplemental notes and homework setups share this transport and retain the existing graded-work disclosure limits. These are internal voice-lane types, not changes to lib/types.ts.

Routing uses a separate compact instruction, recent transcript, document text, and board ownership summary, rather than loading the full teaching/tool prompt and images. Its categories distinguish unresolved topic selection and logistics from selected-but-stuck orientation, lessons, and checking work. Desk handoffs emit silent THINK metadata; unverified routing speech is discarded instead of speaking a repetitive waiting cue. Work checks still use the existing reasoning lane; the rejected direct-confirmation and extra-verification experiments are not enabled. The reasoning lane retains the full human prompt, source context, images, and teaching constraints. Declared orient/explain moves cannot use visual=none to bypass drawing: they normalize to diagram and qualify for the existing bounded recovery if no valid visual arrives. Brief elicit/consolidate turns can remain verbal. Highlighting an existing current-page tutor object satisfies visual use without replacing the diagram; an unknown highlight ID does not. No shared contract or topic-trigger change.

Completed structured introductions/beats preserve an explicit local SSE speech boundary, so parser whitespace trimming cannot strand the last complete sentence until the next expensive visual arrives. Narrated visual commands release on the audio playing event, after synthesis and browser buffering, with playback-epoch cancellation. The deep stream has a 30s first-progress deadline, a 20s idle deadline after progress, and a 60s overall ceiling; ordinary services retain their existing fixed deadlines. Development request IDs correlate generated visual counts, first-speech/first-visual timing, total speech words, and first audible playback with applied page revisions. These traces contain no transcript or audio. LiveBoard also carries a validated current animation spec, time, and playing state. Structured beats accept existing resume/focus controls. Reusing a scene ID revises its current page; reusing static geometry IDs replaces those objects with their animated forms while preserving the backdrop, labels, and student ink. A separate scene starts a new page. New equation placement also reserves static geometry and a bounded cached sampling of animation movement. Attached vector sources retain signed relative endpoints until composition; clipping before attachment would flatten upward vectors. These remain local voice/whiteboard contracts.

## 1. System shape

```
Browser (Next.js app)
  ├─ Workspace pane: PDF.js + overlay (pointer, highlights, student annotations)
  ├─ Agent pane: Orb + captions + SVG whiteboard
  └─ Voice client: Custom ElevenLabs STT/TTS loop (orb interruption)
            │
            ▼
Next.js API routes
  ├─ /api/agent/llm        custom LLM endpoint the ElevenLabs agent calls each turn
  │                         builds context (retrieval + current page image + whiteboard state)
  │                         calls Grok, parses tool tags, returns speech text + UI commands
  ├─ /api/ingest           receives course pack files from the Grok Bot or fallbacks
  ├─ /api/pset/upload      pset PDF upload, page rasterization, text extraction
  ├─ /api/session/*        session state, transcript, recap
  └─ /api/retrieve         chunk retrieval (pgvector)
            │
            ▼
Supabase (Postgres + pgvector + storage)
Grok API (api.x.ai/v1, grok-4.6)
Grok Bot (runs outside the app, posts to /api/ingest)
```

## 2. Lanes and ownership

Each lane is a branch off `main` named `lane/<name>`. Lanes touch only their own directories unless a contract change is agreed in this doc first.

| Lane | Owner | Directories |
|---|---|---|
| voice | David | `app/(session)/voice/*`, `app/api/agent/*`, `lib/agent/*` |
| workspace | David | `components/workspace/*`, `lib/pdf/*`, `app/api/pset/*` |
| whiteboard | David | `components/whiteboard/*`, `components/scenes/*`, `lib/whiteboard/*` |
| context | Hussein | `app/api/ingest/*`, `app/api/retrieve/*`, `lib/context/*`, `grokbot/*` |
| recap | Hussein | `app/api/session/*`, `lib/session/*`, `components/recap/*` |
| shell | Hussein | `app/(auth)/*`, `app/layout.tsx`, `components/orb/*`, `components/transcript/*`, `README.md` |

Shared: `lib/types.ts` (contracts below), `.env.example`, package manifests, root entry/layout, and database schema. The types are frozen pending coordination. `lib/db/schema.sql` does not exist yet; the context lane may propose its initial version in a PR as described in LANES.md.

## 3. Contracts

All of these are TypeScript types in `lib/types.ts`. Change them only by editing this doc and the file in the same PR.

### 3.0 Student profile (context lane produces, shell and voice lanes read)

```ts
type StudentProfile = {
  userId: string;
  name: string;
  email: string;
  term: string;                 // "Fall 2026"
  courses: EnrolledCourse[];
  source: "grokbot" | "canvas_api" | "manual";
  refreshedAt: string;
};

type EnrolledCourse = {
  courseId: string;             // matches CoursePack.courseId
  courseName: string;
  code: string;                 // "PHYS 180"
  instructor?: string;
  meetingTimes?: string;
  assignments: Assignment[];
  packStatus: "none" | "collecting" | "ready";
};

type Assignment = {
  id: string;
  title: string;                // "Problem Set 3"
  dueAt?: string;
  kind: "pset" | "exam" | "reading" | "other";
  fileStoragePath?: string;     // set if the bot collected the file
};
```

Ingest: `POST /api/ingest/profile` with the same bearer token, JSON body of `StudentProfile` minus `userId` (resolved from the email). The Grok Bot posts this first, then the course packs.

### 3.1 Course pack (context lane produces, everyone reads)

```ts
type CoursePack = {
  courseId: string;            // "phys180-fall2024"
  courseName: string;          // "PHYS 180: University Physics"
  term: string;
  source: "grokbot" | "canvas_api" | "manual";
  documents: CourseDocument[];
  policies: {                  // extracted by Grok from the syllabus at ingest time
    collaboration: string;
    aiUse: string;
    late: string;
  };
};

type CourseDocument = {
  id: string;
  kind: "syllabus" | "lecture" | "pset" | "solution" | "exam_review" | "other";
  title: string;               // "Lecture 4: Projectile Motion"
  order?: number;              // lecture or pset number
  storagePath: string;
  chunks: Chunk[];
};

type Chunk = {
  id: string;
  documentId: string;
  text: string;
  page?: number;
  embedding: number[];
  isSolution: boolean;         // solution chunks are never surfaced to the student
};
```

Ingest endpoint: `POST /api/ingest` with `Authorization: Bearer <INGEST_TOKEN>`, multipart form with `courseId`, `courseName`, `term`, `source`, and files with a `kind` hint in the field name (`lecture_04.pdf`, `syllabus.pdf`, `pset_03.pdf`, `solution_03.pdf`). Response `{ ok: true, documentIds: string[] }`.

### 3.2 Pset and workspace (workspace lane)

```ts
type Pset = {
  id: string;
  courseId: string;
  title: string;
  dueAt?: string;
  pages: PsetPage[];
  fullText: string;
};

type PsetPage = {
  index: number;               // 0-based
  width: number;               // in PDF points
  height: number;
  imageUrl: string;            // rasterized PNG for vision calls
  text: string;
  questionRegions: { label: string; bbox: BBox }[]; // "1", "2a", detected at upload
};

type BBox = { x: number; y: number; w: number; h: number }; // normalized 0..1 relative to page
```

The overlay renders over the PDF page and accepts the pointer/highlight shapes from AgentTurn (3.4). Current student freehand strokes stay in the viewer and are composited into the page JPEG. `StudentAnnotation` below remains a shared target type, not the current freehand transport; do not replace the working ink implementation to force it through this type:

```ts
type StudentAnnotation = {
  page: number;
  bbox: BBox;
  kind: "circle" | "underline" | "scribble";
  at: string;                  // ISO time
};
```

### 3.3 Whiteboard (whiteboard lane)

Optional local DRAW `diagram` metadata is defined in `lib/whiteboard/diagram-command.ts`, separate from the frozen shared types. `contact: {with, t, side}` binds a circle to a straight line's surface at a fractional point; `attach: {to, anchor, offset?}` translates a line/arrow start to a circle center or line/arrow center/start/end, preserving its vector. `fill`, `weight`, `surface`, and `labelSide` control bounded rendering styles. The parser normalizes observed flat spellings. ShapeGroup retains a canonical source command and unresolved flag. The store resolves a dependency graph on each DRAW batch before annotation layout; missing/cyclic/out-of-bounds references produce no geometry, and references are scoped to the current page. No label-based physical inference or new animation schema. Local TutorItem includes a bounded source-layout string and unresolved status. SVG and snapshots use common fill/arrowhead/width/alpha semantics. Initial marks reveal; settled geometry revisions apply atomically with dependents.

Local diagram.interpolation selects smooth curves or straight-edged contours. A closed filled curve also exposes a bounding-box center for static arrow/line attachment. Reusing that curve ID in an ANIM dot retains a bounded BodyAppearance (normalized points, original radius, interpolation, fill, color, weight) in the local animation state. Missing r keeps the original scale; at is the bounding-box center. Rendered vertices translate rigidly without inferred rotation. Appearance is validated on animation input and retained through LiveBoard and same-scene revisions; unrelated archived pages cannot supply it. The existing SVG/snapshot geometry path handles both representations. Shared AnimShape and DrawCommand remain unchanged.

Local diagram.component={of,axis} on an arrow projects another vector onto x or y with the same origin. ANIM arrow diagram metadata accepts attach, component, and labelSide; references must target appropriate shapes in the same spec and cannot cycle. Reused static arrow relationships are inherited only when their referenced objects occur in the animation. The renderer resolves these constraints before layout; this guarantees declared geometric relationships, not physical correctness. Path drawn is strictly normalized 0..1. Follow tracks that progress, so a constant drawn value intentionally holds the attached object still.

Animated annotations use bounded whole-motion sampling and cache one offset per label for a scene/backdrop/ink combination. Collision scoring includes camera transforms, static notes, geometry, and student ink. Displaced labels get quiet leaders; no per-frame side switching. This is a layout heuristic, not a universal overlap guarantee. Compact symbols such as v_x and theta use diagram-sized MathJax; full equations retain writing layout. Diagram label glyphs preserve the geometry's color. Both SVG and snapshots consume the same resolved drawing.

The existing DRAW text string accepts plain notation or LaTeX; no shared field was added. `math-layout.ts` imports MathJax Base/AMS plus the TeX font directly and typesets synchronously in the app. Only bounded path/rectangle primitives and affine transforms are retained, with measured width/ascent/descent. Local Drawable mathDrawing metadata stores the result. BoardText renders those paths; snapshotBoard fills the same paths into canvas without asynchronous image decoding or external fonts. Existing non-LaTeX notes can resolve through the same renderer. Plain prose stays in the ordinary text renderer. Cache size, source length, and primitive count are bounded; unsupported input falls back to text. No custom macros, links, HTML, external package loading, or full document compilation. Package dependencies @mathjax/src and @mathjax/mathjax-tex-font are pinned to 4.1.3 as part of David's math-rendering request. The shared types below remain unchanged.

The tutor draws through a small command set that the whiteboard lane maps onto SVG geometry with animated stroke-in.

```ts
type DrawCommand =
  | { op: "clear" }
  | { op: "axes"; id: string; origin: Pt; xLabel?: string; yLabel?: string }
  | { op: "arrow"; id: string; from: Pt; to: Pt; label?: string; color?: Color }
  | { op: "line"; id: string; from: Pt; to: Pt; dashed?: boolean; color?: Color }
  | { op: "curve"; id: string; points: Pt[]; label?: string; color?: Color }   // trajectories
  | { op: "circle"; id: string; center: Pt; r: number; label?: string }
  | { op: "text"; id: string; at: Pt; text: string; size?: "s" | "m" }        // labels only, max 6 words
  | { op: "highlight"; id: string }                                            // pulse an existing shape
  | { op: "remove"; id: string };

type Pt = { x: number; y: number };   // normalized 0..1 of the board
type Color = "ink" | "accent" | "muted" | "warn";
```

Generated animation is a layer on the same board surface. The tutor composes it per turn; nothing is pre-scripted.

Tier 1, declarative spec (primary). Shapes with keyframed properties on a timeline. The whiteboard lane implements a small runtime that interpolates keyframes and exposes `play`, `pause`, `seek(t)`, and a scrubber.

```ts
type AnimationSpec = {
  id: string;
  duration: number;                       // seconds
  shapes: AnimShape[];
  camera?: { keyframes: Keyframe<{ x: number; y: number; zoom: number }>[] };
};

type AnimShape =
  | { kind: "arrow"; id: string; keyframes: Keyframe<{ from: Pt | Follow; to: Pt | Follow; opacity?: number; color?: Color }>[]; label?: string }
  | { kind: "dot";   id: string; keyframes: Keyframe<{ at: Pt | Follow; r?: number; opacity?: number }>[]; label?: string }
  | { kind: "path";  id: string; points: Pt[]; keyframes: Keyframe<{ drawn: number; opacity?: number }>[]; label?: string }   // drawn 0..1
  | { kind: "text";  id: string; text: string; keyframes: Keyframe<{ at: Pt; opacity?: number }>[] }
  | { kind: "axes";  id: string; origin: Pt; xLabel?: string; yLabel?: string; keyframes?: Keyframe<{ opacity?: number }>[] }
  | { kind: "bar";   id: string; keyframes: Keyframe<{ at: Pt; w: number; h: number; opacity?: number }>[]; label?: string };

type Keyframe<T> = { t: number; ease?: "linear" | "inOut" | "out" } & T;   // t in seconds
type Follow = { follow: { pathId: string; offset?: Pt } };                // ride along a path so the model need not compute every point
```

Tier 2, programmatic (future, not implemented; wait for an assigned checkpoint). The model emits a JS function body against a tiny API (`ctx.arrow`, `ctx.dot`, `ctx.path`, `ctx.text`, `ctx.slider(name, min, max)`, `ctx.onFrame(fn)`) that runs in a sandboxed iframe with no network. Timeout 50ms per frame; on error the board shows nothing and the tutor falls back to strokes.

```ts
type AnimationProgram = { id: string; source: string; sliders?: { name: string; min: number; max: number; value: number }[] };
```

Fallback fixture: `components/scenes/projectile.ts` is a hand-written scene used to test the runtime and as a demo-only fallback. It is not referenced by the prompt.

Playback pauses on barge-in and resumes on `[ANIM resume]`. The declarative runtime supports `focus` highlighting of a named shape while the tutor narrates.

Student drawing on the board emits:

```ts
type BoardSnapshot = {
  imageUrl: string;            // PNG of current board, sent to the model on the next turn
  studentShapesSince: string;  // ISO time of last snapshot; lets the model know the student drew
};
```

### 3.4 Agent turn (voice lane produces, workspace and whiteboard lanes consume)

Each model turn returns speech plus UI commands. Local stream metadata `[TEACH move=... visual=...]` precedes substantive output. `TeachingTurn` extends AgentTurn internally with an optional teaching choice; shared lib/types.ts is unchanged. The move is elicit, orient, hint, consolidate, or explain; visual is none, notes, diagram, or animation. The model selects these from conversation context, without a client keyword classifier or extra planning request. Elicit/orient (and absent, invalid, or late metadata) cannot reveal new symbolic relationships through DRAW text or diagram/animation labels. The filter is a bounded notation guard, not a proof of pedagogical or mathematical correctness. Metadata is stripped from speech. Hint counters are omitted unless actually available; runtime context asks the model to infer progress from conversation rather than receiving an invented zero each turn.

There is no automatic copying of speech into equations. If the selected visual is missing or not renderable, the client can request `visualRepair: true` once. Its last assistant message includes the chosen TEACH tag, and the parser inherits that original move so repair output cannot grant itself more disclosure. Only at most five renderable static DRAW commands are used; clear/remove, speech, navigation, and other actions are ignored. A static diagram is acceptable recovery for invalid animation. Cancellation uses the active playback epoch; initial speech proceeds while recovery runs, with a 6s timeout.

Static ShapeGroup metadata now stores geometry traces used only for annotation collision checks. Label layout preserves physical geometry, chooses nearby placements clear of shapes/labels/student ink when possible, and stores resolved font/position data for both SVG and snapshots. It retains labels using the least-crowded candidate when no clear position exists. Moving labels retain their attachment and smaller stable size; no per-frame label solver is used. Notes retain their larger hierarchy, with simple Unicode powers/subscripts and separate aligned given rows.

Inline tag grammar the model uses:

```
[TEACH move=elicit visual=none]  // local metadata, not a shared AgentTurn field
[POINT page=1 x=0.42 y=0.31 label="launch angle"]
[HIGHLIGHT page=1 anchor=3]  // measured text fragment in this request
[HIGHLIGHT page=1 x=0.40 y=0.28 w=0.20 h=0.06]
[BOARD open]
[DRAW {...DrawCommand JSON...}]
[ANIM {...AnimationSpec JSON...}]  |  [ANIM_PROGRAM {...AnimationProgram JSON...}]  |  [ANIM focus=id]  |  [ANIM resume]
[MODE concept]  |  [MODE pset]
[RECAP]         // signals the session close sequence
[THINK]         // hand this turn to the reasoning lane, see 3.5
```

Anchor IDs are indices of the supplied LivePage textRegions, scoped to that request and page. The voice queue resolves them to the existing highlight bbox; invalid or page-mismatched IDs produce no highlight. Coordinates remain available for figures without text anchors. Highlights advance with narration, and the PDF margin cue stays clear of text.

Parsed into:

```ts
type AgentTurn = {
  speech: string;                        // text with tags removed, sent to TTS
  pointer?: { page: number; x: number; y: number; label?: string };
  highlight?: { page: number; bbox: BBox };
  board?: { open?: boolean; commands: DrawCommand[]; animation?: AnimationSpec | AnimationProgram; animControl?: { focus?: string; resume?: boolean } };
  mode?: "pset" | "concept";
  recap?: boolean;
  think?: boolean;                       // the fast lane is deferring to the reasoning lane
};
```

Timing rule: tags are dispatched in the order they appear as the speech streams, so the pointer moves as the tutor says "look here" and strokes land as it names them.

### 3.5 LLM endpoint contract (voice lane)

`POST /api/agent/llm` currently receives requests from the custom browser loop and returns OpenAI-style streaming events. It builds runtime context and attaches live images. Retrieval and session loading below are the target integration sequence, not implemented services:

1. Loads session state (course, pset, current page, mode, hint rung per question, misconceptions seen).
2. Retrieves top chunks for the latest student utterance (`/api/retrieve`), excluding `isSolution` chunks from anything returned to the student while allowing them in a hidden "reference" block.
3. Attaches the current pset page image and the latest board snapshot as image inputs.
4. Calls Grok with PROMPT.md as the system prompt plus a per-turn context block.
5. Streams the reply; tags are passed through so the client parser can dispatch them.

Two lanes, one endpoint. `POST` takes `deep: boolean`.

- Fast lane, `deep` absent. A non-reasoning model, about 0.6s to the first word. Every turn starts here; logistics and brief definitions can speak directly, while substantive desk turns hand off silently.
- Reasoning lane, `deep: true`. `grok-4.6` at low reasoning effort, about 7s. Used when being wrong would cost the student: checking their working, diagnosing a misconception, choosing the next hint rung.

The fast lane decides. On concept/homework desks a reasoning handoff emits `[THINK]` with no speech. The client immediately issues the `deep: true` request; only actually spoken content reaches history. Legacy lobby handoffs can still contain a lead-in, and reasoning starts before waiting for that audio. Short checks target 15 to 30 words with optional questioning and no required drawing. New explanations retain narrated board beats and the disclosure guards. There is no client-side word cutoff or extra checking request. Latency measured against the real prompt: non-reasoning 0.5s, `grok-4.6` low effort 7.4s, `grok-4.6` default 26s. A reasoning model must never run the fast lane.

Per-turn context block shape:

```
<course>{courseName}, {term}</course>
<policies>{collaboration}; {aiUse}</policies>
<student>{name}; courses: {course codes}</student>
<pset>{title}, due {dueAt}, on page {page} of {pages}</pset>
<last_recap>{stuckOn}; {reviewNext}</last_recap>
<mode>{mode}</mode>
<hint_state>question={q} rung={0..4} attempts_since_last_hint={n}</hint_state>
<misconceptions_seen>{list}</misconceptions_seen>
<retrieved>{chunks with document titles}</retrieved>
<reference_do_not_reveal>{solution chunks}</reference_do_not_reveal>
<student_drew>{true|false}</student_drew>
<voice>{anti-repetition note, includes the tutor's own recent openings}</voice>
<when_to_think>{fast lane only: when to emit [THINK]}</when_to_think>
<deep_turn>{reasoning lane only: continue from the lead-in}</deep_turn>
<event>{a workspace event the tutor should react to unprompted, such as the pset finishing rendering}</event>
```

Events are sent by the client as an allowlisted `kind` (`lib/agent/events.ts`), never as prose, so the client cannot inject tutor instructions.

### 3.6 Session and recap (recap lane)

```ts
type Session = {
  id: string;
  userId: string;
  courseId: string;
  psetId?: string;
  mode: "pset" | "concept";
  startedAt: string;
  endedAt?: string;
  transcript: Turn[];
  hintState: Record<string, { rung: number; attempts: number }>;
  misconceptionsSeen: string[];
  stylePreset: "more_hints" | "balanced" | "fewer_hints";
  recap?: Recap;
};

type Turn = { role: "student" | "tutor"; text: string; at: string };

type Recap = {
  stuckOn: string;             // one sentence
  unlockedBy: string;          // one sentence
  reviewNext: { documentTitle: string; where: string };  // "Lecture 4", "slides 10 to 14"
  studentSummary: string;      // what the student said in their own words
  spokenText: string;          // what the tutor said aloud
};
```

Recap flow: model emits `[RECAP]`, the voice lane asks the student to summarize, the model produces the spoken recap and a JSON block, the recap lane stores it and renders the card. Next session, the LLM endpoint includes `lastRecap` in the context block so the orb can open with a retrieval check.

### 3.7 Intent and layout state (shell lane)

The app has three layout states: `orb_only` (after sign-in), `pset`, and `concept`. The orb-only state renders the orb, the greeting, and three chips ("Homework", "Explain a concept", "Something else"). A chip tap injects its label as a student utterance. Client-side `detectMode` chooses the desk immediately from student speech, including Something else; model MODE tags are a guarded fallback. Both modes have PDF and Whiteboard views in the same shell. State type:

```ts
type LayoutState = "orb_only" | "pset" | "concept";
```

### 3.8 Auth and test account (shell lane)

Planned: Google OAuth via NextAuth. No auth provider is installed yet. Allowlist `@yale.edu` plus a judge account `judge@betterofficehours.app` with password login enabled only for that account, preloaded with PHYS 180 and pset 3. Credentials in the README.

## 4. Environment

```
XAI_API_KEY=
ELEVENLABS_API_KEY=
ELEVENLABS_AGENT_ID=
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
INGEST_TOKEN=
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

`.env.example` is committed. Real keys are never committed. Vercel deploys `main`.

## 5. Latency budget per turn

- Student stops speaking to first tutor word: target 1.0s, hard ceiling 2.0s.
- ElevenLabs turn detection: ~300ms. Retrieval: ~150ms. Grok first token with one page image and one board image: ~600ms. TTS first byte: ~200ms.
- Send page images at 1024px wide max. Send the board snapshot only when `studentShapesSince` is newer than the last turn.
- Pre-warm: on session start, run one retrieval and one Grok call for the pset overview so the greeting is instant.

## 6. Failure modes and fallbacks

- ElevenLabs custom LLM will not accept images in the format we need: switch to ElevenLabs STT plus TTS around our own loop (`lib/agent/loop.ts`). Same contracts.
- Grok Bot cannot get through Duo: use the Canvas token fallback (`scripts/canvas-pull.ts`), then manual upload.
- Pointer coordinates drift: fall back to highlighting the whole detected question region.
- tldraw animation is flaky: draw shapes instantly and animate only the pointer.

## 7. Grok Bot task spec

Bot name: Course Pack Collector. Future task text lives in `grokbot/TASK.md`; this collector is not running and requires a separate assignment from David. Two phases. Phase 1: read the Canvas dashboard and each course's Assignments page, POST a `StudentProfile` to `/api/ingest/profile`. Phase 2: for each course (or the one named), collect syllabus, lectures, psets, solutions, exam reviews, name files by kind and number, POST to `/api/ingest`. Report what was collected and anything it could not access. Rehearse once with Duo before recording the README GIF.

### Voice and teaching surface update

Speech synthesis defaults to ElevenLabs conversational v3; set ELEVENLABS_TTS_MODEL=eleven_flash_v2_5 to roll back. Local VAD, batch Scribe v2, Grok, and the queued audio/visual lifecycle remain. Managed realtime turn-taking is separate work. No dependency or shared type changes in this slice.

Local LivePage metadata now includes optional textRegions: bounded PDF.js text fragments with normalized BBox geometry. PdfViewer publishes them, the LLM route validates numeric coordinates, and the runtime exposes them as measured anchors. These locate fragments, not individual glyphs inside a long fragment. Image-only PDFs still rely on vision. Active-session MODE commands cannot replace student intent.

BoardText is the common SVG typography renderer for DRAW and ANIM. The snapshot canvas uses the same font family, sizing, and deterministic symbol colors. This supports plain notation and Base/AMS LaTeX math, with shared vector glyphs for SVG and snapshots. It does not perform symbolic algebra or compile full LaTeX documents. Student ink stays independent of tutor revisions.


## September 11 consolidation implementation

David authorized integration of context #6, recap #8, and auth #9; all are merged. lib/types.ts remains frozen. Runtime identity comes from the verified Google session when configured, otherwise the connected Canvas profile or an unnamed guest. The immediate greeting no longer contains a developer name. Google is optional for the live demo; Canvas remains a separate NetID/Duo sign-in inside Grok Bot.

The implemented collector transport refines the earlier multipart proposal: /api/ingest/profile receives profile JSON and /api/ingest receives one document's extracted page text as JSON. See grokbot/TASK.md for exact fields. POST /api/courses/connect issues a two-hour HMAC token bound to a server-resolved account or opaque HttpOnly guest cookie. Body email/userId never establishes ownership. Source text is chunked by the existing context module; retrieval is lexical, with solution exclusion before ranking. No embeddings or policies extraction model is running. Files are read-only source references; uploaded PDF bytes use the separate pset endpoint.

Private storage uses the boh-private Supabase bucket, created private by the server when configured. Only the server has the service key. Profiles, packs, and new PDFs have owner-scoped paths. Local .data/private is a development fallback; Vercel refuses writes without Supabase. Existing anonymous localhost PDFs remain readable only as a migration fallback. Browser-local sessions use separate IndexedDB databases per authenticated identity; guest history is preserved separately and is not silently adopted by a signed-in account. This is not cross-device transcript sync.

The LLM route captures request-local page, board, identity, and retrieved sources; it no longer uses process-global mutable page/board state for live API requests. Semantic routing can select an exact ID from the supplied course catalog. That selection reaches the next reasoning request and is saved with the conversation. Course documents are source data, never student work or instructions.

Closing is semantic and student-first: a close route asks for the learner's takeaway. Only audible playback records SUMMARY_REQUEST in model history. After the student responds or declines, the recap route generates validated Recap data, preserves the student's actual words, and restricts review titles to retrieved sources. A RECAP payload travels through the existing spoken-beat queue. The card is saved with the voice archive only on uncancelled playback. No frozen AgentTurn change is required; local TeachingTurn carries recap/course metadata. The visible transcript contains speech only. No cloud recap adapter or cross-session memory is implemented yet.

## Submission deployment storage, September 11

The private storage adapter now prefers a linked private Vercel Blob store (BLOB_READ_WRITE_TOKEN, or BLOB_STORE_ID with OIDC), then the optional configured Supabase adapter. Unconfigured local runs use .data/private; Vercel never silently falls back to disk. Both backends keep existing owner-scoped paths and the profile/page-text ingest contract. Mutable Blob profile/pack reads use useCache:false to avoid stale read-modify-write data during sequential uploads. PDF bytes use short-lived, single-path signed PUT/GET URLs, so large files bypass the function request/response size limit. Signed upload constraints enforce application/pdf, 20 MB, no overwrite and ten-minute expiry. Real hosted persistence/isolation plus browser PDF/ink recovery checks pass. Session conversation/board/recap archives remain in IndexedDB; this is not cross-device session synchronization.
