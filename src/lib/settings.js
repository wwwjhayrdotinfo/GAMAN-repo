// Settings live in localStorage only. Nothing here is ever committed or sent anywhere except the API.
const KEY = 'gaman.settings.v1'

export const DEFAULT_SETTINGS = {
  apiKey: '',
  proxyUrl: '', // optional: Supabase Edge Function or Cloudflare Worker URL
  proxyToken: '', // shared access token for the Supabase function
  model: 'claude-sonnet-4-5',
  particle: 'male',
}

export function loadSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(s) {
  localStorage.setItem(KEY, JSON.stringify(s))
}

const PHRASES_KEY = 'gaman.myThai.v1'

export function loadMyThai() {
  try { return JSON.parse(localStorage.getItem(PHRASES_KEY) || '[]') } catch { return [] }
}

export function saveMyThai(list) {
  localStorage.setItem(PHRASES_KEY, JSON.stringify(list))
}
