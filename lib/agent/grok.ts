import OpenAI from "openai";
import { TEACHING_GUIDANCE, teachingTag } from "./teaching-intent";
import { DIAGRAM_GUIDANCE } from './diagram-guidance';
import { CONCEPT_RESPONSE_FORMAT, CONCEPT_FORMAT_GUIDANCE, conceptProgress, conceptResponse } from './concept-response';
import { CONCEPT_ROUTING_FORMAT, conceptRoutingMessages, conceptRoute, parseConceptRoute } from './concept-routing';
import { parseAgentTurn } from "./tags";
import {
  buildContextBlock,
  buildVoiceNote,
  DEEP_TURN,
  WHEN_TO_THINK,
} from "@/lib/agent/context";
import { describeEvent, type SessionEvent } from "@/lib/agent/events";
import { loadTutorPrompt } from "@/lib/agent/prompt";
import { getLivePage } from "@/lib/pdf/live-page";
import { describeBoard, getLiveBoard } from "@/lib/whiteboard/live-board";
import type { ChatMessage } from "@/lib/agent/tags";

// Fast lane. grok-4.6 reasons before it answers, which put the first spoken
// word 26s out. This non-reasoning model answers in about half a second and
// still reads the pset page image, so the pointer keeps working.
export const GROK_MODEL = "grok-4.20-0309-non-reasoning";

// Reasoning lane, for turns where being wrong costs the student. Measured at
// 7.4s against the real prompt, versus 26s at default effort. Its wait is
// covered by the fast lane's lead-in audio.
export const GROK_DEEP_MODEL = "grok-4.6";

// Teaching desks use narrated lessons for concepts and homework setups alike.
// Topic names never select fixtures; the model decides what needs a picture.
export function usesConceptLesson(deep = false, visualRepair = false): boolean {
  const live = getLivePage();
  return deep && !visualRepair && Boolean(live || getLiveBoard()?.open);
}

export function usesConceptRouter(deep = false, visualRepair = false): boolean {
  return !deep && usesConceptLesson(true, visualRepair);
}

function client() {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error("XAI_API_KEY is not set");
  }
  return new OpenAI({ apiKey, baseURL: "https://api.x.ai/v1" });
}

const BOARD_NARRATION = `\n<board_narration>Let the teaching move determine what belongs on the board; a question can leave an established picture unchanged. For an unfamiliar idea whose meaning is spatial, structural, causal, or changes over time, build a small explanatory scene in this turn. Use the rhythm of a short whiteboard explainer: introduce an object, draw it, explain a relation, add or focus that relation, then ask one question about what is now visible. Put each DRAW or ANIM tag immediately BEFORE the spoken sentence naming that element. The app queues tags with narration; do not place all the drawing after your final question. Two or three beats around one connected figure are enough. Do not dump a finished diagram before its introduction or turn this into a long lecture. Never write the equation, method, or conclusion the learner is being asked to recall or predict. Record the learner's checked relationship, or provide a needed teaching hint, only when that is the chosen move. An established given or a blank is often enough during elicitation. For orientation, favor a labeled picture of the objects, stages, or relationships over a formula. Use POINT or HIGHLIGHT for relevant content actually present on the PDF.
Compose a clear small teaching figure, not a loose collection of words. Give it a short descriptive topic heading. Use two to four important elements with visible connections; label the object, reference direction, and changing quantity when relevant. Attach concise labels to shapes using their label field; use standalone text only for a short caption or a distinct region. Place labels beside their referents, outside paths and arrowheads, with space between neighboring labels. Keep object sizes and line weights proportionate. Distinguish a physical object, its path, and a vector; don't draw one ambiguous arrow standing for all three. Prefer a meaningful qualitative sketch over unsupported precision. Choose color by role consistently: ink for structure, accent for the active quantity, muted for reference lines. Never calculate or label a new graded answer. Keep fixed attachments physically coherent. If an object rests on a surface, make the outlines touch rather than passing the surface through its center. Align reference arrows with the direction they label, and keep comparison labels explicit. If a motion spec cannot express the idea faithfully, draw a clear static comparison of states instead.
Use LaTeX in DRAW text for equations, fractions, roots, vectors, and aligned mathematics; follow math_notation below. Plain Unicode remains supported for short quantities. Keep each equation compact and geometry labels at most six words. For notes, use a short topic heading (text id=topic, size s, y=0.12), then only the rows needed at this teaching step. Given/definition rows use IDs given-1, note-1, definition-1 and consistent left alignment; a justified relationship uses id=relation. There is no mandatory equation slot. New topic headings start a fresh scrollable page; preserve earlier work. Leave the lower third for student thinking and ink. Reuse IDs to revise your own work, use DRAW highlight id=... for focus, and remove stale tutor lines. Do not attribute tutor notes to the student or place shapes across existing notes. Coordinates are normalized 0 to 1 with y downward. Keep a generous margin.
For motion use declarative [ANIM {...}] only, never ANIM_PROGRAM. Schema: {id,duration,shapes:[...]}, seconds under 8; kinds: axes {id,origin:{x,y},xLabel,yLabel}; arrow {id,label,keyframes:[{t,from:{x,y},to:{x,y},color,opacity}]}; dot {id,keyframes:[{t,at:{x,y},r,opacity}]}; path {id,points:[{x,y},...],keyframes:[{t,drawn,opacity}]}; text {id,text,keyframes:[{t,at:{x,y},opacity}]}; bar {id,keyframes:[{t,at:{x,y},w,h,opacity}]}. Every ANIM shape needs kind. ANIM kinds are exactly axes, arrow, dot, path, text, bar: NEVER line or circle. Use dot for a round moving object and path for a fixed line. All arrow keyframes must contain both from and to, all dot/text keyframes contain at, all path keyframes contain drawn. Write these required properties in EVERY frame, including holds; top-level positions or an opacity-only frame are invalid. Before emitting, check the scene against its constraints: fixed lengths stay fixed, attached parts move together, fixed supports stay fixed, arrows represent their named quantity. Prefer two or three coherent shapes over a complicated scene. Do not promise forces, speed changes, or effects that your geometry does not show. Static positions: text uses at:{x,y}, circle uses center:{x,y} and r, line/arrow use from:{x,y} and to:{x,y}. DRAW uses op equal to the shape name (arrow, axes, line, curve, circle, text), never op draw or a kind field. Keyframes have increasing t and optional ease linear, inOut, out. Points normalized 0..1, y downward. Arrow endpoints or dot at can use {follow:{pathId,offset:{x,y}}} to ride the path's drawn progress. Paths smoothly interpolate their declared points, bounded between successive samples; drawn advances by point index, not distance. Supply samples at equal time intervals for linear drawn timing, or keyframe drawn at the required sample times. Two-point paths stay straight. A playback hold is a pause for observation, not evidence that the physical object stops. Include a 0.65s initial hold and a final hold. Keep the spec compact, at most five shapes. [ANIM focus=id] signals one shape; [ANIM resume] continues after interruption. Use DRAW for a static diagram; ANIM when change over time is the idea.</board_narration>`;

