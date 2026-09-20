import { useEffect, useState } from 'react';

export function ResponseStatus({ label, busy, onActivate }: { label: string; busy: boolean; onActivate?: () => void }) {
  return (
    <div className="response-status">
      {onActivate && label === 'Tap to speak'
        ? <button type="button" className="orb-status orb-start" onClick={onActivate}>Tap to speak</button>
        : <p className="orb-status" role="status">{label}</p>}
      <div className="response-activity">
        {busy && <WaitingActivity />}
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
      <span className="response-dots" aria-hidden="true"><i /><i /><i /></span>
      {slow && <span className="response-delay" role="status">Taking a little longer</span>}
    </>
  );
}
