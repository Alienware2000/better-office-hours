import { normalizeSpokenText } from "@/lib/agent/spoken-text";
import {
  ELEVENLABS_TTS_MODEL,
  ELEVENLABS_VOICE_ID,
  elevenLabsKey,
} from "@/lib/agent/elevenlabs";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json()) as { text?: string; previousText?: string };
  const text = normalizeSpokenText(body.text ?? "");
  if (!text) {
    return Response.json({ error: "Missing text" }, { status: 400 });
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}?output_format=mp3_44100_128`,
    {
      method: "POST",
      signal: req.signal,
      headers: {
        "xi-api-key": elevenLabsKey(),
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: ELEVENLABS_TTS_MODEL,
        // Conversational v3 rejects previous_text, including on a valid second sentence.
        previous_text: ELEVENLABS_TTS_MODEL === "eleven_v3_conversational"
          ? undefined : normalizeSpokenText(body.previousText ?? "") || undefined,
        voice_settings: ELEVENLABS_TTS_MODEL === "eleven_v3_conversational" ? { stability: 1 } : {
          stability: 0.42,
          similarity_boost: 0.75,
          style: 0.12,
          use_speaker_boost: true,
          speed: 0.98,
        },
      }),
    },
  );

  if (!response.ok || !response.body) {
    const detail = await response.text();
    const quota = detail.includes('quota_exceeded');
    let code = 'upstream_error';
    try { code = JSON.parse(detail).detail?.code ?? code; } catch { /* Non-JSON provider response. */ }
    console.error('Voice synthesis rejected', { status: response.status, code, model: ELEVENLABS_TTS_MODEL });
    return Response.json({ error: quota
      ? "Voice credits are exhausted. Add ElevenLabs quota to continue."
      : "Voice synthesis failed. Please try again." }, { status: quota ? 429 : 502 });
  }

  return new Response(response.body, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
      "X-Voice-Model": ELEVENLABS_TTS_MODEL,
    },
  });
}
