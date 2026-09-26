// Self-contained so this file can also be pasted into the Supabase dashboard.
const MAX_BODY_BYTES = 8 * 1024 * 1024;

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

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return reply(503, "Set ANTHROPIC_API_KEY in Supabase secrets.");
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

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      // Only forward the fields used by GAMAN. Keep model and token budget server-side.
      body: JSON.stringify({
        model, max_tokens: 4096,
        system: body.system, messages: body.messages,
        tools: body.tools, tool_choice: body.tool_choice,
      }),
      signal: AbortSignal.timeout(60_000),
    });
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { ...cors, "content-type": "application/json", "cache-control": "no-store" },
    });
  } catch (error) {
    return reply(error instanceof Error && error.name === "TimeoutError" ? 504 : 502,
      "Could not reach Anthropic. Please try again.");
  }
}

if (import.meta.main) Deno.serve(handler);
