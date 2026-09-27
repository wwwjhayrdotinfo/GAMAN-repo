// Self-contained so this file can also be pasted into the Supabase dashboard.
const MAX_BODY_BYTES = 8 * 1024 * 1024;

type JsonObject = Record<string, unknown>;
const CACHE_VERSION = "menu-v1";

function isObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

// Stable object ordering prevents a harmless change in JSON key order from missing the cache.
function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (isObject(value)) return `{${Object.keys(value).sort().filter((key) => value[key] !== undefined)
    .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value) ?? "null";
}

async function digest(value: unknown): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(stableJson(value)));
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function normalizeName(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/gu, " ").toLowerCase();
}

function cacheInput(payload: JsonObject): JsonObject {
  const copy = structuredClone(payload);
  // Only normalize the dish name in GAMAN's typed-dish prompt. Preserve arbitrary
  // instructions, menu image bytes, system prompt and schema exactly in the key.
  const messages = copy.messages as Array<JsonObject>;
  if (messages.length === 1 && isObject(messages[0]) && messages[0].role === "user" && Array.isArray(messages[0].content)) {
    const content = messages[0].content;
    if (content.length === 1 && isObject(content[0]) && content[0].type === "text" && typeof content[0].text === "string") {
      const match = content[0].text.match(/^Explain this dish \(a customer typed its name, it may be misspelt or transliterated\): "([\s\S]*)"$/u);
      if (match && match[1]) content[0].text = `Explain this dish (a customer typed its name, it may be misspelt or transliterated): "${normalizeName(match[1])}"`;
    }
  }
  return copy;
}

function savedDishes(response: unknown): JsonObject[] | null {
  if (!isObject(response) || response.stop_reason !== "tool_use" || !Array.isArray(response.content)) return null;
  const tool = response.content.find((item: unknown) => isObject(item) && item.type === "tool_use" && item.name === "return_dishes");
  if (!isObject(tool) || !isObject(tool.input) || !Array.isArray(tool.input.dishes)) return null;
  const dishes = tool.input.dishes;
  if (!dishes.length || dishes.length > 12) return null;
  const textFields = ["thai_name", "english_name", "romanized", "description", "how_to_eat", "story", "unit"];
  if (!dishes.every((dish: unknown) => isObject(dish) &&
    textFields.every((field) => typeof dish[field] === "string" && (dish[field] as string).trim().length > 0) &&
    Array.isArray(dish.ingredients) && dish.ingredients.every((item: unknown) => typeof item === "string") &&
    Number.isInteger(dish.spice_level) && Number(dish.spice_level) >= 0 && Number(dish.spice_level) <= 3 &&
    typeof dish.northern_specialty === "boolean" && ["ที่", "ชาม", "จาน", "แก้ว"].includes(String(dish.unit)))) return null;
  return dishes as JsonObject[];
}

function database() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  return async (path: string, body?: unknown) => {
    const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        apikey: key, Authorization: `Bearer ${key}`, "content-type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(3_000),
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`Database status ${response.status}`);
    }
    if (body !== undefined) { await response.body?.cancel(); return null; }
    return await response.json();
  };
}

export async function handler(request: Request): Promise<Response> {
  const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") || "*";
  const cors = {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, x-proxy-token",
    "Vary": "Origin",
  };
  const reply = (status: number, message: string) => Response.json(
    { error: { message } }, { status, headers: cors },
  );

  const origin = request.headers.get("origin");
  if (allowedOrigin !== "*" && origin && origin !== allowedOrigin) {
    return reply(403, "Origin not allowed.");
  }
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "POST") return reply(405, "Use POST.");

  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return reply(415, "Send application/json.");
  }

  // Bound actual bytes, even when Content-Length is absent or incorrect.
  const reader = request.body?.getReader();
  if (!reader) return reply(400, "Request body is required.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        return reply(413, "Menu image is too large. Use a smaller photo.");
      }
      chunks.push(value);
    }
  } catch {
    return reply(400, "Could not read request body.");
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  let body;
  try { body = JSON.parse(new TextDecoder().decode(bytes)); }
  catch { return reply(400, "Invalid JSON."); }
  if (!body || typeof body !== "object" || !Array.isArray(body.messages) || !body.messages.length) {
    return reply(400, "A non-empty messages array is required.");
  }
  const model = Deno.env.get("ANTHROPIC_MODEL") || "claude-sonnet-4-5";
  const payload = {
    model, max_tokens: 4096,
    system: body.system, messages: body.messages,
    tools: body.tools, tool_choice: body.tool_choice,
  };
  const db = database();
  const cacheKey = await digest({ version: CACHE_VERSION, payload: cacheInput(payload) });
  const responseHeaders = { ...cors, "content-type": "application/json", "cache-control": "no-store",
    "Access-Control-Expose-Headers": "X-Gaman-Cache" };
  if (db) {
    try {
      const rows = await db(`menu_cache?cache_key=eq.${cacheKey}&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=response&limit=1`);
      if (Array.isArray(rows) && savedDishes(rows[0]?.response)) {
        return Response.json(rows[0].response, { headers: { ...responseHeaders, "X-Gaman-Cache": "HIT" } });
      }
    } catch {
      // A missing migration or temporary DB outage must not stop menu scanning.
      console.warn("Menu cache read unavailable; using Anthropic.");
    }
  }
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return reply(503, "Set ANTHROPIC_API_KEY in Supabase secrets.");

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      // Only forward the fields used by GAMAN. Keep model and token budget server-side.
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(60_000),
    });
    const responseText = await upstream.text();
    let cacheStatus = db ? "MISS" : "DISABLED";
    if (upstream.ok && db) {
      try {
        const response = JSON.parse(responseText);
        const dishes = savedDishes(response);
        if (dishes) {
          // Photos have shorter freshness because their prices belong to that menu.
          const hasImage = body.messages.some((message: JsonObject) => isObject(message) && Array.isArray(message.content) &&
            message.content.some((item: unknown) => isObject(item) && item.type === "image"));
          const ttlDays = hasImage ? 7 : 30;
          const products = await Promise.all(dishes.map(async (dish) => {
            const { price: _price, ...details } = dish;
            return {
              product_key: await digest({ version: CACHE_VERSION, model,
                thai: normalizeName(String(dish.thai_name)), english: normalizeName(String(dish.english_name)),
                ingredients: dish.ingredients }),
              thai_name: dish.thai_name, english_name: dish.english_name, details, model,
              updated_at: new Date().toISOString(),
            };
          }));
          // A menu can list the same product more than once.
          const uniqueProducts = [...new Map(products.map((product) => [product.product_key, product])).values()];
          await db("products?on_conflict=product_key", uniqueProducts);
          await db("menu_cache?on_conflict=cache_key", {
            cache_key: cacheKey, model, response,
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + ttlDays * 86_400_000).toISOString(),
          });
        } else cacheStatus = "SKIP";
      } catch {
        cacheStatus = "UNAVAILABLE";
        console.warn("Menu cache write unavailable; returning the generated result.");
      }
    }
    return new Response(responseText, {
      status: upstream.status,
      headers: { ...responseHeaders, "X-Gaman-Cache": cacheStatus },
    });
  } catch (error) {
    return reply(error instanceof Error && error.name === "TimeoutError" ? 504 : 502,
      "Could not reach Anthropic. Please try again.");
  }
}

if (import.meta.main) Deno.serve(handler);
