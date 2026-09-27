// Thai speech-to-text with the browser's Web Speech API (Chrome, Android, iOS Safari 14.5+).
// Firefox has no support; the vendor can type instead.

const Recognition = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null

export function canListen() {
  return !!Recognition
}

const ERRORS = {
  'not-allowed': 'ไม่ได้รับอนุญาตให้ใช้ไมโครโฟน · Microphone permission was denied',
  'service-not-allowed': 'ไม่ได้รับอนุญาตให้ใช้ไมโครโฟน · Microphone permission was denied',
  'no-speech': 'ไม่ได้ยินเสียง ลองอีกครั้ง · No speech heard, try again',
  'audio-capture': 'ไม่พบไมโครโฟน · No microphone found',
  network: 'เชื่อมต่อไม่ได้ พิมพ์แทนได้ · Network error, you can type instead',
}

// Starts listening. Calls onText(transcript) as words arrive and onEnd(errorMessage|null) once.
// Returns a stop() function.
export function listenThai({ onText, onEnd }) {
  const rec = new Recognition()
  rec.lang = 'th-TH'
  rec.interimResults = true
  rec.continuous = false
  rec.maxAlternatives = 1
  let error = null
  let ended = false
  rec.onresult = (e) => {
    let text = ''
    for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript
    onText(text.trim())
  }
  rec.onerror = (e) => { if (e.error !== 'aborted') error = ERRORS[e.error] ?? `Speech error: ${e.error}` }
  rec.onend = () => { if (!ended) { ended = true; onEnd(error) } }
  try {
    rec.start()
  } catch (e) {
    ended = true
    onEnd(`Could not start the microphone: ${e.message}`)
  }
  return () => { try { rec.stop() } catch { /* already stopped */ } }
}
