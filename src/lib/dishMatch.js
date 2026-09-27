// Match dishes from a menu scan to our checked dish library (src/data/dish-library.json).
// Exact Thai-name match → our checked card replaces the AI card.
// Base match (same dish, different protein/topping, e.g. "ผัดกะเพราไก่" vs "ผัดกะเพราหมูสับ")
//   → keep the AI's name, description and ingredients (they mention the right protein),
//     but use our checked tips, story, spice level, Northern flag and order unit.
// No match → the AI card is kept as-is.
import DISH_LIBRARY from '../data/dish-library.json'

export { DISH_LIBRARY }

// Protein/topping words that commonly end a dish name on Thai menus. Longest first.
const SUFFIXES = ['ปลาหมึก', 'เนื้อสับ', 'ไก่สับ', 'หมูสับ', 'หมูกรอบ', 'หมูชิ้น', 'ไข่ดาว', 'ทะเล', 'พิเศษ', 'เนื้อ', 'กุ้ง', 'หมู', 'ไก่', 'ปลา', 'ปู', 'ไทย']
const MIN_BASE_LENGTH = 4 // avoid over-general keys such as "ผัด"

// Common menu spellings → the spelling used in the library.
const SPELLING = [
  [/กระเพรา|กะเพา|กระเพา/g, 'กะเพรา'],
  [/^ข้าว(ผัด)?กะเพรา/, 'ผัดกะเพรา'], // "ข้าวกะเพราไก่" (basil stir-fry on rice) is our pad kra pao
  [/ไข่(เป็ด)?ดาว$/, 'ไข่ดาว'], // "ใส่ไข่ดาว" / "ไข่เป็ดดาว" = with a fried egg
  [/ใส่ไข่ดาว$/, 'ไข่ดาว'],
]

export function normalizeThai(name = '') {
  let s = name.replace(/\(.*?\)/g, '') // drop "(หมู/ไก่)" style options
  s = s.replace(/[^\u0E00-\u0E7F]/g, '') // Thai script only: no spaces, prices, latin
  for (const [re, to] of SPELLING) s = s.replace(re, to)
  return s
}

// The name, then the name with trailing protein/topping words removed one at a time.
function stages(name) {
  const out = [name]
  let s = name
  for (;;) {
    const suffix = SUFFIXES.find((x) => s.endsWith(x) && s.length > x.length)
    if (!suffix) return out
    s = s.slice(0, -suffix.length)
    out.push(s)
  }
}

function buildIndex(library) {
  const exact = new Map()
  const base = new Map()
  for (const dish of library) {
    const [full, ...rest] = stages(normalizeThai(dish.thai_name))
    if (!exact.has(full)) exact.set(full, dish)
    for (const s of rest) if (s.length >= MIN_BASE_LENGTH && !base.has(s)) base.set(s, dish)
  }
  return { exact, base }
}

const INDEX = buildIndex(DISH_LIBRARY)

// → { dish, type: 'exact' | 'base' } or null
export function findDish(thaiName, index = INDEX) {
  const [full, ...rest] = stages(normalizeThai(thaiName))
  if (!full) return null
  if (index.exact.has(full)) return { dish: index.exact.get(full), type: 'exact' }
  for (const s of [full, ...rest]) {
    // A stripped scan name can equal a whole library name ("ลาบหมู" → "ลาบ").
    if (s !== full && index.exact.has(s)) return { dish: index.exact.get(s), type: 'base' }
    if (s.length >= MIN_BASE_LENGTH && index.base.has(s)) return { dish: index.base.get(s), type: 'base' }
  }
  return null
}

export function applyLibrary(aiDish) {
  const match = findDish(aiDish.thai_name)
  if (!match) return aiDish
  const { dish, type } = match
  if (type === 'exact') {
    return { ...dish, id: aiDish.id, price: aiDish.price, verified: 'exact', library_id: dish.id }
  }
  return {
    ...aiDish,
    how_to_eat: dish.how_to_eat,
    story: dish.story,
    northern_specialty: dish.northern_specialty,
    spice_level: dish.spice_level,
    unit: dish.unit,
    allowed_options: dish.allowed_options,
    verified: 'base',
    library_id: dish.id,
  }
}

// Offline text search over the library (English, romanised, Thai or id).
export function searchLibrary(text) {
  const fold = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\s-]+/g, '')
  const q = fold(text)
  if (!q) return []
  return DISH_LIBRARY.filter((d) => [d.english_name, d.romanized, d.thai_name, d.id].some((f) => fold(f).includes(q)))
}
