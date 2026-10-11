"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useSprout } from "./SproutProvider";

const STARTERS = [
  "Help me plan a study session",
  "I'm feeling overwhelmed",
  "Suggest a quick outdoor break",
];

export default function SproutApp() {
  const { messages, sending, send, phone, setPhone, textStatus } = useSprout();
  const [draft, setDraft] = useState("");
  const [phoneDraft, setPhoneDraft] = useState("");
  const [phoneError, setPhoneError] = useState("");
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

  function savePhone(event: FormEvent) {
    event.preventDefault();

    const cleaned = phoneDraft.replace(/[\s().-]/g, "");

    if (!/^\+[1-9]\d{7,14}$/.test(cleaned)) {
      setPhoneError("Use international format, e.g. +19195551234");
      return;
    }

    setPhoneError("");
    setPhone(cleaned);
    setPhoneDraft("");
  }

  return (
    <div className="sprout-chat">
      <details className="sprout-texts">
        <summary>
          📱 Texts from Sprout: {phone ? `on (${phone})` : "off"}
        </summary>

        {phone ? (
          <div className="sprout-texts-body">
            <p>
              Sprout will text you when a focus timer starts or ends, and when
              you send a study spot to Sprout.
            </p>
            <button
              type="button"
              className="sprout-chip"
              onClick={() => setPhone("")}
            >
              Turn off and forget my number
            </button>
          </div>
        ) : (
          <form className="sprout-texts-body" onSubmit={savePhone}>
            <p>
              Want texts when your timer starts or ends, or about weather at
              your study spot? Your number stays in this browser.
            </p>
            <div className="sprout-form">
              <input
                className="sprout-input"
                value={phoneDraft}
                onChange={(event) => setPhoneDraft(event.target.value)}
                placeholder="+19195551234"
                aria-label="Phone number for Sprout texts"
                inputMode="tel"
              />
              <button className="sprout-send-button" type="submit">
                Turn on
              </button>
            </div>
            {phoneError && <p role="alert">{phoneError}</p>}
          </form>
        )}

        {textStatus && <p role="status">{textStatus}</p>}
      </details>

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
