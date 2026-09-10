"use client";

import { Orb } from "./Orb";
import { useVoiceLoop } from "./useVoiceLoop";

export function VoiceSession() {
  const { state, level, error, sendUtterance, chips } = useVoiceLoop();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F7F4EC] px-6 text-zinc-900">
      <Orb state={state} level={level} />
      <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
        {chips.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => void sendUtterance(chip)}
            className="rounded-full border border-zinc-300/80 bg-white/70 px-3 py-1.5 text-xs text-zinc-600 hover:border-zinc-400 hover:text-zinc-900"
          >
            {chip}
          </button>
        ))}
      </div>
      {error ? (
        <p className="mt-8 max-w-sm text-center text-xs text-zinc-500">{error}</p>
      ) : null}
    </main>
  );
}
