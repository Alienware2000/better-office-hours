import { normalizeSpokenText } from "@/lib/agent/spoken-text";
import { voiceProviderError } from '@/lib/agent/voice-error';
import {
  ELEVENLABS_TTS_MODEL,
  ELEVENLABS_VOICE_ID,
  elevenLabsKey,
} from "@/lib/agent/elevenlabs";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const text = normalizeSpokenText(typeof body?.text === 'string' ? body.text : '');
  if (!text) {
    return Response.json({ error: "Missing text" }, { status: 400 });
  }

  let key: string;
  try {
    key = elevenLabsKey();
  } catch {
    return Response.json({ error: 'The voice service is not configured.', code: 'voice_not_configured', retryable: false }, { status: 503 });
  }
  let response: Response;
  try {
    response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}?output_format=mp3_44100_128`,
      {
        method: "POST",
        signal: req.signal,
        headers: {
          "xi-api-key": key,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: ELEVENLABS_TTS_MODEL,
          // Conversational v3 rejects previous_text, including on a valid second sentence.
          previous_text: ELEVENLABS_TTS_MODEL === "eleven_v3_conversational"
            ? undefined : normalizeSpokenText(typeof body.previousText === 'string' ? body.previousText : '') || undefined,
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
  } catch {
    if (req.signal.aborted) return new Response(null, { status: 499 });
    console.error('Voice synthesis connection failed');
    return Response.json({ error: 'Could not reach the voice service. Please try again.', code: 'voice_connection_failed', retryable: true }, { status: 503 });
  }

  if (!response.ok || !response.body) {
    const failure = voiceProviderError(response.status, await response.json().catch(() => null));
    console.error('Voice synthesis rejected ' + JSON.stringify({ status: response.status, code: failure.code, model: ELEVENLABS_TTS_MODEL }));
    const { status, ...body } = failure;
    return Response.json(body, { status });
  }

  return new Response(response.body, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
      "X-Voice-Model": ELEVENLABS_TTS_MODEL,
    },
  });
}
