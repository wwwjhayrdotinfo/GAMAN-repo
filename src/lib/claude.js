// Menu photo (or dish name) → structured dish cards, via Claude.
// Uses forced tool-use so the response is always valid JSON matching DISH_SCHEMA.

const DISH_SCHEMA = {
  type: 'object',
  properties: {
    dishes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          thai_name: { type: 'string', description: 'Dish name in Thai script (always Thai, even if the menu is English)' },
          romanized: { type: 'string', description: 'Pronunciation with tone marks, e.g. "khâao soi gài"' },
          english_name: { type: 'string' },
          description: { type: 'string', description: 'One plain-English sentence: what the dish is' },
          ingredients: { type: 'array', items: { type: 'string' }, description: '3-6 main ingredients' },
          spice_level: { type: 'integer', minimum: 0, maximum: 3 },
          northern_specialty: { type: 'boolean', description: 'True if a Northern Thai / Lanna dish' },
          how_to_eat: { type: 'string', description: 'One tip on how locals eat or customise it' },
          story: { type: 'string', description: 'One sentence of cultural context or history. No invented facts.' },
          unit: { type: 'string', enum: ['ที่', 'ชาม', 'จาน', 'แก้ว'], description: 'Thai classifier for ordering: ชาม bowl, จาน plate, แก้ว glass/drink, ที่ serving' },
          price: { type: 'string', description: 'Price as shown on the menu, if visible' },
        },
        required: ['thai_name', 'romanized', 'english_name', 'description', 'ingredients', 'spice_level', 'northern_specialty', 'how_to_eat', 'story', 'unit'],
      },
    },
  },
  required: ['dishes'],
}

const SYSTEM = `You help newcomers in Chiang Mai, Thailand understand local food and order it in Thai.
Given a menu photo or a dish name, identify each dish and explain it for a foreigner who has never seen it.
Be accurate and concise. If a menu item is unreadable, skip it. Limit to the 12 most relevant dishes.
If you are unsure about a historical or cultural fact, keep the story general rather than inventing specifics.`

export async function analyzeMenu({ settings, image, text }) {
  const content = []
  if (image) {
    content.push({ type: 'image', source: { type: 'base64', media_type: image.mediaType, data: image.base64 } })
    content.push({ type: 'text', text: 'Here is a menu from a local food spot in Chiang Mai. Explain the dishes.' })
  } else {
    content.push({ type: 'text', text: `Explain this dish (a customer typed its name, it may be misspelt or transliterated): "${text}"` })
  }

  const body = {
    model: settings.model,
    max_tokens: 4096,
    system: SYSTEM,
    tools: [{ name: 'return_dishes', description: 'Return the explained dishes', input_schema: DISH_SCHEMA }],
    tool_choice: { type: 'tool', name: 'return_dishes' },
    messages: [{ role: 'user', content }],
  }

  const useProxy = Boolean(settings.proxyUrl)
  if (!useProxy && !settings.apiKey) throw new Error('Add your Claude API key in Settings (⚙️) first, or use the demo menu.')

  const res = await fetch(useProxy ? settings.proxyUrl : 'https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: useProxy
      ? { 'content-type': 'application/json' }
      : {
          'content-type': 'application/json',
          'x-api-key': settings.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`Claude API error ${res.status}: ${err.slice(0, 300)}`)
  }
  const data = await res.json()
  const tool = data.content?.find((c) => c.type === 'tool_use')
  const dishes = tool?.input?.dishes ?? []
  return dishes.map((d, i) => ({ ...d, id: `ai-${Date.now()}-${i}` }))
}
