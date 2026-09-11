import { asSessionEvent } from "@/lib/agent/events";
import { GROK_DEEP_MODEL, GROK_MODEL, streamGrok } from "@/lib/agent/grok";
import { setLivePage, type LivePage } from "@/lib/pdf/live-page";
import { asLiveBoard, setLiveBoard } from "@/lib/whiteboard/live-board";
import type { ChatMessage } from "@/lib/agent/tags";

export const dynamic = "force-dynamic";

function asMessages(body: unknown): ChatMessage[] {
  if (!body || typeof body !== "object" || !("messages" in body)) return [];
  const messages = (body as { messages?: unknown }).messages;
  if (!Array.isArray(messages)) return [];
  return messages.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const role = (item as { role?: string }).role;
    const content = (item as { content?: unknown }).content;
    if (role !== "user" && role !== "assistant" && role !== "system") return [];
    if (typeof content !== "string") return [];
    return [{ role, content }];
  });
}

function asLivePage(body: unknown): LivePage | null {
  if (!body || typeof body !== "object" || !("livePage" in body)) return null;
  const live = (body as { livePage?: unknown }).livePage;
  if (!live || typeof live !== "object") return null;
  const page = live as Partial<LivePage>;
  if (typeof page.psetId !== "string" || typeof page.imageUrl !== "string") {
    return null;
  }
  return {
    psetId: page.psetId,
    documentKind: page.documentKind === "notes" ? "notes" : "pset",
    title: typeof page.title === "string" ? page.title : "",
    page: typeof page.page === "number" ? page.page : 0,
    pages: typeof page.pages === "number" ? page.pages : 1,
    imageUrl: page.imageUrl,
    text: typeof page.text === "string" ? page.text : "",
    questionRegions: Array.isArray(page.questionRegions)
      ? page.questionRegions
      : [],
    studentMarks: typeof page.studentMarks === "number" ? page.studentMarks : 0,
  };
}

export async function POST(req: Request) {
  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const history = asMessages(body);
  const event = asSessionEvent(
    body && typeof body === "object" ? (body as { event?: unknown }).event : null,
  );
  const deep: boolean =
    !!body && typeof body === "object" && (body as { deep?: unknown }).deep === true;
  setLivePage(asLivePage(body));
  setLiveBoard(
    body && typeof body === "object"
      ? asLiveBoard((body as { liveBoard?: unknown }).liveBoard)
      : null,
  );
  const model = deep ? GROK_DEEP_MODEL : GROK_MODEL;
  const id = "chatcmpl-boh";
  const created = Math.floor(Date.now() / 1000);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };
      try {
        for await (const content of streamGrok(history, event, deep)) {
          send({
            id,
            object: "chat.completion.chunk",
            created,
            model,
            choices: [{ index: 0, delta: { content }, finish_reason: null }],
          });
        }
        send({
          id,
          object: "chat.completion.chunk",
          created,
          model,
          choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
        });
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Grok request failed";
        send({ error: { message } });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
