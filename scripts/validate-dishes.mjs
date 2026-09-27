// Checks src/data/dish-library.json: required fields, types, allowed values, no duplicates,
// and that every demo dish in src/data/dishes.js is also in the library.
// Run: npm run validate:dishes
import { readFileSync } from 'node:fs'
import { DEMO_DISHES } from '../src/data/dishes.js'

const library = JSON.parse(readFileSync(new URL('../src/data/dish-library.json', import.meta.url), 'utf8'))
const UNITS = ['ที่', 'ชาม', 'จาน', 'แก้ว', 'ขวด']
const DRINK_OPTIONS = ['sweetness', 'ice']
const STRINGS = ['id', 'thai_name', 'romanized', 'english_name', 'description', 'how_to_eat', 'story', 'unit']
const OPTION_IDS = ['spice', 'no-coriander', 'fried-egg', 'less-sweet']
const errors = []
const seen = { id: new Set(), thai_name: new Set() }

library.forEach((d, i) => {
  const where = `#${i} (${d.id ?? 'no id'})`
  if (!Array.isArray(d.allowed_options) || d.allowed_options.some((x) => !OPTION_IDS.includes(x)) || new Set(d.allowed_options).size !== d.allowed_options.length) errors.push(`${where}: invalid allowed_options`)
  for (const k of STRINGS) if (typeof d[k] !== 'string' || !d[k].trim()) errors.push(`${where}: ${k} must be a non-empty string`)
  if (!Array.isArray(d.ingredients) || !d.ingredients.length || d.ingredients.some((x) => typeof x !== 'string')) errors.push(`${where}: ingredients must be a non-empty string array`)
  if (!Number.isInteger(d.spice_level) || d.spice_level < 0 || d.spice_level > 3) errors.push(`${where}: spice_level must be an integer 0-3`)
  if (typeof d.northern_specialty !== 'boolean') errors.push(`${where}: northern_specialty must be boolean`)
  if (!UNITS.includes(d.unit)) errors.push(`${where}: unit must be one of ${UNITS.join(' ')}`)
  if (d.drink !== undefined && d.drink !== true) errors.push(`${where}: drink must be true or absent`)
  if (d.drink && (!Array.isArray(d.drink_options) || d.drink_options.some((x) => !DRINK_OPTIONS.includes(x)))) errors.push(`${where}: drink_options must be an array of ${DRINK_OPTIONS.join(' ')}`)
  if (!d.drink && d.drink_options !== undefined) errors.push(`${where}: drink_options is only for drinks`)
  if (d.unit === 'ขวด' && !d.drink) errors.push(`${where}: unit ขวด is only for drinks`)
  if (!/^[a-z0-9-]+$/.test(d.id ?? '')) errors.push(`${where}: id must be kebab-case`)
  if (!/[\u0E00-\u0E7F]/.test(d.thai_name ?? '')) errors.push(`${where}: thai_name must be in Thai script`)
  for (const k of ['id', 'thai_name']) {
    if (seen[k].has(d[k])) errors.push(`${where}: duplicate ${k} "${d[k]}"`)
    seen[k].add(d[k])
  }
})

for (const demo of DEMO_DISHES) {
  const match = library.find((d) => d.id === demo.id)
  if (!match) errors.push(`demo dish ${demo.id} is missing from the library`)
  else if (JSON.stringify(Object.entries(match).sort()) !== JSON.stringify(Object.entries(demo).sort())) errors.push(`demo dish ${demo.id} differs from its library entry`)
}

if (errors.length) {
  console.error(`✗ ${errors.length} problem(s):\n` + errors.join('\n'))
  process.exit(1)
}
const northern = library.filter((d) => d.northern_specialty).length
const drinks = library.filter((d) => d.drink).length
console.log(`✓ ${library.length} dishes OK (${northern} Northern specialties, ${drinks} drinks)`)
