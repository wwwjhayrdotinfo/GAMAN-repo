import DISH_LIBRARY from '../data/dish-library.json'

export const OPTION_IDS = ['spice', 'no-coriander', 'fried-egg', 'less-sweet']
export const validOptions = (value) => Array.isArray(value) &&
  value.every((id) => OPTION_IDS.includes(id)) && new Set(value).size === value.length

export function allowedOptions(dish) {
  // Checked exact matches override AI suggestions, including old cached cards.
  const fold = (name = '') => name.normalize('NFKC').replace(/\s+/gu, '')
  const known = DISH_LIBRARY.find((entry) => fold(entry.thai_name) === fold(dish.thai_name))
  if (known) return known.allowed_options
  return validOptions(dish.allowed_options) ? dish.allowed_options : []
}
