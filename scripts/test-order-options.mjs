import assert from 'node:assert/strict'
import { createServer } from 'vite'
const vite = await createServer({server:{middlewareMode:true,hmr:false,ws:false},appType:'custom',logLevel:'error'})
try {
  const { buildOrder } = await vite.ssrLoadModule('/src/lib/order.js')
  const { allowedOptions } = await vite.ssrLoadModule('/src/lib/orderOptions.js')
  const { DEMO_DISHES } = await vite.ssrLoadModule('/src/data/dishes.js')
  const { default: OrderScreen } = await vite.ssrLoadModule('/src/components/OrderScreen.jsx')
  const React = await import('react')
  const { renderToStaticMarkup } = await import('react-dom/server')
  const get = id => DEMO_DISHES.find(d => d.id === id)
  const all = {spice:'extra',extras:['less-sweet','fried-egg','no-coriander']}
  const tea = buildOrder(get('cha-yen'), all).thai
  assert(tea.includes('หวานน้อย'))
  assert(!tea.includes('เผ็ด') && !tea.includes('ไข่ดาว') && !tea.includes('ผักชี'))
  for (const id of ['khao-soi','mango-sticky-rice']) {
    const result = buildOrder(get(id),all).thai
    assert(!result.includes('หวานน้อย') && !result.includes('ไข่ดาว') && !result.includes('เผ็ด'))
  }
  const rice = buildOrder(get('pad-kra-pao'),all).thai
  assert(rice.includes('เผ็ดมาก') && rice.includes('ไข่ดาว') && !rice.includes('หวานน้อย'))
  const legacy = {...get('cha-yen')}; delete legacy.allowed_options
  assert.deepEqual(allowedOptions(legacy),['less-sweet'])
  const unknown = {...legacy,thai_name:'อาหารทดสอบ',english_name:'Unknown'}
  assert.deepEqual(allowedOptions(unknown),[])
  assert.deepEqual(allowedOptions({...unknown,allowed_options:['invalid']}),[])
  assert.deepEqual(allowedOptions({...unknown,allowed_options:['spice','spice']}),[])
  assert(!buildOrder(unknown,all).thai.includes('หวานน้อย'))
  const render = dish => renderToStaticMarkup(React.createElement(OrderScreen,{dish,particle:'male',savedList:[]}))
  const teaHtml=render(get('cha-yen'))
  assert(teaHtml.includes('Less sweet') && !teaHtml.includes('Add a fried egg') && !teaHtml.includes('>Spice<'))
  const soupHtml=render(get('khao-soi'))
  assert(!soupHtml.includes('>Extras<') && !soupHtml.includes('>Spice<'))
  assert(soupHtml.includes('How many?') && soupHtml.includes('Where?') && soupHtml.includes('Polite ending'))
  console.log('Dish-specific controls, order filtering, library precedence and legacy fallbacks passed.')
} finally { await vite.close() }
