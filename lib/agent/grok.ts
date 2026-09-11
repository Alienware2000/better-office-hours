import OpenAI from "openai";
import {
  buildContextBlock,
  buildVoiceNote,
  DEEP_TURN,
  WHEN_TO_THINK,
} from "@/lib/agent/context";
import { describeEvent, type SessionEvent } from "@/lib/agent/events";
import { loadTutorPrompt } from "@/lib/agent/prompt";
import { getLivePage } from "@/lib/pdf/live-page";
import { getLiveBoard } from "@/lib/whiteboard/live-board";
import type { ChatMessage } from "@/lib/agent/tags";

// Fast lane. grok-4.6 reasons before it answers, which put the first spoken
// word 26s out. This non-reasoning model answers in about half a second and
// still reads the pset page image, so the pointer keeps working.
export const GROK_MODEL = "grok-4.20-0309-non-reasoning";

// Reasoning lane, for turns where being wrong costs the student. Measured at
// 7.4s against the real prompt, versus 26s at default effort. Its wait is
// covered by the fast lane's lead-in audio.
export const GROK_DEEP_MODEL = "grok-4.6";

function client() {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error("XAI_API_KEY is not set");
  }
  return new OpenAI({ apiKey, baseURL: "https://api.x.ai/v1" });
}

export function wantsVisualHelp(history: ChatMessage[]) {
  const latest = history.filter(message => message.role === 'user').at(-1)?.content ?? '';
  return /confus|can(?:not|'t|’t) (?:picture|visuali[sz]e|see)|don(?:'t|’t) (?:get|understand)|draw|diagram|animat|show me|watch|equation|formula|write|units|notation|forgot|forget|remember|remind|given|variables|set.?up/i.test(latest);
}

