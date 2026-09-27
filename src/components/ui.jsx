import { useSyncExternalStore } from 'react'
import {
  speakThai, canSpeak, subscribeSpeech, getSpeechState, pauseSpeaking, resumeSpeaking, stopSpeaking,
} from '../lib/speak'

// Returns 'playing' | 'paused' | null for this text.
export function useSpeechStatus(text) {
  const state = useSyncExternalStore(subscribeSpeech, getSpeechState, () => null)
  return state && state.text === text ? state.status : null
}

// 🔊 play → ⏸ pause → ▶ resume. ⏹ stops while this text is active.
// The voice follows ครับ / ค่ะ in the text; `gender` is the fallback when there is none.
export function SpeakButton({ text, gender, className = '' }) {
  const status = useSpeechStatus(text)
  if (!canSpeak()) return null
  const onClick = (e) => {
    e.stopPropagation()
    if (status === 'playing') pauseSpeaking()
    else if (status === 'paused') resumeSpeaking()
    else speakThai(text, { gender })
  }
  const base = 'inline-flex items-center justify-center rounded-full active:scale-95 transition w-9 h-9 text-lg shrink-0'
  const main = (
    <button
      type="button"
      onClick={onClick}
      className={`${base} ${status ? 'bg-amber-300 hover:bg-amber-400' : 'bg-amber-100 hover:bg-amber-200'} ${status ? '' : className}`}
      aria-label={status === 'playing' ? 'Pause' : status === 'paused' ? 'Resume' : 'Play pronunciation'}
    >{status === 'playing' ? '⏸' : status === 'paused' ? '▶️' : '🔊'}</button>
  )
  if (!status) return main
  return (
    <span className={`inline-flex items-center gap-1 shrink-0 ${className}`}>
      {main}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); stopSpeaking() }}
        className={`${base} bg-amber-100 hover:bg-amber-200`}
        aria-label="Stop"
      >⏹</button>
    </span>
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
