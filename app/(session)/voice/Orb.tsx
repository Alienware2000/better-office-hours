import type { OrbState } from "./constants";
import "./orb.css";

export function Orb({
  state,
  level,
  paused,
  onInterrupt,
}: {
  state: OrbState;
  level: number;
  paused: boolean;
  onInterrupt: () => void;
}) {
  const scale = 1 + Math.min(0.22, level * 0.45);
  const label = paused
    ? "Start the tutor"
    : state === "speaking" || state === "thinking"
      ? "Stop the tutor"
      : "Pause the tutor";

  return (
    <button
      type="button"
      className="orb-control"
      aria-label={label}
      onClick={onInterrupt}
    >
      <span
        aria-hidden
        className={[
          "orb",
          state === "idle" && "orb-idle",
          state === "listening" && "orb-listening",
          state === "thinking" && "orb-thinking",
          state === "speaking" && "orb-speaking",
        ]
          .filter(Boolean)
          .join(" ")}
        style={
          state === "listening" ? { transform: `scale(${scale})` } : undefined
        }
      />
    </button>
  );
}
