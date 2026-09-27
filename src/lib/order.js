import { allowedOptions } from './orderOptions.js'
// Builds the Thai order sentence from templates. It's instant and consistent, with no AI call.
// Pattern: ขอ + dish + qty + classifier + options + polite particle
// Drinks get their own options (sweetness, ice, glass/bag) instead of spice and food extras.
import { DISH_LIBRARY } from './dishMatch.js'

const NUMBERS = {
  1: ['หนึ่ง', 'nùeng'], 2: ['สอง', 'sǒng'], 3: ['สาม', 'sǎam'],
  4: ['สี่', 'sìi'], 5: ['ห้า', 'hâa'],
}

const UNITS = {
  'ที่': 'thîi', 'ชาม': 'chaam', 'จาน': 'jaan', 'แก้ว': 'gâew', 'ขวด': 'khùat',
}

export const SPICE_OPTIONS = [
  { id: 'none', thai: 'ไม่เผ็ด', romanized: 'mâi phèt', english: 'Not spicy' },
  { id: 'little', thai: 'เผ็ดน้อย', romanized: 'phèt nói', english: 'A little spicy' },
  { id: 'normal', thai: '', romanized: '', english: 'Normal' },
  { id: 'extra', thai: 'เผ็ดมาก', romanized: 'phèt mâak', english: 'Extra spicy' },
]

export const EXTRA_OPTIONS = [
  { id: 'no-coriander', thai: 'ไม่ใส่ผักชี', romanized: 'mâi sài phàk-chii', english: 'No coriander' },
  { id: 'fried-egg', thai: 'ใส่ไข่ดาว', romanized: 'sài khài daao', english: 'Add a fried egg' },
  { id: 'less-sweet', thai: 'หวานน้อย', romanized: 'wǎan nói', english: 'Less sweet' },
]

export const WHERE_OPTIONS = [
  { id: 'here', thai: 'กินที่นี่', romanized: 'gin thîi nîi', english: 'Eat here' },
  { id: 'takeaway', thai: 'ใส่ถุงกลับบ้าน', romanized: 'sài thǔng glàp bâan', english: 'Take away' },
]

export const SWEETNESS_OPTIONS = [
  { id: 'normal', thai: '', romanized: '', english: 'Normal' },
  { id: 'less', thai: 'หวานน้อย', romanized: 'wǎan nói', english: 'Less sweet' },
  { id: 'none', thai: 'ไม่หวาน', romanized: 'mâi wǎan', english: 'No sugar' },
]

export const ICE_OPTIONS = [
  { id: 'normal', thai: '', romanized: '', english: 'Normal' },
  { id: 'less', thai: 'น้ำแข็งน้อย', romanized: 'náam khǎeng nói', english: 'Less ice' },
  { id: 'none', thai: 'ไม่ใส่น้ำแข็ง', romanized: 'mâi sài náam khǎeng', english: 'No ice' },
]

export const DRINK_WHERE_OPTIONS = [
  { id: 'glass', thai: 'ใส่แก้ว', romanized: 'sài gâew', english: 'In a glass (drink here)' },
  { id: 'bag', thai: 'ใส่ถุง', romanized: 'sài thǔng', english: 'In a bag (take away)' },
]

const libraryEntry = (dish) => (dish.library_id ? DISH_LIBRARY.find((d) => d.id === dish.library_id) : null)

// Library entries say whether they are drinks. AI cards not in the library count as a drink
// when their order classifier is แก้ว (glass).
export function isDrink(dish) {
  if (dish.drink === true) return true
  const entry = libraryEntry(dish)
  if (entry) return entry.drink === true
  return dish.unit === 'แก้ว'
}

// Which drink options make sense ('sweetness', 'ice'). Unknown drinks get both.
export function drinkOptions(dish) {
  if (!isDrink(dish)) return []
  return dish.drink_options ?? libraryEntry(dish)?.drink_options ?? ['sweetness', 'ice']
}

export const PARTICLES = {
  male: { thai: 'ครับ', romanized: 'khráp', orderThai: 'นะครับ', orderRomanized: 'ná khráp', english: 'I speak as male (khráp)' },
  female: { thai: 'ค่ะ', romanized: 'khâ', orderThai: 'นะคะ', orderRomanized: 'ná khá', english: 'I speak as female (khâ)' },
}

export function buildOrder(dish, { qty = 1, spice = 'normal', extras = [], where = 'here', particle = 'male', sweetness = 'normal', ice = 'normal' }) {
  if (isDrink(dish)) {
    // The food-style 'less-sweet' extra (when the dish allows it) still means less sweet.
    const lessSweetExtra = extras.includes('less-sweet') && allowedOptions(dish).includes('less-sweet')
    return buildDrinkOrder(dish, { qty, where, particle, ice, sweetness: sweetness === 'normal' && lessSweetExtra ? 'less' : sweetness })
  }
  const unitThai = UNITS[dish.unit] ? dish.unit : 'ที่'
  const [numThai, numRom] = NUMBERS[qty] ?? [String(qty), String(qty)]
  const allowed = allowedOptions(dish)
  const spiceOpt = allowed.includes('spice') ? SPICE_OPTIONS.find((s) => s.id === spice) : null
  const extraOpts = EXTRA_OPTIONS.filter((e) => extras.includes(e.id) && allowed.includes(e.id))
  const whereOpt = WHERE_OPTIONS.find((w) => w.id === where)
  const p = PARTICLES[particle]

  const parts = [
    { thai: `ขอ${dish.thai_name}`, romanized: `khǎw ${dish.romanized}`, english: `Could I have ${dish.english_name}` },
    { thai: `${numThai}${unitThai}`, romanized: `${numRom} ${UNITS[unitThai]}`, english: `× ${qty}` },
    spiceOpt?.thai && spiceOpt,
    ...extraOpts,
    whereOpt,
    { thai: p.orderThai, romanized: p.orderRomanized, english: '(polite)' },
  ].filter(Boolean)

  return {
    thai: parts.map((x) => x.thai).join(' '),
    romanized: parts.map((x) => x.romanized).join(' '),
    english: parts.map((x) => x.english).filter((e) => e !== '(polite)').join(', '),
  }
}

function buildDrinkOrder(dish, { qty, where, particle, sweetness, ice }) {
  const unitThai = UNITS[dish.unit] ? dish.unit : 'แก้ว'
  const [numThai, numRom] = NUMBERS[qty] ?? [String(qty), String(qty)]
  const allowed = drinkOptions(dish)
  const sweetOpt = allowed.includes('sweetness') && SWEETNESS_OPTIONS.find((s) => s.id === sweetness)
  const iceOpt = allowed.includes('ice') && ICE_OPTIONS.find((i) => i.id === ice)
  const whereOpt = DRINK_WHERE_OPTIONS.find((w) => w.id === where)
  const p = PARTICLES[particle]

  const parts = [
    { thai: `ขอ${dish.thai_name}`, romanized: `khǎw ${dish.romanized}`, english: `Could I have ${dish.english_name}` },
    { thai: `${numThai}${unitThai}`, romanized: `${numRom} ${UNITS[unitThai]}`, english: `× ${qty}` },
    sweetOpt?.thai && sweetOpt,
    iceOpt?.thai && iceOpt,
    whereOpt,
    { thai: p.orderThai, romanized: p.orderRomanized, english: '(polite)' },
  ].filter(Boolean)

  return {
    thai: parts.map((x) => x.thai).join(' '),
    romanized: parts.map((x) => x.romanized).join(' '),
    english: parts.map((x) => x.english).filter((e) => e !== '(polite)').join(', '),
  }
}
