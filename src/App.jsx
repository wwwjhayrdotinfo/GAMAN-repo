import { useState } from 'react'
import ScanScreen from './components/ScanScreen'
import DishList from './components/DishList'
import OrderScreen from './components/OrderScreen'
import VendorView from './components/VendorView'
import SettingsScreen from './components/SettingsScreen'
import MyThai from './components/MyThai'
import { DEMO_DISHES } from './data/dishes'
import { analyzeMenu } from './lib/claude'
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
  const [error, setError] = useState('')
  const [myThai, setMyThai] = useState(loadMyThai)

  const go = (s) => { setScreen(s); window.scrollTo(0, 0) }

  async function run(input) {
    setError('')
    setLoading(true)
    try {
      const result = await analyzeMenu({ settings, ...input })
      setDishes(result)
      go('dishes')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handlePhoto(file) {
    const image = await fileToResizedBase64(file)
    setPreview(image.previewUrl)
    run({ image })
  }

  function handleText(text) {
    setPreview(null)
    const q = text.toLowerCase().replace(/\s+/g, '')
    const local = DEMO_DISHES.filter((d) =>
      [d.english_name, d.romanized, d.thai_name, d.id].some((f) => f.toLowerCase().replace(/[\s-]+/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q)),
    )
    // Offline match first; fall back to Claude when a key/proxy is configured.
    if (local.length && !(settings.apiKey || settings.proxyUrl)) { setDishes(local); go('dishes'); return }
    if (!(settings.apiKey || settings.proxyUrl)) { setError(`"${text}" isn't in the offline list. Add an API key in Settings to look up any dish.`); return }
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
      return <DishList dishes={dishes} preview={preview} onBack={() => go('scan')} onOrder={(d) => { setDish(d); go('order') }} />
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
      return <VendorView order={order} onClose={() => go('order')} />
    case 'settings':
      return <SettingsScreen settings={settings} onBack={() => go('scan')} onSave={(s) => { updateSettings(s); go('scan') }} />
    case 'mythai':
      return <MyThai saved={myThai} onRemove={removePhrase} onBack={() => go('scan')} />
    default:
      return (
        <ScanScreen
          loading={loading}
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