const MATH_GUIDANCE = String.raw`<math_notation>The board typesets LaTeX locally. Put LaTeX in the existing DRAW text field, with no dollar delimiters needed; JSON requires doubled backslashes. Example syntax only: [DRAW {"op":"text","id":"relation","at":{"x":0.5,"y":0.3},"text":"v^{2}=v_{0}^{2}+2a\\Delta y","size":"m"}]. Use \\frac{numerator}{denominator}, \\sqrt{...}, subscripts _{...}, exponents ^{...}, \\vec{...}, integrals, and \\begin{aligned} ... &= ... \\\\ ... &= ... \\end{aligned} for a short alignment (use actual ampersands, not HTML entities). For units use \\mathrm{m}, \\mathrm{s}^{2}, and \\, for a small space. Put each known given in its own given-* row instead of one comma-separated line. Topic headings and ordinary prose stay plain text. Keep expressions under 800 characters and at most three aligned rows. Base/AMS math is supported; no custom macros, HTML, links, packages, or external images. This typesetting support never changes the teaching move or permits an early equation, complete graded solution, or final answer. Speak in ordinary words, not LaTeX commands.</math_notation>`;

export function buildGrokMessages(
  history: ChatMessage[],
  event?: SessionEvent | null,
  deep = false,
): ChatMessage[] {
  const live = getLivePage();
  const board = getLiveBoard();
  const extra = live
    ? `\n${[
        `<pset_page>${live.page + 1}</pset_page>`,
        `<pset_text>${live.text.slice(0, 4000)}</pset_text>`,
        `<text_anchors>${JSON.stringify((live.textRegions ?? []).map((region, anchor) => ({ anchor, ...region })))}</text_anchors>`,
        "When reading or explaining a given, emit [HIGHLIGHT page=N anchor=ID] immediately before the sentence that names it, using the exact anchor ID from text_anchors. Highlight one relevant fragment at a time, then advance with the next sentence. Prefer this ID form over copying coordinates; the runtime uses the measured PDF bounds. Skip the tag if the relevant fragment is absent. Prefer highlighting the relevant given over covering it with a pointer label. Never point at a formula absent from this page. Only write a new relationship when the chosen teaching move calls for it. Anchors are normalized to the full PDF page and remain valid at every zoom.",
        `<question_regions>${live.questionRegions
          .map(
            (region) =>
              `${region.label}: x=${region.bbox.x.toFixed(3)} y=${region.bbox.y.toFixed(3)} w=${region.bbox.w.toFixed(3)} h=${region.bbox.h.toFixed(3)}`,
          )
          .join("; ")}</question_regions>`,
      ].join("\n")}`
    : "";
  const boardNote = `\n<board>The whiteboard is ${board?.open ? "open" : "available"}. Choose the visual from the learner's question. Coordinates are normalized 0 to 1, origin at top left. Emit [BOARD open] with DRAW commands in narrated order. A DRAW has op and id, with at for text, center and r for circle, from and to for line/arrow, points for curve, or origin for axes. Use the schemas below. No example scene or required equation is supplied.</board>`;
  const context = buildContextBlock(
    live
      ? {
          documentKind: live.documentKind,
          psetTitle: live.title || "the PDF the student uploaded",
          page: live.page + 1,
          pages: live.pages,
          mode: live.documentKind === "notes" ? "concept" : "pset",
          studentDrew: (live.studentMarks ?? 0) > 0 || Boolean(board?.studentShapesSince),
        }
      : {
          mode: board?.open ? "concept" : "orb_only",
          studentDrew: Boolean(board?.studentShapesSince),
        },
  );
  const materialNote = live?.documentKind === "notes" ? "\n<reference_notes>The attached PDF is supplemental notes in a concept session. Keep the concept workspace. Do not treat these notes as an assignment, ask which problem to solve, or emit MODE pset unless the student explicitly asks for homework. Point at relevant material and draw to explain it.</reference_notes>" : "";
  const eventBlock = event ? `\n<event>${describeEvent(event)}</event>` : "";
  const rest = history.filter((message) => message.role !== "system");
  // Late in the system message, because these are the instructions the model
  // was most willing to drop when they sat higher up.
  const voice = `\n<voice>${buildVoiceNote(recentOpenings(rest))}</voice>`;
  // The lane instruction sits last. The fast lane ignored it from higher up and
  // answered hard problems itself.
  const lane = deep
    ? `\n<deep_turn>${DEEP_TURN}</deep_turn>`
    : `\n<when_to_think>${WHEN_TO_THINK}</when_to_think>`;
  const system = `${loadTutorPrompt("your course")}\n\n${context}${extra}${boardNote}${BOARD_NARRATION}${MATH_GUIDANCE}${DIAGRAM_GUIDANCE}${voice}${eventBlock}${materialNote}${describeBoard(board)}${TEACHING_GUIDANCE}${lane}`;
  return [{ role: "system", content: system }, ...rest];
}

