import assert from 'node:assert/strict'
import { createServer } from 'vite'
const vite = await createServer({server:{middlewareMode:true,hmr:false,ws:false},appType:'custom',logLevel:'error'})
try {
  const { analyzeMenu } = await vite.ssrLoadModule('/src/lib/claude.js')
  const { DISH_LIBRARY } = await vite.ssrLoadModule('/src/lib/dishMatch.js')
  const known = DISH_LIBRARY.find((dish) => dish.id === 'khao-soi')
  const image = {mediaType:'image/jpeg',base64:'test-image'}
  const tool = (name,input) => Response.json({stop_reason:'tool_use',content:[{type:'tool_use',name,input}]})
  let calls=[]
  globalThis.fetch = async (url,options) => {
    const body=JSON.parse(options.body); calls.push(body)
    return tool('return_menu_items',{items:[{thai_name:known.thai_name,english_name:known.english_name,price:'75'}]})
  }
  const exact=await analyzeMenu({image})
  assert.equal(calls.length,1,'Known dishes require only the names/price scan')
  assert.equal(exact[0].description,known.description)
  assert.equal(exact[0].price,'75')
  assert.equal(exact[0].verified,'exact')
  calls=[]
  globalThis.fetch=async(url,options)=>{
    const body=JSON.parse(options.body); calls.push(body)
    if(calls.length===1) return tool('return_menu_items',{items:[
      {thai_name:known.thai_name,english_name:known.english_name,price:'75'},
      {thai_name:'ข้าวซอยหมูกรอบ',english_name:'Crispy pork khao soi',price:'95'},
      {thai_name:'อาหารใหม่ทดสอบ',english_name:'Unknown dish',price:'125'},
    ]})
    const pending=JSON.parse(body.messages[0].content[0].text)
    assert.deepEqual(pending.map(x=>x.source_index),[1,2])
    assert.deepEqual(pending.map(x=>x.detail_level),['variant','full'])
    assert.ok(!JSON.stringify(body).includes('test-image'),'The photo is sent only once')
    return tool('return_dishes',{dishes:[
      {...known,source_index:2,thai_name:'อาหารใหม่ทดสอบ',description:'Unknown full dish'},
      {source_index:1,thai_name:'ข้าวซอยหมูกรอบ',english_name:'Crispy pork khao soi',romanized:'khao soi nuea',description:'Crispy pork curry noodles',ingredients:['crispy pork','noodles']},
    ]})
  }
  const mixed=await analyzeMenu({image})
  assert.equal(calls.length,2)
  assert.equal(mixed[1].description,'Crispy pork curry noodles')
  assert.deepEqual(mixed[1].ingredients,['crispy pork','noodles'])
  assert.equal(mixed[1].story,known.story)
  assert.equal(mixed[1].price,'95')
  assert.equal(mixed[2].description,'Unknown full dish','Response order must not change item association')
  assert.equal(mixed[2].price,'125')
  globalThis.fetch=async()=>tool('return_menu_items',{items:[]})
  assert.deepEqual(await analyzeMenu({image}),[])
  globalThis.fetch=async()=>Response.json({stop_reason:'max_tokens'})
  await assert.rejects(()=>analyzeMenu({image}),/too large/)
  const snapshots = []
  const pending = []
  let active = 0, peak = 0
  globalThis.fetch = async (url, options) => {
    const body = JSON.parse(options.body)
    if (body.tool_choice.name === 'return_menu_items') return tool('return_menu_items', {items: Array.from({length:5}, (_,i)=>({
      thai_name:`อาหารทดสอบใหม่${i}`,english_name:`Unknown ${i}`,price:String(50+i),
    }))})
    active++; peak=Math.max(peak,active)
    return new Promise(resolve=>pending.push({
      items:JSON.parse(body.messages[0].content[0].text),
      finish: (fail=false)=>{active--;resolve(fail ? new Response('failure',{status:500}) : tool('return_dishes', {dishes:
        JSON.parse(body.messages[0].content[0].text).map(item=>({...known,source_index:item.source_index}))}))},
    }))
  }
  const tick = () => new Promise(resolve=>setTimeout(resolve,0))
  const progressive = analyzeMenu({image,onUpdate:cards=>snapshots.push(cards)})
  await tick()
  assert.equal(snapshots[0].filter(d=>d.loading).length,5)
  assert.equal(pending.length,2)
  pending[1].finish() // Out-of-order completion should fill just these two cards.
  await tick()
  assert.equal(snapshots.at(-1).filter(d=>!d.loading).length,2)
  assert.equal(snapshots.at(-1)[2].price,'52')
  assert.equal(pending.length,3)
  pending[0].finish(true)
  pending[2].finish()
  const progressiveResult=await progressive
  assert.equal(progressiveResult.filter(d=>d.detailError).length,2)
  assert.equal(progressiveResult.filter(d=>!d.detailError).length,3)
  assert.equal(progressiveResult.some(d=>d.loading),false)
  assert.equal(peak,2)
  assert.deepEqual(snapshots[0].map(d=>d.id),progressiveResult.map(d=>d.id))
  console.log('Progressive snapshots, stable IDs, two concurrent batches, out-of-order completion and isolated failures passed.')
  console.log('Scan pipeline: exact reuse, variants, unknown dishes, price/order preservation, empty and truncated responses passed.')
} finally { await vite.close() }
