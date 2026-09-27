import { useEffect, useRef, useState } from 'react'
import { canListen, listenThai } from '../lib/listen'
import { translateVendorReply } from '../lib/claude'

// "Other…" reply: the vendor speaks (or types) Thai, Claude translates it for the customer.
// ⚠️ Thai UI text needs a native speaker's check.
export default function VendorVoiceReply({ onReply, onCancel }) {
  const [text, setText] = useState('')
  const [status, setStatus] = useState('idle') // idle | listening | translating
  const [error, setError] = useState(null)
  const stopRef = useRef(null)
  const abortRef = useRef(null)
  const micOk = canListen()

  useEffect(() => () => { stopRef.current?.(); abortRef.current?.abort() }, [])

  function toggleMic() {
    if (status === 'listening') { stopRef.current?.(); return }
    setError(null)
    setStatus('listening')
    stopRef.current = listenThai({
      onText: setText,
      onEnd: (err) => { stopRef.current = null; setStatus('idle'); if (err) setError(err) },
    })
  }

  async function send() {
    const thai = text.trim()
    if (!thai) return
    stopRef.current?.()
    setError(null)
    setStatus('translating')
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const english = await translateVendorReply(thai, { signal: controller.signal })
      onReply({ thai, english, emoji: '💬' })
    } catch (e) {
      if (controller.signal.aborted) return
      setError(`แปลไม่สำเร็จ ลองอีกครั้ง · ${e.message}`)
      setStatus('idle')
    }
  }

  const busy = status === 'translating'
  return (
    <div className="rounded-3xl bg-white text-amber-950 p-4 shadow-xl flex flex-col gap-3">
      <p className="thai font-bold text-lg">พูดคำตอบเป็นภาษาไทย <span className="block text-xs font-normal text-amber-700">Speak your reply in Thai</span></p>

      {micOk && (
        <button
          type="button"
          onClick={toggleMic}
          disabled={busy}
          className={`thai rounded-2xl py-4 text-lg font-bold active:scale-95 transition ${
            status === 'listening' ? 'bg-red-600 text-white animate-pulse' : 'bg-amber-700 text-white'
          } disabled:opacity-50`}
        >{status === 'listening' ? '● กำลังฟัง… แตะเพื่อหยุด' : '🎤 แตะแล้วพูด'}</button>
      )}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={busy}
        rows={3}
        placeholder={micOk ? 'หรือพิมพ์ที่นี่… (or type here)' : 'พิมพ์คำตอบที่นี่… (type your reply here)'}
        className="thai w-full rounded-2xl border border-amber-300 p-3 text-xl"
      />

      {error && <p className="thai text-sm text-red-700">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={send}
          disabled={!text.trim() || busy || status === 'listening'}
          className="thai flex-1 rounded-2xl bg-emerald-600 text-white py-3 font-bold disabled:opacity-40"
        >{busy ? 'กำลังแปล…' : 'ส่งให้ลูกค้า ✓'}</button>
        <button type="button" onClick={onCancel} className="thai rounded-2xl border border-amber-300 px-4 font-semibold">ยกเลิก</button>
      </div>
    </div>
  )
}
