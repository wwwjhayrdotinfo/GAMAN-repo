import { useEffect, useState } from 'react'

// Keep the event outside the component: it may arrive before Settings is opened.
let installPrompt = null
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    installPrompt = event
    window.dispatchEvent(new Event('padtalk-install-ready'))
  })
  window.addEventListener('appinstalled', () => { installPrompt = null })
}

const isInstalled = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true

export default function InstallApp() {
  const [available, setAvailable] = useState(Boolean(installPrompt))
  const [installed, setInstalled] = useState(isInstalled)
  const [error, setError] = useState('')
  useEffect(() => {
    const ready = () => setAvailable(Boolean(installPrompt))
    const done = () => { setInstalled(true); setAvailable(false) }
    window.addEventListener('padtalk-install-ready', ready)
    window.addEventListener('appinstalled', done)
    return () => {
      window.removeEventListener('padtalk-install-ready', ready)
      window.removeEventListener('appinstalled', done)
    }
  }, [])
  async function install() {
    const prompt = installPrompt
    if (!prompt) return
    installPrompt = null
    setAvailable(false)
    try { await prompt.prompt(); await prompt.userChoice }
    catch { setError('Use your browser menu to add PadTalk to your home screen.') }
  }
  return <section className="rounded-2xl border border-amber-200 bg-white p-4 text-amber-950">
    <h2 className="font-semibold">PadTalk on your home screen</h2>
    {installed ? <p className="mt-2 text-sm">You’re using the installed app.</p> : <>
      {available && <button onClick={install} className="mt-3 rounded-xl bg-amber-700 px-4 py-2 font-semibold text-white">Install PadTalk</button>}
      <p className="mt-2 text-sm">On iPhone, open PadTalk in Safari, tap Share, then Add to Home Screen. On Android, use your browser’s Install app or Add to Home screen option when available.</p>
    </>}
    <p className="mt-2 text-xs text-amber-700">After an online visit finishes loading, the demo menu, built-in dish library and saved phrases work offline. New AI scans need internet.</p>
    {error && <p role="status" className="mt-2 text-sm">{error}</p>}
  </section>
}
