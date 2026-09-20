'use client';

import { useId } from 'react';

export function TutorInput({ open, value, busy, micOff, canEnableMic, onOpen, onChange, onSend, onMic }: {
  open: boolean; value: string; busy: boolean; micOff: boolean; canEnableMic: boolean;
  onOpen: (open: boolean) => void; onChange: (value: string) => void;
  onSend: () => void; onMic: () => void;
}) {
  const id = useId();
  return <div className="tutor-input">
    <div className="tutor-input-controls">
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => onOpen(!open)}>{open ? 'Hide typing' : 'Type instead'}</button>
      <button type="button" aria-pressed={micOff} disabled={micOff && !canEnableMic} onClick={onMic}
        title="Microphone only. This does not stop the tutor's response.">{micOff ? 'Turn mic on' : 'Mute mic'}</button>
      {micOff && <span>Mic off</span>}
    </div>
    {open && <form id={id} onSubmit={event => { event.preventDefault(); if (value.trim() && !busy) onSend(); }}>
      <label htmlFor={`${id}-text`}>Message your tutor</label>
      <textarea id={`${id}-text`} value={value} rows={2} maxLength={2000} placeholder="Ask a question or share your thinking…"
        onChange={event => onChange(event.target.value)}
        onKeyDown={event => {
          if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault(); if (value.trim() && !busy) onSend();
          }
        }} />
      <div className="tutor-input-footer"><small>{busy ? 'You can draft while the tutor responds.' : 'Same voice and whiteboard. Enter to send; Shift+Enter for a new line.'}</small>
        <button type="submit" disabled={!value.trim() || busy}>Send</button></div>
    </form>}
  </div>;
}
