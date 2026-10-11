"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useSprout } from "./SproutProvider";
import styles from "./SproutApp.module.css";

const STARTERS = [
  "Help me plan a study session",
  "I'm feeling overwhelmed",
  "Suggest a quick outdoor break",
];

export default function SproutApp() {
  const { messages, sending, send, clearChat, phone, setPhone, textStatus } = useSprout();
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
    <div className={styles.chat}>
      <header className={styles.chatHeader}>
        <div>
          <p className={styles.eyebrow}>AOL-style instant message</p>
          <h2>Sprout Buddy</h2>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.online}><i /> Online</span>
          <button className={styles.newChat} type="button" onClick={clearChat} disabled={sending || messages.length === 0}>New Chat</button>
        </div>
      </header>

      <details className={styles.texts}>
        <summary>
          📱 Texts from Sprout: {phone ? `on (${phone})` : "off"}
        </summary>

        {phone ? (
            <div className={styles.textsBody}>
            <p>
              Sprout will text you when a focus timer starts or ends, and when
              you send a study spot to Sprout.
            </p>
            <button
              type="button"
              className={`${styles.chip} sprout-chip`}
              onClick={() => setPhone("")}
            >
              Turn off and forget my number
            </button>
          </div>
        ) : (
          <form className={styles.textsBody} onSubmit={savePhone}>
            <p>
              Want texts when your timer starts or ends, or about weather at
              your study spot? Your number stays in this browser.
            </p>
            <div className={styles.form}>
              <input
                className={styles.input}
                value={phoneDraft}
                onChange={(event) => setPhoneDraft(event.target.value)}
                placeholder="+19195551234"
                aria-label="Phone number for Sprout texts"
                inputMode="tel"
              />
              <button className={`${styles.sendButton} sprout-send-button`} type="submit">
                Turn on
              </button>
            </div>
            {phoneError && <p role="alert">{phoneError}</p>}
          </form>
        )}

        {textStatus && <p role="status">{textStatus}</p>}
      </details>

      <div
        className={styles.log}
        ref={logRef}
        role="log"
        aria-live="polite"
        aria-label="Conversation with Sprout"
      >
        {messages.length === 0 && (
          <div className={styles.empty}>
            <div className={styles.emptyIcon} aria-hidden="true">S</div>
            <p>Hi, I&apos;m Sprout! Ask me anything, or pick a place to start.</p>
            <div className={styles.starters}>
              {STARTERS.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  className={`${styles.chip} sprout-chip`}
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
            className={`${styles.bubble} ${message.role === "user" ? styles.userBubble : styles.sproutBubble}`}
          >
            {message.text}
          </div>
        ))}

        {sending && (
          <div className={`${styles.bubble} ${styles.sproutBubble} ${styles.typing}`}>
            Sprout is thinking…
          </div>
        )}
      </div>

      <form className={styles.form} onSubmit={submit}>
        <input
          className={styles.input}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Message Sprout…"
          aria-label="Message Sprout"
          maxLength={1000}
        />
        <button
          className={`${styles.sendButton} sprout-send-button`}
          type="submit"
          disabled={sending || !draft.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}
