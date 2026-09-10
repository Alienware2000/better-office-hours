import OpenAI from "openai";
import { buildContextBlock } from "@/lib/agent/context";
import { loadTutorPrompt } from "@/lib/agent/prompt";
import type { ChatMessage } from "@/lib/agent/tags";

const MODEL = "grok-4.6";

function client() {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error("XAI_API_KEY is not set");
  }
  return new OpenAI({ apiKey, baseURL: "https://api.x.ai/v1" });
}

export function buildGrokMessages(history: ChatMessage[]): ChatMessage[] {
  const courseName = "PHYS 180";
  const system = `${loadTutorPrompt(courseName)}\n\n${buildContextBlock()}`;
  const rest = history.filter((message) => message.role !== "system");
  return [{ role: "system", content: system }, ...rest];
}

export async function* streamGrok(history: ChatMessage[]): AsyncGenerator<string> {
  const grok = client();
  const stream = await grok.chat.completions.create({
    model: MODEL,
    temperature: 0.6,
    max_tokens: 220,
    stream: true,
    messages: buildGrokMessages(history) as OpenAI.Chat.ChatCompletionMessageParam[],
  });

  for await (const part of stream) {
    const text = part.choices[0]?.delta?.content;
    if (text) yield text;
  }
}
