// STT often returns a bracketed status instead of words. Those are not turns.
export function isJunkSpeech(text: string) {
  const said = text.trim();
  if (!said) return true;
  if (/^\[[^\]]+\]$/.test(said)) return true;
  if (/background noise/i.test(said)) return true;
  return false;
}

export function isResumePsetPhrase(text: string) {
  return /^(homework|hw|p-?set|problem set|assignment)[.!?]?$/i.test(text.trim());
}

export function isResumeConceptPhrase(text: string) {
  return /^(explain a concept|a concept|concept)[.!?]?$/i.test(text.trim());
}
