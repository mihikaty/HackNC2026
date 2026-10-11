"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useSprout } from "./SproutProvider";

const STARTERS = [
  "Help me plan a study session",
  "I'm feeling overwhelmed",
  "Suggest a quick outdoor break",
];

export default function SproutApp() {
  const { messages, sending, send } = useSprout();
  const [draft, setDraft] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const log = logRef.current;

    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, sending]);

  function submit(event: FormEvent) {
    event.preventDefault();

    if (sending || !draft.trim()) return;

    send(draft);
    setDraft("");
  }

  return (
    <div className="sprout-chat">
      <div
        className="sprout-log"
        ref={logRef}
        role="log"
        aria-live="polite"
        aria-label="Conversation with Sprout"
      >
        {messages.length === 0 && (
          <div className="sprout-empty">
            <div className="sprout-empty-icon" aria-hidden="true">
              🫧
            </div>
            <p>Hi, I&apos;m Sprout! Ask me anything, or pick a place to start.</p>
            <div className="sprout-starters">
              {STARTERS.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  className="sprout-chip"
                  disabled={sending}
                  onClick={() => send(starter)}
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`sprout-bubble sprout-bubble-${message.role}`}
          >
            {message.text}
          </div>
        ))}

        {sending && (
          <div className="sprout-bubble sprout-bubble-sprout sprout-typing">
            Sprout is thinking…
          </div>
        )}
      </div>

      <form className="sprout-form" onSubmit={submit}>
        <input
          className="sprout-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Message Sprout…"
          aria-label="Message Sprout"
          maxLength={1000}
        />
        <button
          className="sprout-send-button"
          type="submit"
          disabled={sending || !draft.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}