function recentOpenings(history: ChatMessage[]): string[] {
  return history
    .filter((message) => message.role === "assistant")
    .slice(-4)
    .map((message) => message.content.trim().split(/\s+/).slice(0, 2).join(" "))
    .filter((opening) => opening.length > 2);
}

function toApiMessages(
  history: ChatMessage[],
  event?: SessionEvent | null,
  deep = false,
): OpenAI.Chat.ChatCompletionMessageParam[] {
  const built = buildGrokMessages(history, event, deep);
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = built.map((message) => ({
    role: message.role,
    content: message.content,
  }));

  // The page rides at the end rather than on the last student turn, because an
  // event turn has no student turn to attach it to.
  const live = getLivePage();
  if (live?.imageUrl) {
    messages.push({
      role: "user",
      content: [
        {
          type: "text",
          text: [
            `This is the student's screen right now: page ${live.page + 1} of the ${live.documentKind === "notes" ? "supplemental notes" : "assignment"} on their desk.`,
            "You can see this page. Do not ask them to upload it or which assignment it is.",
            live.studentMarks
              ? `The student drew ${live.studentMarks === 1 ? "a mark" : `${live.studentMarks} marks`} on this page; the ink is in the image. Use these marks as context for their current request; existing ink is not a new request to speak.`
              : "",
            `Coordinates refer to the full page image, not the browser viewport or zoom. Use supplied question regions for a problem heading; inspect the image for a specific equation. If you cannot locate it reliably, ask instead of guessing. Use HIGHLIGHT page=... x=... y=... w=... h=... for a small relevant region. Coordinates are normalized 0 to 1. Prefer [HIGHLIGHT page=${live.page + 1} anchor=ID] using text_anchors before the sentence about that fragment. Reserve POINT for figures without a text anchor.`,
          ]
            .filter(Boolean)
            .join(" "),
        },
        { type: "image_url", image_url: { url: live.imageUrl } },
      ],
    });
  }

  const board = getLiveBoard();
  if (board?.imageUrl) {
    messages.push({
      role: "user",
      content: [
        {
          type: "text",
          text: [
            "App-provided combined whiteboard preview. This is NOT a student submission. Read board_ownership for the current tutor-created items and their IDs.",
            board.studentStrokeCount === 0
              ? "The student has written NOTHING on this working page. Earlier pages may contain their ink. All visible notes and diagrams are yours."
              : "Tutor-created notes and diagrams remain yours even when student ink is also present. Only the separately labeled student-ink image contains student work. Do not infer authorship from this combined image.",
            "Coordinates are normalized 0 to 1, origin at the top left.",
            "Use DRAW text for short equations as well as DRAW geometry. Leave student ink intact; never clear their work without a request.",
          ].join(" "),
        },
        { type: "image_url", image_url: { url: board.imageUrl } },
      ],
    });
    if (board.studentStrokeCount && board.studentImageUrl) messages.push({ role: "user", content: [
      { type: "text", text: "App-provided STUDENT INK ONLY, at the same coordinates as the combined board. All tutor-generated notes have been removed from this image. These are the only board marks that can be attributed to the student. Existing ink is context, not a new request." },
      { type: "image_url", image_url: { url: board.studentImageUrl } },
    ] });
  }

  return messages;
}

