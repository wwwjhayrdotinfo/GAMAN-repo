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
        <Field label="Proxy URL (optional)" hint="Your Supabase function or Cloudflare Worker URL. When set, the Claude API key above is ignored.">
          <input type="url" value={s.proxyUrl} onChange={set('proxyUrl')} placeholder="https://<project-ref>.supabase.co/functions/v1/anthropic" className={inputCls} />
        </Field>
        <Field label="Proxy access token" hint="For Supabase, enter the GAMAN_PROXY_TOKEN you set in function secrets. Stored in this browser. Leave empty for the original Cloudflare proxy.">
          <input type="password" value={s.proxyToken || ''} onChange={set('proxyToken')} autoComplete="off" className={inputCls} />
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
