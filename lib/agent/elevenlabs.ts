export const ELEVENLABS_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb";
export const ELEVENLABS_TTS_MODEL = "eleven_turbo_v2_5";
export const ELEVENLABS_STT_MODEL = "scribe_v1";

export function elevenLabsKey(): string {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY is not set");
  return key;
}
