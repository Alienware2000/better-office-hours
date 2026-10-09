import type { OrbState } from "./constants";
import "./orb.css";

export function Orb({
  state,
  level,
  paused,
  recording = false,
  onInterrupt,
  onPause,
  inputReady = true,
  inputStarting = false,
  inputError = false,
  onRetry,
  responding: isResponding,
  muted = false,
}: {
  state: OrbState;
  level: number;
  paused: boolean;
  recording?: boolean;
  onInterrupt: () => void;
  onPause: () => void;
  inputReady?: boolean;
  inputStarting?: boolean;
  inputError?: boolean;
  onRetry: () => void;
  responding?: boolean;
  muted?: boolean;
}) {
  const scale = 1 + Math.min(0.22, level * 0.45);
  const responding = isResponding ?? (!paused && (state === 'thinking' || state === 'speaking'));
  const canStart = !responding && (paused || state === 'idle');
  const label = canStart
    ? "Tap to speak"
    : recording
      ? "Done speaking"
      : state === "speaking" || state === "thinking"
        ? "Tutor is responding"
        : "Listening";

  return (
    <div className="voice-controls">
      <button
        type="button"
        className="orb-control"
        aria-label={label}
        title={recording ? 'Done speaking: tap to send now, or pause for three seconds' : canStart ? 'Start listening. The microphone reopens after each response' : label}
        onClick={onInterrupt}
        disabled={inputStarting || (inputError && !responding) || responding}
        aria-disabled={responding || inputStarting || inputError || (inputReady && !canStart && !recording)}
      >
        <span
          aria-hidden
          className={[
            "orb",
            state === "idle" && "orb-idle",
            state === "listening" && "orb-listening",
            state === "thinking" && "orb-thinking",
            state === "speaking" && "orb-speaking",
          ].filter(Boolean).join(" ")}
          style={state === "listening" ? { transform: `scale(${scale})` } : undefined}
        />
      </button>
      {inputError && !responding ? (
        <button type="button" className="voice-pause" onClick={onRetry}>
          Retry microphone
        </button>
      ) : (
        <button
          type="button"
          className="voice-pause"
          onClick={onPause}
          disabled={canStart}
          aria-label={responding ? (muted || !inputReady ? 'Stop tutor response' : 'Interrupt tutor and speak') : 'Pause microphone'}
          title={responding ? (muted || !inputReady ? 'Stop response (Escape)' : 'Interrupt and speak (Escape)') : 'Pause microphone (Escape)'}
        >
          <span aria-hidden>Ⅱ</span> {responding ? (muted || !inputReady ? 'Stop' : 'Interrupt') : 'Pause'}
        </button>
      )}
    </div>
  );
}
