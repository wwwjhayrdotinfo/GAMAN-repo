import { handler } from "./index.ts";

function assert(condition: unknown, message = "Assertion failed"): asserts condition {
  if (!condition) throw new Error(message);
}

Deno.test("public proxy, CORS, validation, forwarding and failures", async () => {
  const names = ["ANTHROPIC_API_KEY", "ALLOWED_ORIGIN", "ANTHROPIC_MODEL", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
  const saved = names.map((name) => Deno.env.get(name));
  const originalFetch = globalThis.fetch;
  let calls = 0;
  const payload = {
    model: "client-model-is-ignored", max_tokens: 999999, stream: true,
    messages: [{ role: "user", content: [
      { type: "image", source: { type: "base64", media_type: "image/jpeg", data: "sample" } },
      { type: "text", text: "Explain this menu" },
    ] }],
    tools: [{ name: "return_dishes", input_schema: { type: "object" } }],
    tool_choice: { type: "tool", name: "return_dishes" },
  };
  const request = (body = JSON.stringify(payload), origin = "https://example.com") => new Request("https://example.com/functions/v1/anthropic", {
    method: "POST", headers: { "content-type": "application/json", origin }, body,
  });
  try {
    Deno.env.delete("SUPABASE_URL");
    Deno.env.delete("SUPABASE_SERVICE_ROLE_KEY");
    Deno.env.set("ANTHROPIC_API_KEY", "test-key");
    Deno.env.set("ALLOWED_ORIGIN", "https://example.com");
    Deno.env.delete("ANTHROPIC_MODEL");
    globalThis.fetch = async (url, init) => {
      calls++;
      assert(url === "https://api.anthropic.com/v1/messages");
      const headers = new Headers(init?.headers);
      assert(headers.get("x-api-key") === "test-key");
      assert(!headers.has("x-proxy-token"));
      const forwarded = JSON.parse(String(init?.body));
      assert(forwarded.max_tokens === 4096 && !forwarded.stream);
      assert(forwarded.model === "claude-sonnet-4-5");
      assert(JSON.stringify(forwarded.messages) === JSON.stringify(payload.messages));
      assert(JSON.stringify(forwarded.tools) === JSON.stringify(payload.tools));
      return Response.json({ content: [{ type: "tool_use", input: { dishes: [{ thai_name: "ข้าวซอย" }] } }] });
    };
    const preflight = await handler(new Request("https://example.com", { method: "OPTIONS" }));
    assert(preflight.status === 204);
    assert(preflight.headers.get("access-control-allow-headers")?.includes("x-proxy-token"));
    assert((await handler(new Request("https://example.com"))).status === 405);
    assert((await handler(request(undefined, "https://other.com"))).status === 403);
    assert((await handler(request("{"))).status === 400);
    assert((await handler(request("null"))).status === 400);
    assert((await handler(request(" ".repeat(8 * 1024 * 1024 + 1)))).status === 413);
    assert(calls === 0, "Rejected requests must not call Anthropic");
    const result = await handler(request());
    assert(result.status === 200);
    assert(result.headers.get("access-control-allow-origin") === "https://example.com");
    assert((await result.json()).content[0].input.dishes[0].thai_name === "ข้าวซอย");
    globalThis.fetch = async () => Response.json({ error: { message: "Rate limited" } }, { status: 429 });
    const limited = await handler(request());
    assert(limited.status === 429 && (await limited.json()).error.message === "Rate limited");
    globalThis.fetch = () => Promise.reject(new Error("network"));
    assert((await handler(request())).status === 502);
    globalThis.fetch = () => Promise.reject(new DOMException("timeout", "TimeoutError"));
    assert((await handler(request())).status === 504);
    Deno.env.delete("ANTHROPIC_API_KEY");
    assert((await handler(request())).status === 503);
  } finally {
    globalThis.fetch = originalFetch;
    names.forEach((name, i) => saved[i] === undefined ? Deno.env.delete(name) : Deno.env.set(name, saved[i]!));
  }
});

Deno.test("persistent cache reuses normalized text, isolates photos/models, and survives DB failures", async () => {
  const names = ["ANTHROPIC_API_KEY", "ALLOWED_ORIGIN", "ANTHROPIC_MODEL", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
  const saved = names.map((name) => Deno.env.get(name));
  const originalFetch = globalThis.fetch;
  const entries = new Map<string, {response: unknown; expires_at: string}>();
  let aiCalls = 0;
  let databaseDown = false;
  let malformed = false;
  const dish = {thai_name: "ข้าวซอย", english_name: "Khao Soi", romanized: "khâao soi", description: "Curry noodles",
    ingredients: ["noodles", "coconut milk"], spice_level: 1, northern_specialty: true,
    how_to_eat: "Add lime", story: "A northern Thai dish", unit: "ชาม", price: "60"};
  const request = (name: string, image?: string) => new Request("https://example.com", {
    method: "POST", headers: {"content-type": "application/json"},
    body: JSON.stringify({ system: "GAMAN", messages: [{role: "user", content: image
      ? [{type: "image", source: {type: "base64", media_type: "image/jpeg", data: image}}]
      : [{type: "text", text: `Explain this dish (a customer typed its name, it may be misspelt or transliterated): "${name}"`}]}]}),
  });
  try {
    Deno.env.set("SUPABASE_URL", "https://db.example.com");
    Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "server-only");
    Deno.env.set("ANTHROPIC_API_KEY", "test-key");
    Deno.env.delete("ALLOWED_ORIGIN");
    Deno.env.delete("ANTHROPIC_MODEL");
    globalThis.fetch = async (input, init) => {
      const url = new URL(String(input));
      if (url.hostname === "api.anthropic.com") {
        aiCalls++;
        assert(new Headers(init?.headers).get("authorization") === null, "DB key must not reach Anthropic");
        return Response.json({stop_reason: malformed ? "max_tokens" : "tool_use", content: [
          {type: "tool_use", name: "return_dishes", input: {dishes: [dish]}}
        ]});
      }
      assert(url.hostname === "db.example.com");
      assert(new Headers(init?.headers).get("authorization") === "Bearer server-only");
      if (databaseDown) return new Response("unavailable", {status: 503});
      if (init?.method === "POST") {
        const body = JSON.parse(String(init.body));
        assert(!String(init.body).includes("photo-bytes"), "Uploaded photos must not be stored");
        if (url.pathname.endsWith("products")) {
          assert(body[0].thai_name === dish.thai_name);
          assert(!("price" in body[0].details), "Menu price must not become a product price");
        } else entries.set(body.cache_key, body);
        return new Response(null, {status: 201});
      }
      const key = url.searchParams.get("cache_key")!.slice(3);
      const row = entries.get(key);
      return Response.json(row && new Date(row.expires_at).getTime() > Date.now() ? [row] : []);
    };
    const first = await handler(request("Khao Soi"));
    assert(first.headers.get("x-gaman-cache") === "MISS");
    assert(entries.size === 1 && aiCalls === 1);
    // Even without an Anthropic key, a saved result can be served.
    Deno.env.delete("ANTHROPIC_API_KEY");
    const second = await handler(request("  khao   soi  "));
    assert(second.headers.get("x-gaman-cache") === "HIT");
    assert((await second.json()).content[0].input.dishes[0].price === "60");
    assert(aiCalls === 1);
    Deno.env.set("ANTHROPIC_API_KEY", "test-key");
    for (const row of entries.values()) row.expires_at = "2000-01-01T00:00:00Z";
    assert((await handler(request("khao soi"))).headers.get("x-gaman-cache") === "MISS");
    assert(Number(aiCalls) === 2);
    await handler(request("", "photo-bytes-A"));
    const samePhoto = await handler(request("", "photo-bytes-A"));
    assert(samePhoto.headers.get("x-gaman-cache") === "HIT");
    await handler(request("", "photo-bytes-B"));
    assert(Number(aiCalls) === 4);
    Deno.env.set("ANTHROPIC_MODEL", "other-model");
    assert((await handler(request("khao soi"))).headers.get("x-gaman-cache") === "MISS");
    assert(Number(aiCalls) === 5);
    malformed = true;
    assert((await handler(request("uncacheable"))).headers.get("x-gaman-cache") === "SKIP");
    await handler(request("uncacheable"));
    assert(Number(aiCalls) === 7, "Truncated responses must never be cached");
    malformed = false;
    databaseDown = true;
    const fallback = await handler(request("new dish"));
    assert(fallback.status === 200 && fallback.headers.get("x-gaman-cache") === "UNAVAILABLE");
  } finally {
    globalThis.fetch = originalFetch;
    names.forEach((name, i) => saved[i] === undefined ? Deno.env.delete(name) : Deno.env.set(name, saved[i]!));
  }
});

Deno.test("hosted response does not wait for slow cache writes", async () => {
  const runtimeGlobal = globalThis as typeof globalThis & { EdgeRuntime?: {waitUntil: (task: Promise<unknown>) => void} };
  const previousRuntime = runtimeGlobal.EdgeRuntime;
  const previousFetch = globalThis.fetch;
  const names = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "ANTHROPIC_API_KEY", "ALLOWED_ORIGIN"];
  const saved = names.map((name) => Deno.env.get(name));
  const tasks: Promise<unknown>[] = [];
  let releaseWrites!: () => void;
  const writeGate = new Promise<void>((resolve) => { releaseWrites = resolve; });
  let writes = 0;
  try {
    names.slice(0, 3).forEach((name, i) => Deno.env.set(name, i === 0 ? "https://db.example.com" : "test"));
    Deno.env.delete("ALLOWED_ORIGIN");
    runtimeGlobal.EdgeRuntime = {waitUntil: (task) => { tasks.push(task); }};
    globalThis.fetch = async (url, init) => {
      if (String(url).includes("api.anthropic.com")) return Response.json({stop_reason: "tool_use", content: [{
        type: "tool_use", name: "return_dishes", input: {dishes: [{thai_name: "ข้าวซอย", english_name: "Khao Soi",
          romanized: "khao soi", description: "Noodles", ingredients: ["noodles"], spice_level: 1,
          northern_specialty: true, how_to_eat: "Add lime", story: "Northern dish", unit: "ชาม"}]}
      }]});
      if (init?.method !== "POST") return Response.json([]);
      await writeGate;
      writes++;
      return new Response(null, {status: 201});
    };
    const response = await handler(new Request("https://example.com", {method: "POST",
      headers: {"content-type": "application/json"}, body: JSON.stringify({messages: [{role: "user", content: "menu"}]})}));
    assert(response.status === 200 && writes === 0, "Response should arrive before writes finish");
    assert(tasks.length === 1 && response.headers.has("server-timing"));
    releaseWrites();
    await Promise.all(tasks);
    assert(Number(writes) === 2, "Both saves must finish in the registered background task");
  } finally {
    releaseWrites();
    await Promise.allSettled(tasks);
    globalThis.fetch = previousFetch;
    runtimeGlobal.EdgeRuntime = previousRuntime;
    names.forEach((name, i) => saved[i] === undefined ? Deno.env.delete(name) : Deno.env.set(name, saved[i]!));
  }
});

