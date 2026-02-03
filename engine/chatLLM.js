const MAX_429_RETRIES = 2;
const RETRY_DELAYS_MS = [12000, 24000];

/**
 * Chat LLM client. Calls the app's /api/chat proxy (server holds OPENAI_API_KEY in env).
 * No API key is sent from the client.
 * On 429, retries up to MAX_429_RETRIES times with backoff (12s, 24s).
 *
 * @param {{ messages: Array<{ role: string, content: string }>, systemPrompt: string, model?: string }} opts
 * @param {number} retryCount
 * @returns {Promise<{ content: string, error?: string }>}
 */
export async function sendChatMessage(opts, retryCount = 0) {
  const { messages, systemPrompt, model = "gpt-4o-mini" } = opts;

  let res;
  try {
    res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, systemPrompt, model }),
    });
  } catch (err) {
    return {
      content: "",
      error: "Chat needs a backend server. Run the app locally: npm start, then open http://localhost:3000. On a static site (e.g. GitHub Pages) chat is not available.",
    };
  }

  const data = await res.json().catch(() => ({}));
  const contentType = res.headers.get("content-type") || "";
  const isStaticSite =
    res.status === 404 ||
    (contentType.includes("text/html") && !data.choices?.length);
  const staticSiteMessage =
    "Chat isn’t available on this page. It only works when you run the app locally (npm start) or deploy the Node server with OPENAI_API_KEY set. This site is static and has no backend.";

  const getErrorMsg = () => {
    if (isStaticSite) return staticSiteMessage;
    const err = data.error;
    if (res.status === 429) {
      return "Too many requests. Please wait a minute and try again.";
    }
    if (typeof err === "string") return err;
    if (err && typeof err.message === "string") return err.message;
    return "Could not reach the API. Run the app locally (npm start) so chat can use the server, or check that OPENAI_API_KEY is set on your backend.";
  };

  if (!res.ok) {
    if (res.status === 429 && retryCount < MAX_429_RETRIES) {
      const retryAfter = res.headers.get("Retry-After");
      const delayMs = retryAfter
        ? Math.min(Number(retryAfter) * 1000, 60000)
        : RETRY_DELAYS_MS[retryCount] ?? 24000;
      await new Promise((r) => setTimeout(r, delayMs));
      return sendChatMessage(opts, retryCount + 1);
    }
    return { content: "", error: getErrorMsg() };
  }

  if (data.error) {
    return { content: "", error: typeof data.error === "string" ? data.error : (data.error.message || getErrorMsg()) };
  }

  if (isStaticSite) {
    return { content: "", error: staticSiteMessage };
  }

  const content = data.choices?.[0]?.message?.content ?? "";
  return { content };
}
