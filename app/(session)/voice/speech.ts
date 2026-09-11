// STT often returns a bracketed status instead of words. Those are not turns.
export function isJunkSpeech(text: string) {
  const said = text.trim();
  if (!said) return true;
  if (/^\[[^\]]+\]$/.test(said)) return true;
  if (/^background noise[.!]?$/i.test(said)) return true;
  return false;
}

export function isResumePsetPhrase(text: string) {
  return /^(homework|hw|p-?set|problem set|assignment)[.!?]?$/i.test(text.trim());
}

export function isResumeConceptPhrase(text: string) {
  return /^(explain a concept|a concept|concept)[.!?]?$/i.test(text.trim());
}

// Put this paper away and go back to the drop zone. Not a notebook library.
export function isPutAwayPsetPhrase(text: string) {
  const said = text.toLowerCase();
  if (/\b(?:not|never|don't|don’t)\b/.test(said)) return false;
  return (
    /\b(remove|close|put away|take away)\b.*\b(pdf|pset|problem set|homework|document|file)\b/.test(
      said,
    ) ||
    /\b(different|another|new)\b.*\b(pdf|pset|problem set|homework|assignment)\b/.test(said)
  );
}
