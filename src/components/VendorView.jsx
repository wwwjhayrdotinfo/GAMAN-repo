import { useState } from 'react'
import { PHRASES, QUICK_ANSWERS, VENDOR_REPLIES } from '../data/phrases'
import { SpeakButton } from './ui'
import { speakThai } from '../lib/speak'
import VendorVoiceReply from './VendorVoiceReply'

// Two modes on one screen:
//  - "vendor": the phone is flipped to face the vendor. Big Thai order + Thai reply buttons.
//  - "customer": shows what the vendor tapped (in English) + friendly phrases to say back.
export default function VendorView({ order, particle, onClose }) {
  const [reply, setReply] = useState(null)
  const [other, setOther] = useState(false)

  if (reply) {
    return (
      <div className="min-h-screen bg-amber-50 flex flex-col px-5 py-6 max-w-md mx-auto gap-5">
        <p className="text-xs font-bold uppercase tracking-wide text-amber-800">The vendor says</p>
        <div className="rounded-3xl bg-white border-2 border-emerald-500 p-5 shadow">
          <p className="text-4xl mb-2">{reply.emoji}</p>
          <p className="text-2xl font-bold text-amber-950">{reply.english}</p>
          <p className="thai text-amber-700 mt-1">{reply.thai}</p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-amber-800 mb-2">Quick answer (tap to hear)</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_ANSWERS.map((a) => (
              <button key={a.thai} onClick={() => speakThai(a.thai, { gender: particle })} className="rounded-2xl bg-white border border-amber-300 px-3 py-2 text-left active:scale-95 transition">
                <span className="thai font-bold text-amber-950">{a.thai}</span>
                <span className="block text-xs text-amber-700">{a.romanized} · {a.english}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-amber-800 mb-2">Say something back</p>
          <div className="flex flex-col gap-2">
            {PHRASES.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-white border border-amber-200 p-3">
                <div className="flex-1">
                  <p className="thai text-xl font-bold text-amber-950">{p.thai}</p>
                  <p className="text-sm text-amber-700 italic">{p.romanized}</p>
                  <p className="text-sm text-amber-900">{p.english}{p.dialect === 'northern' && <span className="ml-1 text-[10px] font-semibold uppercase bg-emerald-100 text-emerald-800 rounded-full px-1.5 py-0.5">Kham Mueang</span>}</p>
                </div>
                <SpeakButton text={p.thai} gender={particle} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 mt-auto">
          <button onClick={() => { setReply(null); setOther(false) }} className="flex-1 rounded-2xl bg-amber-700 text-white py-3 font-bold">📱 Show vendor again</button>
          <button onClick={onClose} className="rounded-2xl bg-white border border-amber-300 px-4 font-semibold text-amber-900">Done</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-amber-700 text-white flex flex-col px-5 py-6 max-w-md mx-auto gap-5">
      <div className="flex justify-between items-center">
        <span className="thai text-sm opacity-90">สวัสดีครับ/ค่ะ 🙏 ลูกค้าอยากสั่ง:</span>
        <button onClick={onClose} className="text-sm underline opacity-80">✕ close</button>
      </div>

      <div className="rounded-3xl bg-white text-amber-950 p-5 shadow-xl">
        <p className="thai text-4xl font-extrabold leading-snug">{order.thai}</p>
        <div className="mt-3 flex items-center gap-2">
          <SpeakButton text={order.thai} />
          <span className="text-xs text-amber-700">{order.english}</span>
        </div>
      </div>

      <div>
        <p className="thai text-sm opacity-90 mb-2">แตะเพื่อตอบลูกค้า 👇 (tap to reply to the customer)</p>
        {other ? (
          <VendorVoiceReply onReply={setReply} onCancel={() => setOther(false)} />
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {VENDOR_REPLIES.map((r) => (
              <button
                key={r.thai}
                onClick={() => setReply(r)}
                className="thai rounded-2xl bg-amber-50 text-amber-950 py-4 px-3 text-lg font-bold active:scale-95 transition shadow"
              >{r.emoji} {r.thai}</button>
            ))}
            <button
              onClick={() => setOther(true)}
              className="thai col-span-2 rounded-2xl bg-amber-900 text-white py-4 px-3 text-lg font-bold active:scale-95 transition shadow border-2 border-amber-50"
            >🎤 อื่นๆ… พูดเอง <span className="block text-xs font-normal opacity-80">Other… say it yourself</span></button>
          </div>
        )}
      </div>
    </div>
  )
}
