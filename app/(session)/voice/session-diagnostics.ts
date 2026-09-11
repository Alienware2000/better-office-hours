import type { SessionDiagnostic } from './saved-sessions';

export function recordSessionDiagnostic(detail: Omit<SessionDiagnostic, 'at'>) {
  if (typeof window === 'undefined' || typeof CustomEvent === 'undefined') return;
  window.dispatchEvent(new CustomEvent('boh:session-diagnostic', { detail: { ...detail, at: new Date().toISOString() } }));
}
