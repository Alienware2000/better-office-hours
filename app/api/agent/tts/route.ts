import {
  ELEVENLABS_TTS_MODEL,
  ELEVENLABS_VOICE_ID,
  elevenLabsKey,
} from "@/lib/agent/elevenlabs";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json()) as { text?: string };
  const text = body.text?.trim();
  if (!text) {
    return Response.json({ error: "Missing text" }, { status: 400 });
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": elevenLabsKey(),
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: ELEVENLABS_TTS_MODEL,
      }),
    },
  );

  if (!response.ok || !response.body) {
    const detail = await response.text();
    return Response.json({ error: "TTS failed", detail }, { status: 502 });
  }

  return new Response(response.body, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
