export function HistoryIcon({ redo = false }: { redo?: boolean }) {
  return <svg viewBox="0 0 24 24" aria-hidden style={redo ? { transform: 'scaleX(-1)' } : undefined}>
    <path d="M8 5 4 9l4 4M4 9h9a5 5 0 0 1 0 10h-2" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}
