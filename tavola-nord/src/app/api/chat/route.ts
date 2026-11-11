import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { brand } from "@/config/brand";
import { buildChatKnowledge } from "@/lib/chat-knowledge";
import { jsonError, readJson } from "@/lib/http";
import { allowRequest, clientKey } from "@/lib/rate-limit";

const MODEL = "claude-opus-5-5";
/** Web searches allowed per answer. Each one costs money, so keep this low. */
const MAX_SEARCHES = 3;

const chatSchema = z.object({
  locale: z.enum(["nb", "en"]),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(1500) }))
    .min(1)
    .max(30)
    .refine((m) => m[0]?.role === "user" && m.at(-1)?.role === "user"),
});

/** One line of JSON per event, so the widget can show text as it arrives. */
export type ChatEvent =
  | { type: "text"; text: string }
  | { type: "searching" }
  | { type: "sources"; sources: { url: string; title: string }[] }
  | { type: "error"; error: "server" }
  | { type: "done" };

function instructions(locale: "nb" | "en") {
  const address = `${brand.address.street}, ${brand.address.postalCode} ${brand.address.city}`;
  return `You are the online host for ${brand.fullName}, an Italian restaurant and bar at ${address} on Grünerløkka, Oslo. You chat with guests through a small window on the website.

How to answer:
- Answer from the website facts below first. They are the source of truth for the menu, prices, opening hours, bookings and events.
- Use web search only for things the website doesn't cover: Coostina's social media profiles (Facebook, Instagram, TikTok, X, YouTube), reviews and ratings (Google, Tripadvisor), news, and upcoming events posted elsewhere. Always search for "Coostina" together with "Trondheimsveien" or "Grünerløkka" so you don't confuse it with other places named Coostina. Only share a profile or page if it is clearly this restaurant. If you aren't sure, say so.
- Never invent dishes, prices, hours or events. If you don't know, say so and give the phone number (${brand.phone.display}).
- You can't book tables yourself. Send people to the booking page, or the events page for groups of ${brand.events.minGuests} or more.
- Reply in the guest's language. The site is in ${locale === "nb" ? "Norwegian" : "English"}, so use that unless they write in another language.
- Be warm and brief: 1 to 4 short sentences, or a short list. Use plain text with **bold**, "- " bullets and full https links. No headings or tables.
- Keep to Coostina and the guest's visit. Politely decline anything unrelated.
- Latency-sensitive; begin your visible answer immediately.

# Website facts
`;
}

export async function POST(request: Request) {
  const body = await readJson(request);
  if (body === undefined) return jsonError("invalid_body", 400);
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) return jsonError("validation", 400);
  const { locale, messages: history } = parsed.data;

  // Without a key the widget offers the phone number instead.
  if (!process.env.ANTHROPIC_API_KEY) return jsonError("unavailable", 503);

  try {
    if (!(await allowRequest("chat", clientKey(request.headers), 20, 600))) return jsonError("rate_limited", 429);
  } catch (error) {
    console.error("[chat] rate limit", error);
    return jsonError("server", 500);
  }

  const knowledge = await buildChatKnowledge(locale).catch((error) => {
    console.error("[chat] knowledge", error);
    return "";
  });

  const client = new Anthropic();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ChatEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      const sources = new Map<string, string>();
      const messages: Anthropic.Beta.BetaMessageParam[] = history.map((m) => ({ role: m.role, content: m.content }));

      try {
        // A web search can pause the turn. Send it back so the server picks up where it left off.
        for (let round = 0; round < 4; round++) {
          const response = client.beta.messages.stream(
            {
              model: MODEL,
              max_tokens: 4000,
              betas: ["server-side-fallback-2026-07-01"],
              fallbacks: "default",
              output_config: { effort: "low" },
              system: [{ type: "text", text: instructions(locale) + knowledge, cache_control: { type: "ephemeral" } }],
              tools: [
                {
                  type: "web_search_20260209",
                  name: "web_search",
                  max_uses: MAX_SEARCHES,
                  user_location: { type: "approximate", city: "Oslo", country: "NO", timezone: brand.timeZone },
                },
              ],
              messages,
            },
            { signal: request.signal },
          );

          for await (const event of response) {
            if (event.type === "content_block_start" && event.content_block.type === "server_tool_use") send({ type: "searching" });
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") send({ type: "text", text: event.delta.text });
          }

          const message = await response.finalMessage();
          for (const block of message.content) {
            if (block.type !== "text") continue;
            for (const citation of block.citations ?? []) {
              if (citation.type === "web_search_result_location") sources.set(citation.url, citation.title ?? citation.url);
            }
          }
          if (message.stop_reason !== "pause_turn") break;
          messages.push({ role: "assistant", content: message.content });
        }

        if (sources.size) send({ type: "sources", sources: [...sources].slice(0, 5).map(([url, title]) => ({ url, title })) });
        send({ type: "done" });
      } catch (error) {
        if (!request.signal.aborted) {
          console.error("[chat]", error instanceof Anthropic.APIError ? `${error.status} ${error.message}` : error);
          send({ type: "error", error: "server" });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
  });
}
