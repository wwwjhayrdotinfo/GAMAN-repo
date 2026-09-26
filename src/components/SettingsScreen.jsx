import { useState } from 'react'
import { Header } from './ui'

export default function SettingsScreen({ settings, onSave, onBack }) {
  const [s, setS] = useState(settings)
  const set = (k) => (e) => setS({ ...s, [k]: e.target.value })

  return (
    <div className="min-h-screen">
      <Header title="Settings" onBack={onBack} />
      <main className="px-5 py-5 flex flex-col gap-4 max-w-md mx-auto">
        <Field label="Claude API key" hint="Stored only in this browser (localStorage). Never committed.">
          <input type="password" value={s.apiKey} onChange={set('apiKey')} placeholder="sk-ant-…" className={inputCls} autoComplete="off" />
        </Field>
        <Field label="Proxy URL (optional)" hint="If set, requests go here instead (e.g. a Cloudflare Worker holding the key). The key field is ignored.">
          <input value={s.proxyUrl} onChange={set('proxyUrl')} placeholder="https://gaman-proxy.<you>.workers.dev" className={inputCls} />
        </Field>
        <Field label="Model">
          <input value={s.model} onChange={set('model')} className={inputCls} />
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
