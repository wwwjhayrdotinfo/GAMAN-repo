import assert from 'node:assert/strict'
import { createServer } from 'vite'
const vite = await createServer({server:{middlewareMode:true,hmr:false,ws:false},appType:'custom',logLevel:'error'})
try {
  const { buildOrder } = await vite.ssrLoadModule('/src/lib/order.js')
  const { DEMO_DISHES } = await vite.ssrLoadModule('/src/data/dishes.js')
  const { VENDOR_REPLIES, QUICK_ANSWERS } = await vite.ssrLoadModule('/src/data/phrases.js')
  const { genderFromText } = await vite.ssrLoadModule('/src/lib/speak.js')
  for (const [particle, ending, pronunciation] of [['male','นะครับ','ná khráp'],['female','นะคะ','ná khá']]) {
    for (const id of ['khao-soi','cha-yen']) {
      const order = buildOrder(DEMO_DISHES.find(d => d.id === id),{particle,where:id === 'cha-yen' ? 'glass' : 'here'})
      assert(order.thai.endsWith(ending))
      assert(order.romanized.endsWith(pronunciation))
      assert.equal(genderFromText(order.thai),particle)
      assert(!order.thai.includes('นะค่ะ') && !order.thai.includes('นะนะ'))
      if (id === 'khao-soi') {
        assert(order.thai.includes('กินที่นี่'))
        assert(order.romanized.includes('gin thîi nîi'))
      }
    }
  }
  assert(VENDOR_REPLIES.some(p => p.thai === 'รอแป๊บนึงนะ'))
  assert(VENDOR_REPLIES.some(p => p.thai === 'กินที่นี่หรือกลับบ้าน'))
  assert(QUICK_ANSWERS.some(p => p.thai === 'กินที่นี่' && p.romanized === 'gin thîi nîi'))
  assert(!JSON.stringify([...VENDOR_REPLIES,...QUICK_ANSWERS]).includes('ทาน'))
  console.log('Updated Thai phrases, food/drink polite endings, pronunciation and voice selection passed.')
} finally { await vite.close() }
