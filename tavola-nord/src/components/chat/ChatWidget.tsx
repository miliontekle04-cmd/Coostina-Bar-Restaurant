"use client";

import { Fragment, useCallback, useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import type { ChatEvent } from "@/app/api/chat/route";
import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/routes";

type Source = { url: string; title: string };
type Message = { role: "user" | "assistant"; content: string; sources?: Source[]; failed?: boolean };
type Status = "idle" | "thinking" | "searching" | "streaming";

const STORE_KEY = "coostina-chat";
const TEASER_KEY = "coostina-chat-teaser";

function load<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private browsing can block storage. The chat still works, it just isn't remembered.
  }
}

/** Bold, links and bare URLs. Everything else stays plain text, so model output can't inject markup. */
function inline(text: string): ReactNode[] {
  const pattern = /\*\*(.+?)\*\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)|(https?:\/\/[^\s<]+[^\s<.,;:!?)\]"'])/g;
  const out: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > last) out.push(text.slice(last, match.index));
    if (match[1]) out.push(<strong key={match.index}>{match[1]}</strong>);
    else {
      const href = match[3] ?? match[4] ?? "";
      const label = match[2] ?? href.replace(/^https?:\/\/(www\.)?/, "");
      out.push(<ChatLink key={match.index} href={href}>{label}</ChatLink>);
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function ChatLink({ href, children }: { href: string; children: ReactNode }) {
  let external = true;
  try {
    external = new URL(href, window.location.href).origin !== window.location.origin;
  } catch {
    // Treat anything odd as external.
  }
  return (
    <a href={href} className="break-words font-medium text-tomato underline" {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {children}
    </a>
  );
}

function RichText({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (!list.length) return;
    blocks.push(
      <ul key={`ul${blocks.length}`} className="my-1 list-disc space-y-0.5 pl-5">
        {list.map((item, i) => (
          <li key={i}>{inline(item)}</li>
        ))}
      </ul>,
    );
    list = [];
  };
  for (const line of text.split("\n")) {
    const bullet = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/);
    if (bullet) {
      list.push(bullet[1] ?? "");
      continue;
    }
    flush();
    const clean = line.replace(/^#+\s*/, "");
    if (clean.trim()) blocks.push(<p key={`p${blocks.length}`}>{inline(clean)}</p>);
  }
  flush();
  return <div className="space-y-1.5">{blocks}</div>;
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 3c5 0 9 3.4 9 7.6s-4 7.6-9 7.6c-.9 0-1.8-.1-2.6-.3L5 20.5l1-3.9C4.2 15.2 3 13 3 10.6 3 6.4 7 3 12 3Zm-4 6.6a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2Zm4 0a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2Zm4 0a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2Z"
      />
    </svg>
  );
}

function CloseIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function Mark() {
  return (
    <span aria-hidden="true" className="display flex size-9 shrink-0 items-center justify-center rounded-full border border-oil text-lg text-oil">
      C
    </span>
  );
}

/** A host in the bottom-right corner that greets visitors and answers from the website, then the web. */
export function ChatWidget({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).chat;
  const [open, setOpen] = useState(false);
  const [teaser, setTeaser] = useState(false);
  // On phones the chat waits until the visitor scrolls, so it never covers the opening text.
  const [scrolled, setScrolled] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const panelId = useId();
  const launcherRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const busy = status !== "idle";

  // Pick up the conversation from earlier in this visit, and greet first-time visitors after a moment.
  useEffect(() => {
    setMessages(load<Message[]>(`${STORE_KEY}-${locale}`, []));
    if (load(TEASER_KEY, false)) return;
    const timer = window.setTimeout(() => setTeaser(true), 2500);
    return () => window.clearTimeout(timer);
  }, [locale]);

  useEffect(() => {
    if (status === "idle") save(`${STORE_KEY}-${locale}`, messages);
  }, [messages, status, locale]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages, status, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 240);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const phoneHidden = scrolled ? "" : "max-sm:hidden";

  const hideTeaser = useCallback(() => {
    setTeaser(false);
    save(TEASER_KEY, true);
  }, []);

  const openChat = () => {
    hideTeaser();
    setOpen(true);
  };

  const closeChat = () => {
    setOpen(false);
    launcherRef.current?.focus();
  };

  async function ask(question: string) {
    const text = question.trim();
    if (!text || busy) return;
    const history: Message[] = [...messages.filter((m) => !m.failed), { role: "user", content: text }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setStatus("thinking");

    const update = (patch: Partial<Message>) =>
      setMessages((current) => {
        const next = current.slice();
        const last = next.at(-1);
        if (!last) return current;
        next[next.length - 1] = { ...last, ...patch, content: last.content + (patch.content ?? "") };
        return next;
      });

    const controller = new AbortController();
    abortRef.current = controller;
    let received = "";

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, messages: history.slice(-20).map(({ role, content }) => ({ role, content })) }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        const message = response.status === 503 ? t.unavailable : response.status === 429 ? t.rateLimited : t.error;
        update({ content: message, failed: true });
        return;
      }

      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as ChatEvent;
          if (event.type === "text") {
            received += event.text;
            setStatus("streaming");
            update({ content: event.text });
          } else if (event.type === "searching") {
            setStatus("searching");
            // Text before a search is usually "let me look that up". Start the answer on a new line.
            if (received && !received.endsWith("\n")) {
              received += "\n\n";
              update({ content: "\n\n" });
            }
          } else if (event.type === "sources") update({ sources: event.sources });
          else if (event.type === "error") {
            update({ content: `${received ? "\n\n" : ""}${t.error}`, failed: !received });
            received = received || t.error;
          }
        }
      }
      if (!received.trim()) update({ content: t.empty, failed: true });
    } catch {
      if (!controller.signal.aborted) update({ content: received ? `\n\n${t.error}` : t.error, failed: !received });
    } finally {
      abortRef.current = null;
      setStatus("idle");
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void ask(input);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void ask(input);
    }
  }

  function restart() {
    abortRef.current?.abort();
    setMessages([]);
    setStatus("idle");
    inputRef.current?.focus();
  }

  const last = messages[messages.length - 1];
  const waiting = busy && (!last?.content || status === "searching");

  return (
    <div className="on-dark">
      {open && (
        <section
          id={panelId}
          role="dialog"
          aria-label={t.title}
          onKeyDown={(event) => event.key === "Escape" && closeChat()}
          className="fixed inset-3 z-[60] flex flex-col overflow-hidden rounded-2xl bg-paper text-ink shadow-[0_18px_48px_#00000059] ring-1 ring-ink/10 sm:inset-x-auto sm:bottom-24 sm:right-6 sm:top-auto sm:h-[min(36rem,calc(100dvh-8rem))] sm:w-[23.5rem]"
        >
          <header className="flex items-center gap-3 bg-lagoon px-4 py-3 text-mist">
            <Mark />
            <div className="min-w-0 flex-1">
              <h2 className="display text-xl leading-tight">{t.title}</h2>
              <p className="truncate text-sm text-mist/75">{t.subtitle}</p>
            </div>
            {messages.length > 0 && (
              <button type="button" onClick={restart} className="rounded-full px-2.5 py-1.5 text-sm text-mist/85 hover:bg-white/10 hover:text-mist">
                {t.restart}
              </button>
            )}
            <button type="button" onClick={closeChat} aria-label={t.close} className="inline-flex size-10 items-center justify-center rounded-full hover:bg-white/10">
              <CloseIcon />
            </button>
          </header>

          <div ref={logRef} role="log" aria-label={t.log} aria-live="polite" aria-busy={busy} className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4 text-[0.9375rem] leading-relaxed">
            <div className="flex gap-2">
              <Mark />
              <div className="rounded-2xl rounded-tl-sm bg-mist px-3.5 py-2.5">
                <span className="sr-only">{t.bot}: </span>
                {t.welcome}
              </div>
            </div>

            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2 pl-11">
                {t.suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void ask(s)}
                    className="rounded-full border border-tomato/40 px-3 py-1.5 text-left text-sm text-tomato hover:border-tomato hover:bg-tomato hover:text-paper"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {messages.map((message, i) =>
              message.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-tr-sm bg-lagoon px-3.5 py-2.5 text-mist">
                    <span className="sr-only">{t.you}: </span>
                    {message.content}
                  </p>
                </div>
              ) : message.content ? (
                <div key={i} className="flex gap-2">
                  <Mark />
                  <div className={`min-w-0 max-w-[85%] rounded-2xl rounded-tl-sm px-3.5 py-2.5 ${message.failed ? "bg-tomato/10" : "bg-mist"}`}>
                    <span className="sr-only">{t.bot}: </span>
                    <RichText text={message.content} />
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-2 border-t border-line pt-2 text-sm">
                        <p className="font-semibold text-ink-soft">{t.sources}</p>
                        <ul className="mt-0.5 space-y-0.5">
                          {message.sources.map((s) => (
                            <li key={s.url} className="truncate">
                              <ChatLink href={s.url}>{s.title}</ChatLink>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <Fragment key={i} />
              ),
            )}

            {waiting && (
              <div className="flex items-center gap-2 pl-11 text-sm text-ink-soft">
                <span className="chat-dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                {status === "searching" ? t.searching : t.thinking}
              </div>
            )}
          </div>

          <form onSubmit={onSubmit} className="border-t border-line bg-paper px-3 pb-2 pt-3">
            <div className="flex items-end gap-2">
              <label htmlFor={`${panelId}-input`} className="sr-only">
                {t.placeholder}
              </label>
              <textarea
                id={`${panelId}-input`}
                ref={inputRef}
                rows={1}
                value={input}
                maxLength={1500}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={t.placeholder}
                className="max-h-32 min-h-11 flex-1 resize-none rounded-[var(--radius-field)] border border-ink/25 bg-white px-3 py-2.5 text-base leading-snug text-ink placeholder:text-ink-soft focus:border-lagoon"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                aria-label={t.send}
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-oil text-ink hover:bg-[#dcbb7b] disabled:opacity-45"
              >
                <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
                  <path fill="currentColor" d="M3.4 20.4 21 12 3.4 3.6l-.1 6.5L15 12l-11.7 1.9.1 6.5Z" />
                </svg>
              </button>
            </div>
            <p className="mt-1.5 text-center text-xs text-ink-soft">{t.disclaimer}</p>
          </form>
        </section>
      )}

      {teaser && !open && (
        <div className={`${phoneHidden} fixed bottom-[9.75rem] right-3 z-50 flex max-w-[16rem] items-start gap-1 rounded-2xl rounded-br-sm bg-paper py-2.5 pl-3.5 pr-1.5 text-[0.9375rem] text-ink shadow-[0_8px_24px_#0000004d] ring-1 ring-ink/10 sm:bottom-[6.75rem] sm:right-6`}>
          <button type="button" onClick={openChat} className="text-left">
            {t.teaser}
          </button>
          <button type="button" onClick={hideTeaser} aria-label={t.dismissTeaser} className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-ink-soft hover:bg-ink/10">
            <CloseIcon className="size-4" />
          </button>
        </div>
      )}

      <button
        ref={launcherRef}
        type="button"
        onClick={() => (open ? closeChat() : openChat())}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={open ? t.close : t.open}
        className={`fixed bottom-[5.5rem] right-3 z-50 inline-flex ${open ? "max-sm:hidden" : phoneHidden} size-14 items-center justify-center rounded-full bg-lagoon text-oil shadow-[0_8px_24px_#0000004d] ring-1 ring-oil/50 transition-transform hover:scale-105 sm:bottom-6 sm:right-6`}
      >
        {open ? <CloseIcon className="size-6" /> : <ChatIcon />}
      </button>
    </div>
  );
}
