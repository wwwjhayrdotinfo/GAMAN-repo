// Browser text-to-speech in Thai. It's free and instant, and works on most phones.
//
// Voice by polite ending: text with ครับ uses a male Thai voice, ค่ะ/คะ a female one.
// Most phones only have a female Thai voice. When no male voice exists, the
// available voice is played at a lower pitch as an approximation.
//
// Playback state is shared, so every SpeakButton can show play / pause / resume.

const MALE_HINT = /\b(male|man)\b|niwat|pattara|pichai|somchai/i
const FEMALE_HINT = /female|woman|kanya|narisa|premwadee|achara|kanokwan|google/i
const LOW_PITCH = 0.6

let thaiVoices = []

function loadVoices() {
  if (!canSpeak()) return []
  thaiVoices = window.speechSynthesis.getVoices().filter((v) => v.lang?.toLowerCase().replace('_', '-').startsWith('th'))
  return thaiVoices
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices()
  window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices)
}

export function canSpeak() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

// 'male' | 'female' | null, from the polite particle in the text.
export function genderFromText(text = '') {
  if (/ครับ/.test(text)) return 'male'
  if (/ค่ะ|คะ/.test(text)) return 'female'
  return null
}

// Pick a voice for the requested gender. Returns { voice, pitch }.
export function chooseVoice(gender, voices = thaiVoices) {
  const fallback = voices.find((v) => v.localService) ?? voices[0] ?? null
  if (gender === 'male') {
    const male = voices.find((v) => MALE_HINT.test(v.name) && !/female/i.test(v.name))
    return male ? { voice: male, pitch: 1 } : { voice: fallback, pitch: LOW_PITCH }
  }
  if (gender === 'female') {
    const female = voices.find((v) => FEMALE_HINT.test(v.name))
    return { voice: female ?? fallback, pitch: 1 }
  }
  return { voice: fallback, pitch: 1 }
}

// ---- shared playback state -------------------------------------------------
// state: { text, status: 'playing' | 'paused' } or null when idle.
let state = null
const listeners = new Set()
function setState(next) {
  state = next
  listeners.forEach((fn) => fn())
}
export function subscribeSpeech(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
export function getSpeechState() {
  return state
}

let current = null // the active SpeechSynthesisUtterance

export function stopSpeaking() {
  if (!canSpeak()) return
  current = null
  window.speechSynthesis.cancel()
  setState(null)
}

// A ครับ / ค่ะ in the text decides the voice. `gender` ('male' | 'female') is the
// fallback for text without a particle, e.g. the user's setting for their own phrases.
export function speakThai(text, { rate = 0.85, gender } = {}) {
  if (!canSpeak() || !text) return false
  const synth = window.speechSynthesis
  synth.cancel()
  if (!thaiVoices.length) loadVoices()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'th-TH'
  u.rate = rate
  const { voice, pitch } = chooseVoice(genderFromText(text) ?? gender)
  if (voice) u.voice = voice
  u.pitch = pitch
  const done = () => { if (current === u) { current = null; setState(null) } }
  u.onend = done
  u.onerror = done
  current = u
  synth.speak(u)
  setState({ text, status: 'playing' })
  return true
}

// Pause if supported. Some Android browsers ignore pause(), so fall back to stop.
export function pauseSpeaking() {
  if (!canSpeak() || !state) return
  const synth = window.speechSynthesis
  synth.pause()
  setState({ ...state, status: 'paused' })
  setTimeout(() => {
    if (state?.status === 'paused' && !synth.paused) stopSpeaking()
  }, 250)
}

export function resumeSpeaking() {
  if (!canSpeak() || !state) return
  window.speechSynthesis.resume()
  setState({ ...state, status: 'playing' })
}