const BOARD_NARRATION = `\n<board_narration>Compose one visual beat per turn. Quiet setup, say what to watch, then emit DRAW or ANIM; deliberately reveal, hold, and ask exactly one question. Use the student's given numbers to shape the diagram, never display a requested graded answer, a full solution, or computed result labels. When explaining a setup with multiple given quantities, put two or three short aligned lines on the board using only the stated givens, and mark missing quantities with a question mark. Do not make the student hold a spoken list in memory. When referring to text on the PDF, use POINT or HIGHLIGHT on that exact region. Never invent a coordinate or a missing given. Use the board like a shared teaching surface, not just a graph plotter: one general equation, a short symbolic setup, or a blank for the student can be the visual beat. When referring to an equation, write it with DRAW text rather than asking the student to imagine it. For example [DRAW {"op":"text","id":"relation","at":{"x":0.5,"y":0.3},"text":"F = ma","size":"m"}]. Use Unicode notation such as v₀, Δx, θ, ² and ×, not LaTeX commands. Equations must fit on one short line; place related lines with generous spacing, never a complete graded solution. Invite the student to predict or complete a small part, then wait while they write. Inspect their board image on the next turn and respond to their actual work. Labels have at most six words; equation lines at most 64 characters. Use ink for structure, accent for the changing quantity, muted for guides, warn sparingly. Leave generous margins. Use tick-less axes. For motion use declarative [ANIM {...}] only, never ANIM_PROGRAM. Schema: {id,duration,shapes:[...]}, seconds under 8; kinds: axes {id,origin:{x,y},xLabel,yLabel}; arrow {id,label,keyframes:[{t,from:{x,y},to:{x,y},color,opacity}]}; dot {id,keyframes:[{t,at:{x,y},r,opacity}]}; path {id,points:[{x,y},...],keyframes:[{t,drawn,opacity}]}; text {id,text,keyframes:[{t,at:{x,y},opacity}]}; bar {id,keyframes:[{t,at:{x,y},w,h,opacity}]}. Every ANIM shape needs kind. DRAW uses op equal to the shape name (arrow, axes, line, curve, circle, text), never op draw or a kind field. Keyframes have increasing t and optional ease linear, inOut, out. Points normalized 0..1, y downward. Arrow endpoints or dot at can use {follow:{pathId,offset:{x,y}}} to ride the path's drawn progress. Include a 0.65s initial hold and a final hold. Keep the spec compact, at most five shapes. [ANIM focus=id] signals one shape; [ANIM resume] continues after interruption. Use DRAW for a static diagram; ANIM when change over time is the idea.</board_narration>`;

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
        `<question_regions>${live.questionRegions
          .map(
            (region) =>
              `${region.label}: x=${region.bbox.x.toFixed(3)} y=${region.bbox.y.toFixed(3)} w=${region.bbox.w.toFixed(3)} h=${region.bbox.h.toFixed(3)}`,
          )
          .join("; ")}</question_regions>`,
      ].join("\n")}`
    : "";
  const boardNote = board?.open
    ? "\n<board>The whiteboard is open. Coordinates are normalized 0 to 1, origin at the top left. Emit [BOARD open] then one JSON [DRAW ...] per stroke as you name it, for example [DRAW {\"op\":\"axes\",\"id\":\"axes\",\"origin\":{\"x\":0.2,\"y\":0.78},\"xLabel\":\"x\",\"yLabel\":\"y\"}] then [DRAW {\"op\":\"arrow\",\"id\":\"v\",\"from\":{\"x\":0.2,\"y\":0.78},\"to\":{\"x\":0.55,\"y\":0.35},\"label\":\"v\",\"color\":\"accent\"}]. ops: clear, axes, arrow, line, curve, circle, text, highlight, remove.</board>"
    : "\n<board>When a picture helps, emit [BOARD open] then one JSON [DRAW {\"op\":\"arrow\",\"id\":\"v\",\"from\":{\"x\":0.2,\"y\":0.7},\"to\":{\"x\":0.6,\"y\":0.3},\"label\":\"v\"}] per stroke. Coordinates are normalized 0 to 1, origin at the top left.</board>";
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
  const visual = wantsVisualHelp(history)
    ? '\n<visual_help>The student wants help picturing the idea. If a diagram, relationship, or symbolic equation helps, open the board and compose one small visual with DRAW, or ANIM for change over time. Preserve the hint ladder and prediction before explanation. Do not merely promise to draw. Use general symbolic relationships or parallel examples, not a graded solution.</visual_help>' : '';
  const system = `${loadTutorPrompt("your course")}\n\n${context}${extra}${boardNote}${BOARD_NARRATION}${visual}${voice}${eventBlock}${materialNote}${lane}`;
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
            `Coordinates refer to the full page image, not the browser viewport or zoom. Use supplied question regions for a problem heading; inspect the image for a specific equation. If you cannot locate it reliably, ask instead of guessing. Use HIGHLIGHT page=... x=... y=... w=... h=... for a small relevant region. Coordinates are normalized 0 to 1. Emit [POINT page=${live.page + 1} x=... y=...] before you explain a spot on it.`,
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
            "This is the whiteboard right now.",
            board.studentShapesSince
              ? "The student drew on it; their ink is in the image. Use these marks as context for their current request; existing ink is not a new request to speak."
              : "Your earlier strokes are in the image.",
            "Coordinates are normalized 0 to 1, origin at the top left.",
            "Use DRAW text for short equations as well as DRAW geometry. Leave student ink intact; never clear their work without a request.",
          ].join(" "),
        },
        { type: "image_url", image_url: { url: board.imageUrl } },
      ],
    });
  }

  return messages;
}

export async function* streamGrok(
  history: ChatMessage[],
  event?: SessionEvent | null,
  deep = false,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const grok = client();
  const stream = await grok.chat.completions.create({
    model: deep ? GROK_DEEP_MODEL : GROK_MODEL,
    temperature: deep ? 0.5 : 0.85,
    // Reasoning tokens count against this, so a tight cap on the deep lane
    // returns an empty message.
    // Board turns need room for a few DRAW tags plus a short spoken line.
    // 220 cut mid-tag and left the board empty.
    max_tokens: deep ? 2400 : wantsVisualHelp(history) ? 1800 : 900,
    stream: true,
    messages: toApiMessages(history, event, deep),
    ...(deep ? { reasoning_effort: "low" as const } : {}),
  }, { signal });

  for await (const part of stream) {
    const text = part.choices[0]?.delta?.content;
    if (text) yield text;
  }
}
