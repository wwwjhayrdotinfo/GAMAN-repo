import { handler } from "./index.ts";

function assert(condition: unknown, message = "Assertion failed"): asserts condition {
  if (!condition) throw new Error(message);
}

Deno.test("public proxy, CORS, validation, forwarding and failures", async () => {
  const names = ["ANTHROPIC_API_KEY", "ALLOWED_ORIGIN", "ANTHROPIC_MODEL"];
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
