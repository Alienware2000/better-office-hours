// Vocabulary hints, not an expected answer. Never prompt STT with numbers or
// completed sentences that could overwrite what the student actually said.
const ordinary = new Set('because between through before after should would could which there their where these those please question answer problem explain actually already something anything everything another different together written upload assigned following information instruction homework'.split(' '));
export function transcriptionKeyterms(tutor: string, page: string): string[] {
  const context = `${tutor.slice(-1200)} ${page.slice(0, 4000)}`;
  const terms = context.match(/\b[A-Za-z][A-Za-z-]{6,29}\b/g) ?? [];
  return [...new Set(terms.map(term => term.toLowerCase()))].filter(term => !ordinary.has(term)).slice(0, 24);
}

export function asKeyterms(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return [...new Set(input.filter((term): term is string => typeof term === 'string' && /^[a-zA-Z][a-zA-Z -]{1,48}$/.test(term) && term.split(/\s+/).length <= 5))].slice(0, 24);
}
