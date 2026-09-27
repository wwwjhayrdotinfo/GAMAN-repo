import { PHRASES } from '../data/phrases'
import { Header, SpeakButton } from './ui'

export default function MyThai({ saved, particle, onRemove, onBack }) {
  return (
    <div className="min-h-screen">
      <Header title="My Thai" onBack={onBack} />
      <main className="px-4 py-4 flex flex-col gap-5 max-w-md mx-auto pb-10">
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wide text-ink mb-2">
            Phrases I've learned ({saved.length})
          </h2>
          {saved.length === 0 && <p className="text-ink text-sm">Order something and tap "Save this phrase" to build your list.</p>}
          <div className="flex flex-col gap-2">
            {saved.map((p, i) => (
              <Row key={i} p={p} particle={particle} onRemove={() => onRemove(i)} />
            ))}
          </div>
        </section>
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wide text-ink mb-2">Useful at any food stall</h2>
          <div className="flex flex-col gap-2">
            {PHRASES.map((p) => <Row key={p.id} p={p} particle={particle} />)}
          </div>
        </section>
      </main>
    </div>
  )
}

function Row({ p, particle, onRemove }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white border border-line p-3">
      <div className="flex-1 min-w-0">
        <p className="thai text-lg font-bold text-ink">{p.thai}</p>
        <p className="text-sm text-ink italic">{p.romanized}</p>
        <p className="text-sm text-ink">
          {p.english}
          {p.dialect === 'northern' && <span className="ml-1 text-[10px] font-semibold uppercase bg-soft text-ink rounded-full px-1.5 py-0.5">Kham Mueang</span>}
        </p>
      </div>
      <SpeakButton text={p.thai} gender={particle} />
      {onRemove && <button onClick={onRemove} className="text-ink text-sm" aria-label="Remove">✕</button>}
    </div>
  )
}
