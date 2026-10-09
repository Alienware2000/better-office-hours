import { trialEnabled, TRIAL_PROFILE } from './trial';

// Server-owned selection. A missing key never silently changes providers.
export function tutorProvider(): 'opus' | 'grok' {
  if (trialEnabled()) return 'opus';
  const selected = process.env.BOH_TUTOR_PROVIDER?.trim() || 'opus';
  if (selected !== 'opus' && selected !== 'grok') throw new Error('BOH_TUTOR_PROVIDER must be opus or grok');
  return selected;
}

export function tutorModel(deep = false): string {
  return tutorProvider() === 'opus' ? TRIAL_PROFILE.model : deep ? 'grok-4.6' : 'grok-4.20-0309-non-reasoning';
}

export function tutorConfigured(): boolean {
  return Boolean(tutorProvider() === 'opus' ? process.env.OPENROUTER_API_KEY : process.env.XAI_API_KEY);
}

// Opus does not support temperature. Keep routing, lessons, repairs and recaps
// on the selected provider, with sufficient room for low-effort reasoning.
export function tutorOptions(deep = false, visualRepair = false) {
  return tutorProvider() === 'opus' ? {
    provider: TRIAL_PROFILE.provider,
    max_tokens: TRIAL_PROFILE.maxTokens,
    reasoning: { effort: TRIAL_PROFILE.effort, exclude: true },
  } : {
    temperature: visualRepair ? 0.3 : deep ? 0.5 : 0.85,
    max_tokens: visualRepair ? 1800 : deep ? 2400 : 300,
    ...(deep ? { reasoning_effort: 'low' as const } : {}),
  };
}
