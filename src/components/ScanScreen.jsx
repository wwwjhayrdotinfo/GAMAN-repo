import { useRef, useState } from 'react'
import { Header } from './ui'

export default function ScanScreen({ onPhoto, onText, onDemo, onSettings, onMyThai, error, loading, loadingMessage, preview }) {
  const fileRef = useRef(null)
  const [query, setQuery] = useState('')

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title="GAMAN"
        right={
          <div className="flex gap-1">
            <button onClick={onMyThai} className="w-9 h-9 rounded-full hover:bg-amber-100 text-lg" aria-label="My Thai phrases">📖</button>
            <button onClick={onSettings} className="w-9 h-9 rounded-full hover:bg-amber-100 text-lg" aria-label="Settings">⚙️</button>
          </div>
        }
      />
      <main className="flex-1 px-5 py-6 flex flex-col gap-5 max-w-md w-full mx-auto">
        <section className="text-center">
          <p className="text-3xl font-extrabold text-amber-950 leading-tight">Order like a local.</p>
          <p className="mt-2 text-amber-800">Snap a menu. Understand every dish. Order it in Thai, and chat with the vendor.</p>
        </section>

        {loading ? (
          <div className="rounded-3xl bg-white border border-amber-200 p-6 text-center shadow-sm">
            {preview && <img src={preview} alt="" className="mx-auto max-h-48 rounded-xl mb-4 opacity-70" />}
            <div className="text-amber-900 font-medium" role="status" aria-live="polite">{loadingMessage || 'Reading the menu…'}</div>
            <div
              className="scan-progress mt-4 mb-3 h-2.5 overflow-hidden rounded-full bg-amber-100"
              role="progressbar"
              aria-label={loadingMessage || 'Reading the menu'}
              aria-valuetext="In progress"
            >
              <div className="scan-progress-bar h-full w-2/5 rounded-full bg-amber-600" />
            </div>
            <p className="text-xs text-amber-700 mt-1">Dense menus take longer. A clear photo of one section helps.</p>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="rounded-3xl bg-amber-700 hover:bg-amber-800 active:scale-[0.98] transition text-white py-10 shadow-lg flex flex-col items-center gap-2"
          >
            <span className="text-5xl">📷</span>
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
            className="flex-1 rounded-2xl border border-amber-300 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button className="rounded-2xl bg-amber-900 text-white px-4 font-semibold" disabled={loading}>Go</button>
        </form>

        <button onClick={onDemo} disabled={loading} className="text-amber-800 underline underline-offset-4 text-sm">
          Try the demo menu (Chiang Mai classics, works offline)
        </button>

        {error && <div className="rounded-2xl bg-red-50 border border-red-200 text-red-800 p-3 text-sm">{error}</div>}
      </main>
    </div>
  )
}
