// A structured decision prevents the fast model from silently skipping THINK
// and trying to teach an unchecked concept itself. No topic-word matching.
export const CONCEPT_ROUTING_FORMAT = {
  type: 'json_schema' as const,
  json_schema: { name: 'concept_route', strict: true, schema: {
    type: 'object', additionalProperties: false, required: ['kind', 'speech'],
    properties: {
      kind: { type: 'string', enum: ['conversation', 'definition', 'lesson', 'check_work'] },
      speech: { type: 'string' },
    },
  } },
};

export const CONCEPT_ROUTING_GUIDANCE = `Choose the kind of help before answering. Return only concept_route JSON. A request to understand, visualize, or explain an idea or situation is lesson. An attempted answer, equation, numerical work, or claim to evaluate is check_work. For either, speech must be only one brief natural acknowledgement of the request, with no definition, diagnosis, question, formula, or explanation. The reasoning tutor will teach and draw next. Conversation is a greeting or a clarification of what to work on. Definition is only a specifically requested brief definition with no explanation or visualization needed; speech can supply that concise definition. Do not classify a learner saying they do not understand a concept as definition. This is a semantic decision across subjects, not a keyword rule. Do not generate drawing commands or bracket tags in this routing response.`;

export function conceptRoute(raw: string): string {
  const value = JSON.parse(raw) as { kind?: string; speech?: string };
  if (!value || !['conversation', 'definition', 'lesson', 'check_work'].includes(value.kind ?? '') || typeof value.speech !== 'string' || !value.speech.trim()) {
    throw new Error('The tutor could not prepare a response. Please try again.');
  }
  const speech = value.speech.replace(/\[[^\]\r\n]*\]/g, '').trim();
  return speech + (value.kind === 'lesson' || value.kind === 'check_work' ? ' [THINK]' : '');
}
