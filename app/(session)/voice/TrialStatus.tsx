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
    <details>
      <summary><span className="trial-indicator" aria-hidden /><span>Local preview</span><span className="trial-model">Opus low</span><span className="trial-latency">{latency === null ? 'Session details' : `${(latency / 1000).toFixed(1)}s to audio`}</span><svg aria-hidden viewBox="0 0 16 16"><path d="m4 6 4 4 4-4"/></svg></summary>
      <div className="trial-details">
        <p>{latency === null ? 'Response timing appears after your first spoken turn.' : `Last spoken response: ${(latency / 1000).toFixed(1)} seconds from speech ending to audio.`}</p>
        <p>Listening reopens after spoken turns unless you mute. Mic off only stops input. Interrupt or Escape stops the response. Typed messages use the same voice and whiteboard.</p>
      </div>
    </details>
  </aside>;
}
