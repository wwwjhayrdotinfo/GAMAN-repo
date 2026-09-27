import { allowedOptions } from './orderOptions.js'
// Builds the Thai order sentence from templates. It's instant and consistent, with no AI call.
// Pattern: ขอ + dish + qty + classifier + options + polite particle

const NUMBERS = {
  1: ['หนึ่ง', 'nùeng'], 2: ['สอง', 'sǒng'], 3: ['สาม', 'sǎam'],
  4: ['สี่', 'sìi'], 5: ['ห้า', 'hâa'],
}

const UNITS = {
  'ที่': 'thîi', 'ชาม': 'chaam', 'จาน': 'jaan', 'แก้ว': 'gâew',
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
  { id: 'here', thai: 'ทานที่นี่', romanized: 'thaan thîi nîi', english: 'Eat here' },
  { id: 'takeaway', thai: 'ใส่ถุงกลับบ้าน', romanized: 'sài thǔng glàp bâan', english: 'Take away' },
]

export const PARTICLES = {
  male: { thai: 'ครับ', romanized: 'khráp', english: 'I speak as male (khráp)' },
  female: { thai: 'ค่ะ', romanized: 'khâ', english: 'I speak as female (khâ)' },
}

export function buildOrder(dish, { qty = 1, spice = 'normal', extras = [], where = 'here', particle = 'male' }) {
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
    { thai: p.thai, romanized: p.romanized, english: '(polite)' },
  ].filter(Boolean)

  return {
    thai: parts.map((x) => x.thai).join(' '),
    romanized: parts.map((x) => x.romanized).join(' '),
    english: parts.map((x) => x.english).filter((e) => e !== '(polite)').join(', '),
  }
}
