import { useRef, useState } from 'react'
import ScanScreen from './components/ScanScreen'
import DishList from './components/DishList'
import OrderScreen from './components/OrderScreen'
import VendorView from './components/VendorView'
import SettingsScreen from './components/SettingsScreen'
import MyThai from './components/MyThai'
import { DEMO_DISHES } from './data/dishes'
import { analyzeMenu } from './lib/claude'
import { applyLibrary, searchLibrary } from './lib/dishMatch'
import { fileToResizedBase64 } from './lib/image'
import { loadMyThai, loadSettings, saveMyThai, saveSettings } from './lib/settings'

// Screens: scan → dishes → order → vendor  (+ settings, mythai)
export default function App() {
  const [screen, setScreen] = useState('scan')
  const [settings, setSettings] = useState(loadSettings)
  const [dishes, setDishes] = useState([])
  const [dish, setDish] = useState(null)
  const [order, setOrder] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const busy = useRef(false)
  const scanController = useRef(null)
  const [error, setError] = useState('')
  const [myThai, setMyThai] = useState(loadMyThai)

  const go = (s) => { setScreen(s); window.scrollTo(0, 0) }

  async function run(input) {
    if (busy.current) return
    busy.current = true
    setError('')
    setLoading(true)
    const started = performance.now()
    const controller = new AbortController()
    scanController.current = controller
    let shown = false
    try {
      if (input.file) {
        setPreview(null)
        setLoadingMessage('Preparing your photo…')
        const image = await fileToResizedBase64(input.file)
        setPreview(image.previewUrl)
        input = { image }
      }
      setLoadingMessage(input.image ? 'Reading your menu…' : 'Finding your dish…')
      if (controller.signal.aborted) return
      const result = await analyzeMenu({ ...input, signal: controller.signal, onProgress: setLoadingMessage,
        onUpdate: (cards) => {
          if (controller.signal.aborted) return
          setDishes(cards)
          if (!shown) { shown = true; go('dishes') }
        },
      })
      if (controller.signal.aborted) return
      // Swap in our checked library cards wherever the scanned dish matches.
      setDishes(input.image ? result : result.map(applyLibrary))
      if (!shown) go('dishes')
    } catch (e) {
      if (controller.signal.aborted) return
      setError(e.name === 'TimeoutError' ? 'This scan took too long. Please try again with a clear photo of a smaller menu section.' : e.message)
    } finally {
      performance.measure('gaman-scan-total', { start: started, end: performance.now() })
      if (scanController.current === controller) {
        busy.current = false
        setLoading(false)
        scanController.current = null
      }
    }
  }

  function handlePhoto(file) {
    return run({ file })
  }

  function handleText(text) {
    if (busy.current) return
    setPreview(null)
    const local = searchLibrary(text).map((d) => ({ ...d, verified: 'exact', library_id: d.id }))
    if (local.length) { setError(''); setDishes(local); go('dishes'); return }
    run({ text })
  }

  function savePhrase(p) {
    if (myThai.some((x) => x.thai === p.thai)) return
    const next = [p, ...myThai]
    setMyThai(next)
    saveMyThai(next)
  }

  function removePhrase(i) {
    const next = myThai.filter((_, idx) => idx !== i)
    setMyThai(next)
    saveMyThai(next)
  }

  function updateSettings(s) {
    setSettings(s)
    saveSettings(s)
  }

  switch (screen) {
    case 'dishes':
      return <DishList dishes={dishes} preview={preview} onBack={() => { scanController.current?.abort(); scanController.current = null; busy.current = false; setLoading(false); go('scan') }} onOrder={(d) => { setDish(d); go('order') }} />
    case 'order':
      return (
        <OrderScreen
          key={dish.id}
          dish={dish}
          particle={settings.particle}
          onParticle={(p) => updateSettings({ ...settings, particle: p })}
          onBack={() => go('dishes')}
          onShowVendor={(o) => { setOrder(o); go('vendor') }}
          onSavePhrase={savePhrase}
          savedList={myThai}
        />
      )
    case 'vendor':
      return <VendorView order={order} particle={settings.particle} onClose={() => go('order')} />
    case 'settings':
      return <SettingsScreen settings={settings} onBack={() => go('scan')} onSave={(s) => { updateSettings(s); go('scan') }} />
    case 'mythai':
      return <MyThai saved={myThai} particle={settings.particle} onRemove={removePhrase} onBack={() => go('scan')} />
    default:
      return (
        <ScanScreen
          loading={loading}
          loadingMessage={loadingMessage}
          error={error}
          preview={preview}
          onPhoto={handlePhoto}
          onText={handleText}
          onDemo={() => { setPreview(null); setDishes(DEMO_DISHES); go('dishes') }}
          onSettings={() => go('settings')}
          onMyThai={() => go('mythai')}
        />
      )
  }
}
