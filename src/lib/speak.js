// Browser text-to-speech in Thai. It's free and instant, and works on most phones.
let thaiVoice = null

function pickVoice() {
  if (!('speechSynthesis' in window)) return null
  const voices = window.speechSynthesis.getVoices()
  thaiVoice = voices.find((v) => v.lang?.toLowerCase().startsWith('th')) ?? null
  return thaiVoice
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  pickVoice()
  window.speechSynthesis.onvoiceschanged = pickVoice
}

export function canSpeak() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function speakThai(text, rate = 0.85) {
  if (!canSpeak()) return false
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'th-TH'
  u.rate = rate
  if (thaiVoice || pickVoice()) u.voice = thaiVoice
  window.speechSynthesis.speak(u)
  return true
}
