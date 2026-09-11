import {
  ELEVENLABS_STT_MODEL,
  elevenLabsKey,
} from "@/lib/agent/elevenlabs";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Missing audio file" }, { status: 400 });
  }

  const outbound = new FormData();
  outbound.set("model_id", ELEVENLABS_STT_MODEL);
  outbound.set("file", file, file.name || "speech.webm");

  const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    signal: req.signal,
    headers: { "xi-api-key": elevenLabsKey() },
    body: outbound,
  });

  if (!response.ok) {
    const detail = await response.text();
    return Response.json(
      { error: detail.includes("quota_exceeded") ? "Voice credits are exhausted. Add ElevenLabs quota to continue." : "Transcription failed. Please try again." },
      { status: 502 },
    );
  }

  const data = (await response.json()) as { text?: string };
  return Response.json({ text: (data.text ?? "").trim() });
}
