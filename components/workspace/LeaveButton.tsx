"use client";

export function LeaveButton({ onLeave }: { onLeave: () => void }) {
  return (
    <button
      type="button"
      className="desk-button desk-leave"
      onClick={onLeave}
      title="Save this session and return to the start"
    >
      <span aria-hidden className="desk-leave-mark">
        ←
      </span>
      Leave
    </button>
  );
}
