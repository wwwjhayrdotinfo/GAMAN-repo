// Public endpoint; the Anthropic API key stays in Supabase secrets.
export const MENU_API_URL = 'https://mvbdtvwamydfojoetdca.supabase.co/functions/v1/anthropic'
const KEY = 'gaman.settings.v1'

export const DEFAULT_SETTINGS = { particle: 'male' }

export function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}')
    // Ignore legacy API keys, proxy URLs, tokens and models stored by older builds.
    return { particle: saved?.particle === 'female' ? 'female' : 'male' }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(s) {
  localStorage.setItem(KEY, JSON.stringify({ particle: s.particle }))
}

const PHRASES_KEY = 'gaman.myThai.v1'

export function loadMyThai() {
  try { return JSON.parse(localStorage.getItem(PHRASES_KEY) || '[]') } catch { return [] }
}

export function saveMyThai(list) {
  localStorage.setItem(PHRASES_KEY, JSON.stringify(list))
}
