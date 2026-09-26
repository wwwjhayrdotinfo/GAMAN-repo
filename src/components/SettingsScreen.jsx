import { useState } from 'react'
import { Header } from './ui'

export default function SettingsScreen({ settings, onSave, onBack }) {
  const [s, setS] = useState(settings)
  const set = (k) => (e) => setS({ ...s, [k]: e.target.value })

  return (
    <div className="min-h-screen">
      <Header title="Settings" onBack={onBack} />
      <main className="px-5 py-5 flex flex-col gap-4 max-w-md mx-auto">
        <Field label="Polite ending" hint="Choose the ending used when building your Thai order.">
          <select value={s.particle} onChange={set('particle')} className={inputCls}>
            <option value="male">ครับ · khráp</option>
            <option value="female">ค่ะ · khâ</option>
          </select>
        </Field>
        <button onClick={() => onSave(s)} className="rounded-2xl bg-amber-700 text-white py-3 font-bold">Save</button>
      </main>
    </div>
  )
}

const inputCls = 'w-full rounded-2xl border border-amber-300 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500'

function Field({ label, hint, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-semibold text-amber-950">{label}</span>
      {children}
      {hint && <span className="text-xs text-amber-700">{hint}</span>}
    </label>
  )
}
