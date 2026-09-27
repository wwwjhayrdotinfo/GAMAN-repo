import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export default function PwaStatus() {
  const [online, setOnline] = useState(navigator.onLine)
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW({
    onRegisterError(error) { console.warn('PadTalk offline setup failed:', error) },
  })
  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])
  return <>
    {!online && <div role="status" className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-950">
      You’re offline. Use the demo, built-in dishes or saved phrases. AI scans need internet.
    </div>}
    {needRefresh && <div role="status" className="fixed bottom-4 inset-x-4 z-50 mx-auto max-w-md rounded-2xl border border-amber-300 bg-white p-4 shadow-lg">
      <p className="text-sm text-amber-950">A PadTalk update is ready. Updating reloads the app, so finish your current order first.</p>
      <div className="mt-3 flex gap-3">
        <button className="rounded-xl bg-amber-700 px-4 py-2 text-sm font-semibold text-white" onClick={() => updateServiceWorker(true)}>Update now</button>
        <button className="px-4 py-2 text-sm text-amber-900" onClick={() => setNeedRefresh(false)}>Later</button>
      </div>
    </div>}
  </>
}
