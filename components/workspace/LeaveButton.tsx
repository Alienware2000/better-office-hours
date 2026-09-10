"use client";

export function LeaveButton({ onLeave }: { onLeave: () => void }) {
  return (
    <button
      type="button"
      className="desk-button desk-leave"
      onClick={onLeave}
      title="Leave the workspace"
      aria-keyshortcuts="Escape"
    >
      <span aria-hidden className="desk-leave-mark">
        ←
      </span>
      Leave
    </button>
  );
}
