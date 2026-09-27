import Icon from './Icon'
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
  const base = 'inline-flex items-center justify-center rounded-full active:scale-95 transition w-9 h-9 text-ink shrink-0'
  const main = (
    <button
      type="button"
      onClick={onClick}
      className={`${base} ${status ? 'bg-line hover:bg-line' : 'bg-soft hover:bg-line'} ${status ? '' : className}`}
      aria-label={status === 'playing' ? 'Pause' : status === 'paused' ? 'Resume' : 'Play pronunciation'}
    ><Icon name={status === 'playing' ? 'pause' : status === 'paused' ? 'play' : 'volume'} /></button>
  )
  if (!status) return main
  return (
    <span className={`inline-flex items-center gap-1 shrink-0 ${className}`}>
      {main}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); stopSpeaking() }}
        className={`${base} bg-soft hover:bg-line`}
        aria-label="Stop"
      ><Icon name="stop" /></button>
    </span>
  )
}

export function Spice({ level }) {
  if (!level) return <span className="text-xs text-ink font-medium">Not spicy</span>
  return <span className="inline-flex gap-0.5 text-chili" role="img" aria-label={`Spice ${level} of 3`} title={`Spice ${level}/3`}>{Array.from({ length: level }, (_, i) => <Icon key={i} name="flame" size={16} />)}</span>
}

export function Header({ title, onBack, right }) {
  return (
    <header className="sticky top-0 z-10 bg-rice/90 backdrop-blur flex items-center gap-2 px-4 py-3 border-b border-line">
      {onBack ? (
        <button onClick={onBack} className="inline-flex items-center justify-center w-9 h-9 -ml-2 rounded-full hover:bg-soft" aria-label="Back"><Icon name="back" /></button>
      ) : <img src="/icons/icon-192.png" alt="" width="36" height="36" className="rounded-xl" />}
      <h1 className="font-display font-semibold text-lg text-ink flex-1 truncate">{!onBack && title === 'PadTalk' ? <img src="/brand/wordmark.webp" alt="PadTalk" width="140" height="28" /> : title}</h1>
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
        active ? 'bg-action text-white border-action' : 'bg-white text-ink border-line'
      }`}
    >{children}</button>
  )
}
