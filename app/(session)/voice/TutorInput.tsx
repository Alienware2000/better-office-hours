'use client';

import { useEffect, useId, useRef } from 'react';

export function TutorInput({ open, value, busy, micOff, canEnableMic, onOpen, onChange, onSend, onMic }: {
  open: boolean; value: string; busy: boolean; micOff: boolean; canEnableMic: boolean;
  onOpen: (open: boolean) => void; onChange: (value: string) => void;
  onSend: () => void; onMic: () => void;
}) {
  const id = useId();
  const input = useRef<HTMLTextAreaElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(open);
  useEffect(() => {
    if (open) input.current?.focus();
    else if (wasOpen.current) toggle.current?.focus();
    wasOpen.current = open;
  }, [open]);
  const microphone = <button type="button" className="input-mic" aria-label={micOff ? 'Turn mic on' : 'Mute mic'}
    aria-pressed={micOff} disabled={micOff && !canEnableMic} onClick={onMic}
    title="Microphone only. Your tutor keeps responding.">
    <svg aria-hidden viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 10v2a6 6 0 0 0 12 0v-2M12 18v3M9 21h6"/>{micOff && <path d="m3 3 18 18"/>}</svg>
    <span>{micOff ? 'Mic off' : 'Mic on'}</span>
  </button>;
  return <div className={`tutor-input${open ? ' is-open' : ''}`}>
    {!open && <div className="tutor-input-controls">
      <button ref={toggle} type="button" aria-expanded={false} aria-controls={id} onClick={() => onOpen(true)}>
        <svg aria-hidden viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M7 9h.01M11 9h.01M15 9h2M7 12h.01M11 12h.01M15 12h2M7 15h10"/></svg>
        Type a message
      </button>
      <span className="input-divider" aria-hidden />
      {microphone}
    </div>}
    {open && <form id={id} onSubmit={event => { event.preventDefault(); if (value.trim() && !busy) onSend(); }}>
      <textarea ref={input} id={`${id}-text`} aria-label="Message your tutor" aria-describedby={`${id}-hint`} value={value} rows={2} maxLength={2000} placeholder="What are you working on?"
        onChange={event => onChange(event.target.value)}
        onKeyDown={event => {
          if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault(); if (value.trim() && !busy) onSend();
          }
        }} />
      <div className="tutor-input-footer">
        {microphone}
        <small id={`${id}-hint`}>{busy ? 'Send when the tutor finishes' : 'Enter to send · Shift+Enter for a new line'}</small>
        <button type="button" className="input-icon" aria-label="Hide typing" aria-expanded={true} aria-controls={id} title="Hide typing" onClick={() => onOpen(false)}>
          <svg aria-hidden viewBox="0 0 24 24"><path d="m6 6 12 12M6 18 18 6"/></svg>
        </button>
        <button type="submit" className="input-send input-icon" aria-label="Send message" title="Send message" disabled={!value.trim() || busy}>
          <svg aria-hidden viewBox="0 0 24 24"><path d="M12 19V5m-6 6 6-6 6 6"/></svg>
        </button>
      </div>
    </form>}
  </div>;
}
