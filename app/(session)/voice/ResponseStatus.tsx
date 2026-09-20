import { useEffect, useState } from 'react';

export type ResponsePresentation = {
  tone: 'ready' | 'listening' | 'thinking' | 'speaking' | 'connecting' | 'error';
  label: string;
  hint: string;
};

export function ResponseStatus({ label, hint, tone }: ResponsePresentation) {
  return (
    <div className={`response-status is-${tone}`}>
      <p className="orb-status" role="status">{tone !== 'ready' && <span className="state-signal" aria-hidden><i/><i/><i/></span>}{label}</p>
      {tone !== 'ready' && <p className="response-hint">{hint}</p>}
      <div className="response-activity">
        {tone === 'thinking' && <WaitingActivity />}
      </div>
    </div>
  );
}

function WaitingActivity() {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 8000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <>
      {slow && <span className="response-delay" role="status">Taking a little longer</span>}
    </>
  );
}
