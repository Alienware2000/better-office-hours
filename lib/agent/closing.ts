import type { ChatMessage } from './tags';
export const SUMMARY_REQUEST = '[SUMMARY_REQUEST]';
export function awaitingSummary(history: ChatMessage[]) {
  const last = history.filter(m => m.role === 'assistant').at(-1);
  return Boolean(last?.content.includes(SUMMARY_REQUEST));
}
export const RECAP_FORMAT = { type: 'json_schema' as const, json_schema: { name: 'session_recap', strict: true, schema: {
  type: 'object', additionalProperties: false, required: ['stuckOn','unlockedBy','reviewNext','studentSummary','spokenText'], properties: {
    stuckOn: { type: 'string' }, unlockedBy: { type: 'string' }, studentSummary: { type: 'string' }, spokenText: { type: 'string' },
    reviewNext: { type: 'object', additionalProperties: false, required: ['documentTitle','where'], properties: { documentTitle: { type: 'string' }, where: { type: 'string' } } },
  },
} } };
export const RECAP_GUIDANCE = `The learner has been invited to summarize before closing. Write a brief recap of this actual conversation only. This is feedback, not another lesson. stuckOn identifies one actual difficulty (under 220 characters). unlockedBy names what helped or clearly says what remains unresolved (under 220 characters). Never claim mastery from tutor-created notes or a yes. spokenText gives warm, specific feedback and one next step in at most 45 words. If the student declined to summarize, respect that and do not claim they supplied an explanation. studentSummary will be replaced by their exact latest words. reviewNext must reference only an actually supplied non-solution course source title and page; otherwise both strings are empty. Do not supply new formulas, computed answers, complete solutions, or hidden solution content in ANY field, including speech. Do not include bracket tags. Return session_recap JSON only.`;
