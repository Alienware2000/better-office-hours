import type { OrbState } from "./constants";
import "./orb.css";

export function Orb({
  state,
  level,
}: {
  state: OrbState;
  level: number;
}) {
  const scale = 1 + Math.min(0.22, level * 0.45);
  return (
    <div
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
      style={state === "listening" ? { transform: `scale(${scale})` } : undefined}
    />
  );
}
