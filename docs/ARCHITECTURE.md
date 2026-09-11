# Architecture and Interface Contracts

Read DESIGN.md first. This doc defines the system shape and the contracts between lanes so that agents on two machines can build in parallel without talking.

## Implementation baseline

The diagram and interfaces below include target integrations. Read LANES.md for an inventory of actual files and first PR boundaries. Currently the browser owns the custom voice loop and calls the LLM route; STT and TTS are separate ElevenLabs API calls. The whiteboard is custom SVG. Auth, Supabase, ingest/retrieve endpoints, persistent session/recap endpoints, and the spoken recap flow are not implemented. Shared types describe their target data, not working services.

Keep the existing adaptive desk in `app/(session)/voice/VoiceSession.tsx`. All three entry choices use the same shell; PDF and Whiteboard are views within it. Client speech intent switches the desk before waiting for model tags. Reference notes use optional `documentKind: notes` in the local LivePage adapter and do not replace the homework PDF. The working orb and captions remain in the voice lane until a coordinated integration explicitly moves them.

Hussein can start the isolated context, recap, and shell slices in LANES.md from main. David reviews their PRs before merging. Root entry/layout, package files, environment names, and schema are shared touchpoints; do not overwrite another lane's integration to make an isolated slice run.

## Student turn ownership

Attachments and ink update live context without starting speech. Readiness callbacks remain for desk compatibility, but only a student utterance or initial greeting starts spoken interaction. The current voice loop waits about 1.1s of non-speech to submit recorded speech, or accepts an orb tap to finish. The orb never cancels a turn; the separate Pause control and Escape stop voice without leaving the desk. During playback, browser echo cancellation plus sustained Silero speech probability can interrupt. This needs real-device validation and is not semantic endpoint detection or speaker identification. Background vocals can still be classified as speech.

The speech queue prepares upcoming TTS audio and plays one chunk at a time. Captions and assistant history advance at sentence start, not model token arrival. There is no silent client word/sentence cap. Completed visual tags are queued after their preceding words. Short symbolic equations use existing DRAW text, with bounded line length and shared SVG/snapshot sizing; no new shared contract is required. The speech-only normalizer expands common SI notation while the board retains written symbols. A partially interrupted sentence is not word-aligned.

Speech detection uses pinned `@ricky0123/vad-web` 0.0.30 with Silero v5 and ONNX Runtime WASM, on the client. This voice repair changes the shared package manifests and adds predev/prebuild asset preparation. `scripts/prepare-voice-assets.mjs` copies the installed model, worklet, and WASM assets to ignored `public/voice-assets`; no runtime CDN or microphone audio leaves the browser for detection. The STT service still receives completed recordings. Initialize and retry failures are visible. Recording finalization, STT, TTS, and model generation have deadlines, with late completions ignored.

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

Each model turn returns speech plus UI commands. The model emits tags inline; the voice lane strips them before TTS and dispatches them.

Inline tag grammar the model uses:

```
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

- Fast lane, `deep` absent. A non-reasoning model, about 0.6s to the first word. Every turn starts here so the student always hears something immediately.
- Reasoning lane, `deep: true`. `grok-4.6` at low reasoning effort, about 7s. Used when being wrong would cost the student: checking their working, diagnosing a misconception, choosing the next hint rung.

The fast lane decides. When a turn needs real reasoning it says one short line telling the student it is looking, emits `[THINK]`, and stops. The client speaks that line and immediately issues the `deep: true` request, so the reasoning wait runs underneath the lead-in audio instead of after it. The reasoning reply is the substantive turn and both replies land in history in order. Latency measured against the real prompt: non-reasoning 0.5s, `grok-4.6` low effort 7.4s, `grok-4.6` default 26s. A reasoning model must never run the fast lane.

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

BoardText is the common SVG typography renderer for DRAW and ANIM. The snapshot canvas uses the same font family, sizing, and deterministic symbol colors. This supports short Unicode equations and labels, not arbitrary LaTeX or symbolic algebra. Student ink stays independent of tutor revisions.
