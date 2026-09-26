// Optional Cloudflare Worker that keeps the Claude API key off the client.
// Deploy: `npx wrangler deploy proxy/worker.js --name gaman-proxy`
//         `npx wrangler secret put ANTHROPIC_API_KEY --name gaman-proxy`
// Then paste the worker URL into the app's Settings → Proxy URL.
export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'content-type',
    }
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors })
    if (request.method !== 'POST') return new Response('POST only', { status: 405, headers: cors })

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: await request.text(),
    })
    return new Response(res.body, { status: res.status, headers: { ...cors, 'content-type': 'application/json' } })
  },
}
