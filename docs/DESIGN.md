# Better Office Hours: Design and Decisions

This is the source of truth for what we are building, why, and what we have decided. Every agent working in this repo reads this first. If something here conflicts with a chat message or an older doc, this wins.

## 1. What we are building

Better Office Hours is a voice-first tutor for Yale students. A student opens the app, the tutor already knows their course, the student uploads or opens a problem set, and the tutor walks them through it the way a great TA in office hours would: asking questions, pointing at the document, drawing on a whiteboard while it explains, and never giving the answer. It also handles the other things office hours are for: explaining a concept from scratch, going over lecture notes, and figuring out what a student does not understand. Every session ends with a spoken recap of where the student got stuck and what to review.

One line: a patient, context-aware tutor that talks you to the answer instead of handing it to you.

## 2. Why this and why now

- Office hours are crowded, time-conflicting, and intimidating. Students skip them because they fear looking incapable, and first-generation students most of all.
- LLM chat tutors have no context of the course and cannot see the student's work, so they either answer generically or just solve the problem. Field evidence (Bastani et al., PNAS 2025) shows unguarded AI help improves in-session performance and reduces later exam performance by 17 percent. A guardrailed hint-only version removed the harm. Guardrails are the product, not a feature.
- YouTube and generic explanations drift off the professor's syllabus and notation. A tutor loaded with the actual lecture notes and policies teaches what the course expects.

## 3. The hackathon

- Event: Yale AI Association x SpaceXAI "Rapid-fire Cursor" competition.
- Brief: a useful web app for Yale students, built in Cursor. Useful beats flashy.
- Judged on usefulness, craft, and speed. Three winners.
- Submission: public GitHub repo with README containing a screenshot of building it in Cursor, usage instructions (logins, test accounts), and a public link to a 1 to 2 minute demo video. Submit at yale-ai.org/win.
- Deadline: Friday, September 11, 2026, 11:59 PM.
- Team: David Antwi and one teammate. Both build in Cursor with coding agents on their own machines.

## 4. The user experience

### Opening: the orb comes first
Student signs in with their Yale Google account. That is the only click. The screen is empty except for the orb, centered. It speaks first:

"Hey David. What do you want to work on?"

This is office hours. The student arrives with a request and says it. Under the orb, three quiet chips give the same choices for anyone who would rather tap than talk: "Homework", "Explain a concept", "Something else". Tapping a chip is the same as saying it. Nothing else is on screen.

The student answers in their own words ("pset 3 for physics", "I don't get relative motion", "can we go over lecture 6"). The orb confirms and proves it knows the course in its reply, not in its greeting: "Pset 3 for PHYS 180, due Friday. Drop it in, or I can pull it up." Then the screen transforms into the layout for that mode.

If a previous session exists, the orb still opens with the same question, then after the student answers it adds one short retrieval check on last time's sticking point.

### Layout after the student answers
The empty orb screen animates into a split screen, roughly 65/35. The orb shrinks and moves to the top of the right panel.

- Left, the workspace. The problem set PDF, fit to the desk and zoomable (buttons, or pinch / Ctrl-scroll). Drag with the hand tool to pan when zoomed in. A compact bar under the title has ink, zoom, and pages. The tutor's pointer and highlight live on the page. The student can write, highlight, or erase, and the tutor sees those marks.
- Right, the agent panel. Top: the orb. Below: a live caption-style transcript of both sides. Below that: the whiteboard, collapsed until the tutor first draws, then expanded. The student can draw on it and the tutor responds.
- A small course switcher in a corner. Nothing else.

### The whiteboard: strokes and generated animation
Visuals are how this feels like a great explainer rather than a chatbot with a voice. Nothing on the board is scripted for the demo. The tutor composes what it draws and animates for whatever the student is learning; projectile motion is only what we test on.

1. Hand-drawn strokes. tldraw shapes that animate in one at a time as the tutor names them. The default for anything spatial.
2. Generated animation, declarative. The tutor emits shapes with keyframes on a timeline (an arrow whose tip follows a path over two seconds, a label that appears at t=1, a curve that draws in, a bar that grows). The board runs it instantly. This covers most explanations in physics, math, and CS and is the primary animation path.
3. Generated animation, programmatic. When the spec cannot express it (a simulation, a graph that responds to a slider), the tutor writes a small JS function against a tiny drawing API, run in a sandboxed iframe. Slower and riskier, used only when needed.
4. Pre-built scenes (fallback and test fixture only). A hand-written projectile scene exists to test the pipeline and as a fallback if the generated path is flaky at the Friday checkpoint. It is not the product.

Rules: an animation plays only when the tutor says what to watch for; it pauses when the student talks; animations use the student's own numbers from the problem; the student can scrub time. Manim is never in the live loop.

