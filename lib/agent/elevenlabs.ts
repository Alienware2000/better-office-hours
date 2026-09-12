// Jessica: warm and conversational. The previous voice was tuned for narration.
export const ELEVENLABS_VOICE_ID = "cgSgspJ2msm6clMCkdW9";
// Conversational v3 verified against the funded account. Flash remains an explicit rollback.
export const ELEVENLABS_TTS_MODEL = process.env.ELEVENLABS_TTS_MODEL === "eleven_flash_v2_5"
  ? "eleven_flash_v2_5" : "eleven_v3_conversational";
export const ELEVENLABS_STT_MODEL = "scribe_v2";

export function elevenLabsKey(): string {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY is not set");
  return key;
}