export async function* streamGrok(
  history: ChatMessage[],
  event?: SessionEvent | null,
  deep = false,
  signal?: AbortSignal,
  visualRepair = false,
): AsyncGenerator<string> {
  const grok = client();
  const conceptTeaching = usesConceptLesson(deep, visualRepair);
  const conceptRouting = usesConceptRouter(deep, visualRepair);
  const live = getLivePage(), board = getLiveBoard();
  const messages = conceptRouting ? conceptRoutingMessages(history, {
    document: live ? { kind: live.documentKind ?? 'pset', title: live.title, page: live.page + 1, text: live.text.slice(0, 3000) } : null,
    board: { open: board?.open ?? false, studentStrokeCount: board?.studentStrokeCount ?? null,
      tutorItems: board?.tutorItems?.map(item => ({ id: item.id, text: item.text, status: item.status })).slice(-12) ?? [] },
  }) : toApiMessages(history, event, deep);
  if (conceptTeaching) messages.push({ role: 'system', content: CONCEPT_FORMAT_GUIDANCE });
  if (visualRepair) {
    const last = history.filter(message => message.role === 'assistant').at(-1)?.content ?? '';
    const intent = parseAgentTurn(last).teaching;
    messages.push({ role: 'system', content: `Silent visual recovery for this already chosen teaching move: ${teachingTag(intent)}. Keep that move and its disclosure boundary. Compose only the missing visual for the last explanation, without advancing the hint ladder or revealing what the student was asked to supply. Return [BOARD open] and at most five compact valid DRAW commands, no speech. Use a static conceptual sketch for diagram/animation, never another animation attempt. A sketch needs meaningful geometry and clear short labels, not a formula-only note. For notes use only already established givens, learner-supplied relationships, or the specifically justified hint. Never a computed graded answer, complete solution, invented given, or scripted fixture. Do not clear/remove existing work. Use ops text, line, arrow, curve, circle, axes. Put circle positions in center:{x,y}. If it cannot be illustrated without giving away the question, return nothing.` });
  }
  const stream = await grok.chat.completions.create({
    model: deep ? GROK_DEEP_MODEL : GROK_MODEL,
    temperature: visualRepair ? 0.3 : deep ? 0.5 : 0.85,
    // Reasoning tokens count against this, so a tight cap on the deep lane
    // returns an empty message.
    // Board turns need room for a few DRAW tags plus a short spoken line.
    // 220 cut mid-tag and left the board empty.
    max_tokens: conceptRouting ? 300 : deep ? 2400 : 1800,
    stream: true,
    messages,
    ...(deep ? { reasoning_effort: "low" as const } : {}),
    ...(conceptTeaching ? { response_format: CONCEPT_RESPONSE_FORMAT } : {}),
    ...(conceptRouting ? { response_format: CONCEPT_ROUTING_FORMAT } : {}),
  }, { signal });

  let lesson = '';
  let emitted = '';
  for await (const part of stream) {
    const text = part.choices[0]?.delta?.content;
    if (!text) continue;
    if (!conceptTeaching && !conceptRouting) { yield text; continue; }
    lesson += text;
    if (conceptRouting) continue;
    const progress = conceptProgress(lesson);
    if (progress.length > emitted.length) {
      if (!progress.startsWith(emitted)) throw new Error('The concept explanation changed while loading. Please try again.');
      yield progress.slice(emitted.length);
      emitted = progress;
    }
  }
  if (conceptRouting) {
    if (process.env.NODE_ENV !== 'production') {
      const route = parseConceptRoute(lesson);
      console.info('Tutor teaching route ' + JSON.stringify({ kind: route.kind, handoff: route.handoff }));
    }
    yield conceptRoute(lesson);
  }
  if (conceptTeaching) {
    const complete = conceptResponse(lesson);
    if (!complete.startsWith(emitted)) throw new Error('The concept explanation changed while loading. Please try again.');
    yield complete.slice(emitted.length);
  }
}
