'use client';

import { useEffect, useState } from 'react';
import type { SessionDiagnostic } from './saved-sessions';

export function TrialStatus() {
  const [latency, setLatency] = useState<number | null>(null);
  useEffect(() => {
    const record = (event: Event) => {
      const detail = (event as CustomEvent<SessionDiagnostic>).detail;
      if (detail.kind === 'response_latency' && typeof detail.elapsedMs === 'number') setLatency(detail.elapsedMs);
    };
    window.addEventListener('boh:session-diagnostic', record);
    return () => window.removeEventListener('boh:session-diagnostic', record);
  }, []);
  return <aside className="trial-status" aria-label="Local voice trial">
    <strong>Voice trial · Opus low</strong>
    <span>{latency === null ? 'Speak to measure your first response.' : `Last response: ${(latency / 1000).toFixed(1)}s from speech ending to audio.`}</span>
    <small>Tap to speak or choose Type instead. Listening reopens after spoken turns unless you mute. Mute mic leaves the tutor running; Interrupt or Escape stops the response.</small>
  </aside>;
}
