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

export function buildGrokMessages(
  history: ChatMessage[],
  event?: SessionEvent | null,
  deep = false,
): ChatMessage[] {
  const live = getLivePage();
  const extra = live
    ? `\n<pset_page>${live.page + 1}</pset_page>\n<pset_text>${live.text.slice(0, 4000)}</pset_text>\n<question_regions>${live.questionRegions
        .map((region) => `${region.label}@${region.bbox.x.toFixed(2)},${region.bbox.y.toFixed(2)}`)
        .join("; ")}</question_regions>`
    : "";
  const context = buildContextBlock(
    live
      ? {
          psetTitle: live.title || "the PDF the student uploaded",
          page: live.page + 1,
          pages: live.pages,
          mode: "pset",
        }
      : {},
  );
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
  const system = `${loadTutorPrompt("your course")}\n\n${context}${extra}${voice}${eventBlock}${lane}`;
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
          text: `This is page ${live.page + 1} of the problem set, on screen right now. Coordinates are normalized 0 to 1. Emit [POINT page=${live.page + 1} x=... y=...] before you explain a spot on it.`,
        },
        { type: "image_url", image_url: { url: live.imageUrl } },
      ],
    });
  }

  return messages;
}

export async function* streamGrok(
  history: ChatMessage[],
  event?: SessionEvent | null,
  deep = false,
): AsyncGenerator<string> {
  const grok = client();
  const stream = await grok.chat.completions.create({
    model: deep ? GROK_DEEP_MODEL : GROK_MODEL,
    temperature: deep ? 0.5 : 0.85,
    // Reasoning tokens count against this, so a tight cap on the deep lane
    // returns an empty message.
    max_tokens: deep ? 1400 : 220,
    stream: true,
    messages: toApiMessages(history, event, deep),
    ...(deep ? { reasoning_effort: "low" as const } : {}),
  });

  for await (const part of stream) {
    const text = part.choices[0]?.delta?.content;
    if (text) yield text;
  }
}
