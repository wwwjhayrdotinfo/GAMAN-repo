import Icon from './Icon'
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
      <div className="min-h-screen bg-rice flex flex-col px-5 py-6 max-w-md mx-auto gap-5">
        <p className="text-xs font-bold uppercase tracking-wide text-ink">The vendor says</p>
        <div className="rounded-3xl bg-white border-2 border-line p-5 shadow">

          <p className="text-2xl font-bold text-ink">{reply.english}</p>
          <p className="thai text-ink mt-1">{reply.thai}</p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-ink mb-2">Quick answer (tap to hear)</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_ANSWERS.map((a) => (
              <button key={a.thai} onClick={() => speakThai(a.thai, { gender: particle })} className="rounded-2xl bg-action hover:bg-action-hover text-white px-3 py-2 text-left active:scale-95 transition">
                <span className="thai font-bold text-white">{a.thai}</span>
                <span className="block text-xs text-white">{a.romanized} · {a.english}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-ink mb-2">Say something back</p>
          <div className="flex flex-col gap-2">
            {PHRASES.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-white border border-line p-3">
                <div className="flex-1">
                  <p className="thai text-xl font-bold text-ink">{p.thai}</p>
                  <p className="text-sm text-ink italic">{p.romanized}</p>
                  <p className="text-sm text-ink">{p.english}{p.dialect === 'northern' && <span className="ml-1 text-[10px] font-semibold uppercase bg-soft text-ink rounded-full px-1.5 py-0.5">Kham Mueang</span>}</p>
                </div>
                <SpeakButton text={p.thai} gender={particle} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 mt-auto">
          <button onClick={() => { setReply(null); setOther(false) }} className="flex-1 rounded-2xl bg-action text-white py-3 font-bold"><Icon name="phone" className="mr-2 align-middle" />Show vendor again</button>
          <button onClick={onClose} className="rounded-2xl bg-white border border-line px-4 font-semibold text-ink">Done</button>
        </div>
      </div>
    )
  }

  return (
    <div className="vendor-screen min-h-screen bg-ink text-white flex flex-col px-5 py-6 gap-5">
      <div className="flex justify-between items-center">
        <span className="thai text-sm opacity-90">สวัสดีครับ/ค่ะ ลูกค้าอยากสั่ง:</span>
        <button onClick={onClose} className="text-sm underline opacity-80">✕ close</button>
      </div>

      <div className="rounded-3xl border border-white/30 p-5">
        <p className="thai text-[40px] font-bold leading-relaxed break-words">{order.thai}</p>
        <div className="mt-3 flex items-center gap-2">
          <SpeakButton text={order.thai} />
          <span className="text-sm text-rice">{order.english}</span>
        </div>
      </div>

      <div>
        <p className="thai text-sm opacity-90 mb-2">แตะเพื่อตอบลูกค้า (tap to reply to the customer)</p>
        {other ? (
          <VendorVoiceReply onReply={setReply} onCancel={() => setOther(false)} />
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {VENDOR_REPLIES.map((r) => (
              <button
                key={r.thai}
                onClick={() => setReply(r)}
                className="thai rounded-2xl bg-action hover:bg-action-hover text-white py-4 px-3 text-lg font-bold active:scale-95 transition shadow border border-white"
              >{r.thai}</button>
            ))}
            <button
              onClick={() => setOther(true)}
              className="thai col-span-2 rounded-2xl bg-action hover:bg-action-hover text-white py-4 px-3 text-lg font-bold active:scale-95 transition shadow border border-white"
            ><Icon name="mic" className="mr-2 align-middle" />อื่นๆ… พูดเอง <span className="block text-xs font-normal opacity-80">Other… say it yourself</span></button>
          </div>
        )}
      </div>
    </div>
  )
}
