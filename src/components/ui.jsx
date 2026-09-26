import { speakThai, canSpeak } from '../lib/speak'

export function SpeakButton({ text, className = '' }) {
  if (!canSpeak()) return null
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); speakThai(text) }}
      className={`inline-flex items-center justify-center rounded-full bg-amber-100 hover:bg-amber-200 active:scale-95 transition w-9 h-9 text-lg shrink-0 ${className}`}
      aria-label="Play pronunciation"
    >🔊</button>
  )
}

export function Spice({ level }) {
  if (!level) return <span className="text-xs text-emerald-700 font-medium">Not spicy</span>
  return <span className="text-sm" title={`Spice ${level}/3`}>{'🌶️'.repeat(level)}</span>
}

export function Header({ title, onBack, right }) {
  return (
    <header className="sticky top-0 z-10 bg-amber-50/90 backdrop-blur flex items-center gap-2 px-4 py-3 border-b border-amber-200">
      {onBack ? (
        <button onClick={onBack} className="text-2xl w-9 h-9 -ml-2 rounded-full hover:bg-amber-100" aria-label="Back">←</button>
      ) : <span className="text-2xl">🍜</span>}
      <h1 className="font-bold text-lg text-amber-950 flex-1 truncate">{title}</h1>
      {right}
    </header>
  )
}

export function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 rounded-full text-sm border transition active:scale-95 ${
        active ? 'bg-amber-700 text-white border-amber-700' : 'bg-white text-amber-900 border-amber-300'
      }`}
    >{children}</button>
  )
}
