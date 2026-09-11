// Expose useful categories, never arbitrary provider messages or request text.
export function voiceProviderError(status: number, payload: unknown) {
  const detail = payload && typeof payload === 'object' && 'detail' in payload ? payload.detail : null;
  const fields = detail && typeof detail === 'object' ? detail as Record<string, unknown> : {};
  const codes = [fields.status, fields.code].filter((value): value is string => typeof value === 'string');
  const has = (...known: string[]) => codes.some(code => known.includes(code));
  // Specific provider categories take precedence over broad authentication codes.
  if (has('quota_exceeded')) return { status: 429, code: 'quota_exceeded', retryable: false,
    error: 'Voice credits are exhausted. Add ElevenLabs quota to continue.' };
  if (has('missing_permissions', 'insufficient_permissions') || status === 403) return { status: 503, code: 'voice_access_denied', retryable: false,
    error: 'The ElevenLabs connection does not have permission to generate speech.' };
  if (has('voice_not_found', 'model_not_found')) return { status: 503, code: 'voice_configuration_error', retryable: false,
    error: 'The selected voice or speech model is unavailable. Update the voice service connection.' };
  if (has('invalid_api_key', 'unauthorized', 'authentication_error') || status === 401) {
    return { status: 503, code: 'invalid_api_key', retryable: false,
      error: 'ElevenLabs rejected the API key. Update the voice service connection to continue.' };
  }
  if (status === 429 || has('too_many_concurrent_requests', 'system_busy', 'rate_limit_exceeded')) return { status: 503, code: 'voice_busy', retryable: true,
    error: 'The voice service is busy. Please try again in a moment.' };
  return { status: 502, code: 'voice_provider_error', retryable: status >= 500,
    error: 'The voice service could not generate this response. Please try again.' };
}
