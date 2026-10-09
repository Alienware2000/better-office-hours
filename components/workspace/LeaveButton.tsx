"use client";

export function LeaveButton({ onLeave }: { onLeave: () => void }) {
  return (
    <button
      type="button"
      className="desk-leave"
      onClick={onLeave}
      title="Save this session and return to the start"
    >
      <svg className="desk-leave-mark" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m14 6-6 6 6 6" />
      </svg>
      <span>Back to start</span>
    </button>
  );
}
