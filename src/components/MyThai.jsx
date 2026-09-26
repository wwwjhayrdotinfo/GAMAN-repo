import { PHRASES } from '../data/phrases'
import { Header, SpeakButton } from './ui'

export default function MyThai({ saved, onRemove, onBack }) {
  return (
    <div className="min-h-screen">
      <Header title="My Thai" onBack={onBack} />
      <main className="px-4 py-4 flex flex-col gap-5 max-w-md mx-auto pb-10">
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wide text-amber-900 mb-2">
            Phrases I've learned ({saved.length})
          </h2>
          {saved.length === 0 && <p className="text-amber-700 text-sm">Order something and tap "Save this phrase" to build your list.</p>}
          <div className="flex flex-col gap-2">
            {saved.map((p, i) => (
              <Row key={i} p={p} onRemove={() => onRemove(i)} />
            ))}
          </div>
        </section>
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wide text-amber-900 mb-2">Useful at any food stall</h2>
          <div className="flex flex-col gap-2">
            {PHRASES.map((p) => <Row key={p.id} p={p} />)}
          </div>
        </section>
      </main>
    </div>
  )
}

function Row({ p, onRemove }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white border border-amber-200 p-3">
      <div className="flex-1 min-w-0">
        <p className="thai text-lg font-bold text-amber-950">{p.thai}</p>
        <p className="text-sm text-amber-700 italic">{p.romanized}</p>
        <p className="text-sm text-amber-900">
          {p.english}
          {p.dialect === 'northern' && <span className="ml-1 text-[10px] font-semibold uppercase bg-emerald-100 text-emerald-800 rounded-full px-1.5 py-0.5">Kham Mueang</span>}
        </p>
      </div>
      <SpeakButton text={p.thai} />
      {onRemove && <button onClick={onRemove} className="text-amber-500 text-sm" aria-label="Remove">✕</button>}
    </div>
  )
}
