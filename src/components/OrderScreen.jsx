import { allowedOptions } from '../lib/orderOptions'
import Icon from './Icon'
import { useMemo, useState } from 'react'
import { Chip, Header, SpeakButton } from './ui'
import { buildOrder, EXTRA_OPTIONS, PARTICLES, SPICE_OPTIONS, WHERE_OPTIONS } from '../lib/order'

export default function OrderScreen({ dish, particle, onParticle, onBack, onShowVendor, onSavePhrase, savedList = [] }) {
  const allowed = allowedOptions(dish)
  const availableExtras = EXTRA_OPTIONS.filter((option) => allowed.includes(option.id))
  const [qty, setQty] = useState(1)
  const [spice, setSpice] = useState('normal')
  const [extras, setExtras] = useState([])
  const [where, setWhere] = useState('here')

  const order = useMemo(
    () => buildOrder(dish, { qty, spice, extras, where, particle }),
    [dish, qty, spice, extras, where, particle],
  )
  const saved = savedList.some((p) => p.thai === order.thai)
  const toggleExtra = (id) => setExtras((x) => (x.includes(id) ? x.filter((e) => e !== id) : [...x, id]))

  return (
    <div className="min-h-screen">
      <Header title={`Order: ${dish.english_name}`} onBack={onBack} />
      <main className="px-4 py-4 flex flex-col gap-5 max-w-md mx-auto pb-10">
        <section className="flex flex-col gap-2">
          <Label>How many?</Label>
          <div className="flex items-center gap-3">
            <button className="w-11 h-11 rounded-full bg-white border border-line text-xl" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
            <span className="text-2xl font-bold w-8 text-center">{qty}</span>
            <button className="w-11 h-11 rounded-full bg-white border border-line text-xl" onClick={() => setQty((q) => Math.min(5, q + 1))}>+</button>
          </div>
        </section>

        {allowed.includes('spice') && <section className="flex flex-col gap-2">
          <Label>Spice</Label>
          <div className="flex flex-wrap gap-2">
            {SPICE_OPTIONS.map((s) => <Chip key={s.id} active={spice === s.id} onClick={() => setSpice(s.id)}>{s.english}</Chip>)}
          </div>
        </section>}

        {availableExtras.length > 0 && <section className="flex flex-col gap-2">
          <Label>Extras</Label>
          <div className="flex flex-wrap gap-2">
            {availableExtras.map((e) => <Chip key={e.id} active={extras.includes(e.id)} onClick={() => toggleExtra(e.id)}>{e.english}</Chip>)}
          </div>
        </section>}

        <section className="flex flex-col gap-2">
          <Label>Where?</Label>
          <div className="flex flex-wrap gap-2">
            {WHERE_OPTIONS.map((w) => <Chip key={w.id} active={where === w.id} onClick={() => setWhere(w.id)}>{w.english}</Chip>)}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <Label>Polite ending <span className="font-normal normal-case text-ink">(Thai changes with the speaker)</span></Label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PARTICLES).map(([id, p]) => (
              <Chip key={id} active={particle === id} onClick={() => onParticle(id)}>
                <span className="thai">{p.thai}</span> · {p.romanized}
              </Chip>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white border-2 border-action p-4 flex flex-col gap-2 shadow">
          <div className="flex items-start gap-3">
            <p className="thai text-2xl font-bold text-ink flex-1 leading-snug">{order.thai}</p>
            <SpeakButton text={order.thai} />
          </div>
          <p className="text-ink italic">{order.romanized}</p>
          <p className="text-sm text-ink">"{order.english}"</p>
          <p className="text-xs text-ink">Try saying it, or show the screen—whichever feels comfortable.</p>
        </section>

        <button
          onClick={() => onShowVendor(order)}
          className="rounded-2xl bg-action hover:bg-action-hover active:scale-[0.98] transition text-white py-4 text-lg font-bold shadow-lg"
        ><Icon name="phone" className="mr-2 align-middle" />Show the vendor</button>

        <button
          onClick={() => onSavePhrase({ thai: order.thai, romanized: order.romanized, english: order.english })}
          disabled={saved}
          className="text-ink underline underline-offset-4 text-sm disabled:no-underline disabled:opacity-60"
        >{saved ? '✓ Saved to My Thai' : '＋ Save this phrase to My Thai'}</button>
      </main>
    </div>
  )
}

function Label({ children }) {
  return <h3 className="text-xs font-bold uppercase tracking-wide text-ink">{children}</h3>
}