### Modes, chosen by what the student says
- Pset mode: the student names homework. The workspace pane shows a drop zone for the pset PDF (or the pset the Grok Bot already collected, if it matches). Once loaded, the tutor starts.
- Concept mode: the student names an idea to learn or notes to go over. The workspace becomes the full-size whiteboard and the tutor teaches at the board. Lecture notes are retrieved into context.
- Something else: the orb asks one clarifying question and picks the closer mode.
The shell is the same in every mode. Only the workspace pane changes.

### Interaction rules
- Voice is the only way to address the agent. Mouse and trackpad are for pointing, drawing, paging, and leaving, never for talking to the tutor.
- The orb speaks first with an open question. It names the pset and due date in its reply once the student says what they want.
- Barge-in works. If the student talks over the tutor, it stops.
- The tutor points before it explains.
- The whiteboard opens only when a picture helps.
- The recap is spoken. A card appears as it talks and is saved to the course.

### The orb
The orb is the only visual for the agent. States: idle breathing, listening (expands with the student's voice), thinking (slow rotate), speaking (pulses with the audio waveform). Design detail is decided in Cursor during the build, but these four states are fixed.

### Feel
- The first word of every reply arrives within about a second. Use a short verbal lead-in ("Right, so...") to mask model time.
- Draw strokes animate in one at a time, not all at once.
- The pointer eases, never jumps.
- Course-aware wording ("the way it was set up in lecture 4") proves the context is real.
- If a previous session exists, the orb opens with a short retrieval check on last time's sticking point.

## 5. Context: what the tutor knows, where it comes from, and when

This is the layer most products get wrong. Five layers, from most stable to most live. Each has one source of truth, one owner lane, and a refresh rule.

How to read this table: the layers and the contracts are fixed. The sources are our best guess and are expected to change during the build. If the Grok Bot cannot get through Duo, if the Canvas token is disabled, if a scrape is flaky, swap the source and keep the layer. The one constraint that decides every swap is that the student never does setup work. Frictionless wins over faithful-to-the-plan.

| Layer | What it holds | Source | When | Fallback |
|---|---|---|---|---|
| 1. Student profile | Name, Yale email, enrolled courses this term; per course: professor, meeting times, assignment list with due dates | Grok Bot reads the Canvas dashboard and each course's Assignments page | First sign-in; refreshed daily or on demand | Canvas token; then the student names courses by voice |
| 2. Course pack | Syllabus and policies, lecture notes and slides, past psets, posted solutions (hidden from the student), exam reviews | Grok Bot collects from each course's Files, Modules, Pages | Once per course, at onboarding or the first time the student asks about that course; refreshed when new files appear | Canvas token; then manual upload |
| 3. Assignment context | The pset the student is working on: PDF, detected questions, due date, which questions have been worked with the tutor | Student uploads the PDF, or the app matches the request to layer 1 and offers to pull the file the bot already collected | At the start of a pset session | Upload only |
| 4. Learning memory | Per student per course: session recaps, misconceptions seen and resolved, what to review, style preset | The app, written at the end of every session | Every session | None needed |
| 5. Live session | Current page image, board snapshot, transcript, hint rung per question | The app, in memory during the session | Per turn | None needed |

What each layer buys in the experience:
- Layer 1 lets the orb answer "pset 3 for physics" with "due Friday" and lets it list the student's courses on first sign-in.
- Layer 2 makes the tutor teach with the professor's notation, cite lectures by number, and respect the collaboration policy.
- Layer 3 lets the tutor point at the actual document and track progress per question.
- Layer 4 lets the orb open a later session with a retrieval check on last time's sticking point. Over time this layer is how the tutor learns the student: which explanations land, which misconceptions recur, how much hinting they need. It may not be shown in the demo, but the recap card at the end of every session is the seed of it, and a single line in the video ("last time you got stuck on components") is enough to show it exists.
- Layer 5 is what the tutor sees and hears right now.

### First sign-in
Student signs in with Yale Google. The orb says "Give me a minute to read your Canvas." The Grok Bot builds layer 1 (Duo approval needed once). The orb comes back: "Got it. PHYS 180, CPSC 223, and ECON 115. What do you want to work on?" That sentence proves the profile exists. Layer 2 for each course is collected in the background, starting with whichever course the student names first.

For the demo and the judge account, layers 1 and 2 are preloaded for PHYS 180 so the greeting is instant.

### Retrieval
Per turn, the LLM endpoint pulls the top chunks from layer 2 for the current question, adds the relevant assignment metadata from layer 3, the latest recap from layer 4, and the page and board images from layer 5. Solution chunks go into a hidden reference block the tutor uses to check reasoning and never reveals. "It has the answer key and will not give it to you" is a line in the README.

### Privacy
Grok Bot signs into Canvas as the student, on their own account, with their approval. We store only course materials, assignment metadata, and the student's own session data. No grades, no other students' data. This is stated in the README.

## 6. Tutor behavior

The full basis is in PEDAGOGY.md and the prompt itself is in PROMPT.md. The short version:

- Elicit before explaining. Ask what the student wants and what they already understand.
- One question at a time, then wait about three seconds.
- Step-level dialogue, not answer-level.
- Hint ladder: prompt, pointing hint, teaching hint, bottom-out. One rung per stuck moment. Never open at the bottom. Never reach the bottom on a graded problem; walk a parallel example instead.
- Contingent support: more after failure or frustration, less after success.
- Predict-then-explain for physics concepts. Primed for the projectile-motion misconception list.
- Feedback about process, never the person.
- Spoken turns short, about two or three sentences, under about 70 words.
- Whiteboard only for spatial or relational ideas; narrate and point while drawing; no text walls on the board.
- Refuse final answers on graded work; acknowledge, explain why, offer the next step.
- Close with the student summarizing, then a spoken recap: where stuck, what fixed it, one specific thing to review.

Two or three teaching style presets (more hints vs fewer, slower vs faster) exposed as a small toggle.

## 7. Demo course and demo plan

Demo course is PHYS 180 (introductory physics, kinematics and projectile motion). We both took it, we can verify the tutor's physics, and we have all the old lecture notes, psets, and exams. It is an archived course on Canvas; the Grok Bot pulls from past enrollments. The video shows only the student flow. The README states in one line that the demo course is from a past term and the same flow works on any current Canvas course.

The demo script is in DEMO.md.

## 8. How Grok Bot comes in

Grok Bot is SpaceXAI's agent product (beta since August 2026). Each bot gets its own persistent cloud computer with a browser, file system, and terminal, signs into the tools you already use the way a person would, and finishes tasks end to end. It is included with Cursor Pro, which we have from the event. Bots can be shared by link; that is what the "Try it out" links from the other schools' winners were.

Our use of it:

- The Course Pack Collector bot has two jobs. First, at onboarding, it reads the Canvas dashboard and each course's Assignments page and posts the student profile (layer 1). Second, per course, it collects the course pack (layer 2): syllabus, lecture notes and slides, psets, posted solutions, exam reviews. It runs once per course and can be re-run to refresh. Yale Canvas is behind CAS and Duo, so the bot needs a human to approve the 2FA push at least once. We rehearse this before recording.
- The bot's share link goes in the README next to the web app. Judges see a web app plus a Grok Bot, which matches both the slide and the prior winners.
- A short GIF of the bot pulling the course pack goes in the README, not the video.

Optional second bot if time allows: a Session Memory bot that, after each session, drops the recap into the student's notes app or calendar as a review reminder. Roadmap only.

Why a bot instead of the Canvas API: no token setup, no CAS integration in our app, and it works on anything with a login and no clean API. The API stays as the fallback.

## 9. Stack

- Next.js on Vercel.
- ElevenLabs Conversational AI for voice (STT, TTS, turn-taking, barge-in) with a custom LLM endpoint pointed at Grok. If screenshot injection through the ElevenLabs agent fights us, fall back to ElevenLabs STT and TTS around our own orchestration loop.
- Grok via api.x.ai, OpenAI-compatible, for reasoning, document vision, retrieval synthesis, and recap. `grok-4.20-0309-non-reasoning` runs the spoken turn; see the model note in section 12. $25 free credit plus event credits.
- tldraw for the whiteboard.
- PDF.js for the workspace with an overlay layer for pointer, highlights, and student annotations.
- Supabase (Postgres with pgvector) for course packs, chunks, sessions, and recaps.
- Grok Bot for Canvas ingestion.
- Google OAuth for sign-in plus a judge test account.

Full interface contracts are in ARCHITECTURE.md.

## 10. In scope for Friday

Screen: PDF workspace with pointer and highlights, orb with four states, live transcript, whiteboard both directions, generated animation (declarative spec), concept mode.
Voice: realtime with barge-in, first word within about a second.
Context: pset upload, Grok Bot course pack, retrieval, solutions withheld.
Tutor: the full PROMPT.md behavior, misconception watchlist, style presets, spoken recap saved per course.
Shell: Google sign-in, judge test account, course switcher, live Vercel URL.
Submission: README with Cursor screenshot, run instructions, test account, Grok Bot share link and GIF, demo video link, one line naming Grok, Grok Bot, ElevenLabs, and Cursor.

## 11. Out of scope for Friday

Voice cloning. Professor-editable prompts. Lecture recording transcription (roadmap; mention in README). Live screen share as the primary flow (secondary action only, for GoodNotes or code). iPad (Friday-only experiment: either mirror the iPad through the laptop or drop a photo of handwritten work into the workspace). Canvas API integration beyond the fallback.

## 12. Decisions log

- Product is office hours broadly, not psets only. Pset mode and concept mode share one shell.
- The app opens on the orb alone with "What do you want to work on?" The student states the request; the layout transforms to match. Three optional chips mirror the choices for tapping.
- Voice is the primary and only input to the agent.
- The pset is uploaded by the student; the Grok Bot collects everything around it.
- Demo course is archived PHYS 180; the video shows the student flow only; README carries the honesty line.
- Use what works for voice (ElevenLabs), keep Grok as the reasoning model so the sponsor stack is real.
- Whiteboard is tldraw. Pointer and annotations render on a PDF we control, not on a screenshot.
- Hint ladder never reaches bottom-out on graded work.
- Student summarizes first at the end of every session.
- Cut order if behind at the Friday morning checkpoint: pointer overlay first, Grok Bot second, style presets third, programmatic animation fourth (keep declarative). The voice loop, the PDF, the whiteboard strokes, generated animation, and the recap are never cut. If generated animation is flaky, the pre-built projectile scene is the fallback for the demo only.
- Animation is generated by the tutor per turn, not chosen from a library. Manim is never in the loop.
- Laptop and iPad layouts are primary for Friday. Every screen must remain usable at smaller widths with a stacked fallback. A dedicated mobile design is a later pass.
- The spoken turn runs on `grok-4.20-0309-non-reasoning`. Measured against the real prompt: first token 0.5s for the non-reasoning model, 16s for `grok-4.6` at low reasoning effort, 26s for `grok-4.6` by default. Section 10 requires the first word inside about a second, so the reasoning models are unusable for speech. Both read the pset page image, so the pointer is unaffected. If the recap later needs deeper reasoning, run that one call on `grok-4.6` where latency does not matter.
- The per-turn context block states only what is actually loaded. A hardcoded demo block naming PHYS 180 and "Problem Set 3" made the tutor open by naming an assignment the student never uploaded. Until the context lane is real, the block says nothing is loaded and the tutor asks for the upload. Once a page is on the desk, that instruction flips: the tutor can see the assignment and the problem on screen, and must not ask for an upload.
- Leave parks work. The orb is a lobby, not one long chat. Homework is one session (this PDF, this transcript, these marks). A concept is another. Leave puts the current session aside and returns to the lobby with a clean history, so the tutor cannot still see the pset. Sitting back down, the Homework chip, or saying homework again restores that session. Switching to "Explain a concept" does not keep the homework captions or the live page. This is not a ChatGPT-style chat sidebar. It is how office hours work: you step away from the desk, then you sit back down with the same paper.
- One paper on the desk at a time. There is no GoodNotes-style notebook library for Friday. **Remove** puts the current PDF away, clears that homework session (captions, marks, what the tutor just saw), and returns the drop zone so the student can open a different problem. Saying they want a different pset does the same. Uploading the next file starts a fresh homework session.
- Captions are live, not a chat log. Only the latest few lines stay on screen, they are not selectable like messages, and putting the paper away clears them. The full session is still in memory for the tutor until then.
- Student ink on the PDF is a compact two-cluster bar (tools, then colors), in the spirit of GoodNotes / Notability / Canvas, kept to cream, black, rust, and gold. Pen, highlighter, and eraser. Marks are workspace-local and burned into the page image the tutor sees. The `StudentAnnotation` contract in `lib/types.ts` is unchanged. This is also the drawing feel the whiteboard should later match. The tldraw board itself is still not started.
- The PDF fits the desk at 100% on every screen. Zoom (− / percent / + in the ink bar, plus pinch or Ctrl-scroll) scales the page around the cursor or the center of the desk; the hand tool drags to pan. Click the percent to fit the page again. Pages live in that same bar. The title bar only has Leave, the filename, and Remove. Ink coordinates stay normalized to the page, so zoom does not break drawing or the laser.

## 13. Roadmap (README only)

Professor console to edit the tutor prompt and upload materials. Lecture recording transcription. Live screen share for coding courses. iPad handwriting. Spaced review reminders across sessions. Cross-course memory.

Transcript export. The session transcript is already captured for the recap, so exporting it is small. It pairs with the professor console: a professor who can shape the tutor's priors for their class also wants to see where their students actually got stuck, and an exported transcript is the artifact that carries that. Out of scope for Friday, worth a line in the README.
