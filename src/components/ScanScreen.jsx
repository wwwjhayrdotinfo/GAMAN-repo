import Icon from './Icon'
import { useRef, useState } from 'react'
import { Header } from './ui'

export default function ScanScreen({ onPhoto, onText, onDemo, onSettings, onMyThai, error, loading, loadingMessage, preview }) {
  const fileRef = useRef(null)
  const [query, setQuery] = useState('')

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title="PadTalk"
        right={
          <div className="flex gap-1">
            <button onClick={onMyThai} className="w-9 h-9 rounded-full hover:bg-soft text-ink inline-flex items-center justify-center" aria-label="My Thai phrases"><Icon name="book" /></button>
            <button onClick={onSettings} className="w-9 h-9 rounded-full hover:bg-soft text-ink inline-flex items-center justify-center" aria-label="Settings"><Icon name="settings" /></button>
          </div>
        }
      />
      <main className="flex-1 px-5 py-4 flex flex-col gap-4 max-w-md w-full mx-auto">
        <section className="text-center">
          <img src="/brand/logo-transparent.webp" alt="Pad Talk — Every dish is a conversation" className="mx-auto mb-3 w-32 rounded-2xl" width="1379" height="1141" />
          <p className="mt-2 text-ink">Understand the menu, order in Thai, and connect with the vendor.</p>
        </section>

        {loading ? (
          <div className="rounded-3xl bg-white border border-line p-6 text-center shadow-sm">
            {preview && <img src={preview} alt="" className="mx-auto max-h-48 rounded-xl mb-4 opacity-70" />}
            <div className="text-ink font-medium" role="status" aria-live="polite">{loadingMessage || 'Reading the menu…'}</div>
            <div
              className="scan-progress mt-4 mb-3 h-2.5 overflow-hidden rounded-full bg-soft"
              role="progressbar"
              aria-label={loadingMessage || 'Reading the menu'}
              aria-valuetext="In progress"
            >
              <div className="scan-progress-bar h-full w-2/5 rounded-full bg-action" />
            </div>
            <p className="text-xs text-ink mt-1">Dense menus take longer. A clear photo of one section helps.</p>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="rounded-3xl bg-action hover:bg-action-hover active:scale-[0.98] transition text-white py-6 shadow-lg flex flex-col items-center gap-2"
          >
            <Icon name="camera" size={40} />
            <span className="text-xl font-bold">Scan a menu</span>
            <span className="text-sm opacity-80">Thai, English, even handwritten</span>
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onPhoto(f); e.target.value = '' }}
        />

        <form
          onSubmit={(e) => { e.preventDefault(); if (!loading && query.trim()) onText(query.trim()) }}
          className="flex gap-2"
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="No menu? Type a dish, e.g. khao soi"
            className="min-w-0 flex-1 rounded-2xl border border-line bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-ink"
          />
          <button className="rounded-2xl bg-action hover:bg-action-hover text-white px-4 font-semibold" disabled={loading}>Go</button>
        </form>

        <button onClick={onDemo} disabled={loading} className="text-ink underline underline-offset-4 text-sm">
          Try the demo menu (Chiang Mai classics, works offline)
        </button>

        {error && <div className="rounded-2xl bg-soft border border-line text-ink p-3 text-sm">{error}</div>}
      </main>
    </div>
  )
}