Deno.test("names-only and variant responses are cached without saving incomplete products", async () => {
  const names = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "ANTHROPIC_API_KEY", "ALLOWED_ORIGIN"];
  const saved = names.map((name) => Deno.env.get(name));
  const previousFetch = globalThis.fetch;
  let row: unknown;
  let calls = 0;
  let productWrites = 0;
  let variant = false;
  try {
    Deno.env.set("SUPABASE_URL", "https://db.example.com");
    Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "server-only");
    Deno.env.set("ANTHROPIC_API_KEY", "test");
    Deno.env.delete("ALLOWED_ORIGIN");
    globalThis.fetch = async (url, init) => {
      if (String(url).includes("api.anthropic.com")) {
        calls++;
        return Response.json({stop_reason: "tool_use", content: [{type: "tool_use",
          name: variant ? "return_dishes" : "return_menu_items",
          input: variant ? {dishes: [{source_index: 0, thai_name: "ข้าวซอยหมูกรอบ", english_name: "Crispy pork noodles",
            romanized: "khao soi", description: "Curry noodles with crispy pork", ingredients: ["pork", "noodles"]}]}
            : {items: [{thai_name: "ข้าวซอยไก่", english_name: "Chicken khao soi", price: "75"}]},
        }]});
      }
      if (init?.method === "POST") {
        if (String(url).includes("products?")) productWrites++;
        else row = JSON.parse(String(init.body));
        return new Response(null, {status: 201});
      }
      return Response.json(row ? [row] : []);
    };
    const request = () => new Request("https://example.com", {method: "POST", headers: {"content-type": "application/json"},
      body: JSON.stringify({messages: [{role: "user", content: [{type: "text", text:
        variant ? JSON.stringify([{source_index: 0, detail_level: "variant"}]) : "menu"}]}]})});
    assert((await handler(request())).headers.get("x-gaman-cache") === "MISS");
    assert((await handler(request())).headers.get("x-gaman-cache") === "HIT");
    assert(calls === 1 && productWrites === 0);
    variant = true; row = undefined;
    assert((await handler(request())).headers.get("x-gaman-cache") === "MISS");
    assert((await handler(request())).headers.get("x-gaman-cache") === "HIT");
    assert(Number(calls) === 2 && productWrites === 0);
  } finally {
    globalThis.fetch = previousFetch;
    names.forEach((name, i) => saved[i] === undefined ? Deno.env.delete(name) : Deno.env.set(name, saved[i]!));
  }
});
