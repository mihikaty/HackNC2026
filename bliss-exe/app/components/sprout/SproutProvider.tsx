"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type SproutAppId =
  | "focus"
  | "explore"
  | "nature"
  | "touchgrass"
  | "weather"
  | "sprout";

export type SproutMessage = {
  id: number;
  role: "user" | "sprout";
  text: string;
  appId?: SproutAppId;
  context?: string;
};

type AppRequest = {
  appId: SproutAppId;
  /** What the person "says" to Sprout, shown in the chat. */
  text: string;
  /** Facts about what they were looking at, sent to Sprout but not shown. */
  context: string;
};

export type TextRequest =
  | { kind: "timer-start"; task: string; minutes: number }
  | { kind: "timer-end"; task: string }
  | { kind: "study-spot"; spotId: string };

type SproutContextValue = {
  messages: SproutMessage[];
  /** Number Sprout may text (E.164), or "" if the person hasn't opted in. */
  phone: string;
  setPhone: (phone: string) => void;
  /** Status of the most recent text, for display in Sprout.exe. */
  textStatus: string;
  /** Text the opted-in number. Does nothing if no number is saved. */
  textMe: (request: TextRequest) => void;
  sending: boolean;
  send: (text: string) => void;
  clearChat: () => void;
  /** Push a message from an app into the chat and bring Sprout.exe forward. */
  sendFromApp: (request: AppRequest) => void;
};

const SproutContext = createContext<SproutContextValue | null>(null);

const PHONE_KEY = "sprout-phone";

const OFFLINE_REPLY =
  "I can't reach my roots right now 🌱 Check your connection and try again?";

export function SproutProvider({
  openSprout,
  children,
}: {
  openSprout: () => void;
  children: ReactNode;
}) {
  const [messages, setMessages] = useState<SproutMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [phone, setPhoneState] = useState("");
  const [textStatus, setTextStatus] = useState("");

  // Refs keep `post` stable and free of stale state between rapid clicks.
  const messagesRef = useRef<SproutMessage[]>([]);
  const sendingRef = useRef(false);
  const nextId = useRef(1);
  const conversationVersion = useRef(0);
  const openRef = useRef(openSprout);

  useEffect(() => {
    openRef.current = openSprout;
  }, [openSprout]);

  // Load the saved number after mount so server and client render the same.
  useEffect(() => {
    const load = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(PHONE_KEY);

        if (saved) setPhoneState(saved);
      } catch {
        // Storage can be unavailable; the number just won't persist.
      }
    }, 0);

    return () => window.clearTimeout(load);
  }, []);

  const phoneRef = useRef("");

  useEffect(() => {
    phoneRef.current = phone;
  }, [phone]);

  const setPhone = useCallback((next: string) => {
    setPhoneState(next);

    try {
      if (next) window.localStorage.setItem(PHONE_KEY, next);
      else window.localStorage.removeItem(PHONE_KEY);
    } catch {
      // Ignore storage failures.
    }
  }, []);

  const textMe = useCallback((request: TextRequest) => {
    const number = phoneRef.current;

    if (!number) return;

    fetch("/api/sprout/text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...request, phone: number }),
    })
      .then(async (response) => {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
          sent?: boolean;
        } | null;

        if (response.ok) {
          return setTextStatus(
            data?.sent === false
              ? "Weather looks fine, so no text was needed."
              : "📱 Sprout sent you a text.",
          );
        }

        setTextStatus(`Couldn't text you: ${data?.error ?? "unknown error"}`);
      })
      .catch(() => setTextStatus("Couldn't text you: network error."));
  }, []);

  const post = useCallback(
    async (userMessage: Omit<SproutMessage, "id" | "role">) => {
      if (sendingRef.current) return;

      const requestVersion = conversationVersion.current;
      sendingRef.current = true;
      setSending(true);

      const outgoing: SproutMessage = {
        id: nextId.current++,
        role: "user",
        ...userMessage,
      };
      const history = [...messagesRef.current, outgoing];

      messagesRef.current = history;
      setMessages(history);

      let replyText = OFFLINE_REPLY;

      try {
        const response = await fetch("/api/sprout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history.map(({ role, text, appId, context }) => ({
              role,
              text,
              appId,
              context,
            })),
          }),
        });
        const data = (await response.json().catch(() => null)) as {
          reply?: string;
        } | null;

        if (data?.reply) replyText = data.reply;
      } catch {
        // Keep the offline reply.
      }

      if (requestVersion !== conversationVersion.current) return;

      const reply: SproutMessage = {
        id: nextId.current++,
        role: "sprout",
        text: replyText,
      };

      messagesRef.current = [...messagesRef.current, reply];
      setMessages(messagesRef.current);
      sendingRef.current = false;
      setSending(false);
    },
    [],
  );

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();

      if (trimmed) void post({ text: trimmed });
    },
    [post],
  );

  const sendFromApp = useCallback(
    ({ appId, text, context }: AppRequest) => {
      openRef.current();
      void post({ text, appId, context });
    },
    [post],
  );

  const clearChat = useCallback(() => {
    conversationVersion.current += 1;
    messagesRef.current = [];
    setMessages([]);
    sendingRef.current = false;
    setSending(false);
  }, []);

  const value = useMemo(
    () => ({
      messages,
      phone,
      setPhone,
      textStatus,
      textMe,
      sending,
      send,
      sendFromApp,
      clearChat,
    }),
    [messages, phone, setPhone, textStatus, textMe, sending, send, sendFromApp, clearChat],
  );

  return (
    <SproutContext.Provider value={value}>{children}</SproutContext.Provider>
  );
}

export function useSprout() {
  const value = useContext(SproutContext);

  if (!value) {
    throw new Error("useSprout must be used inside <SproutProvider>.");
  }

  return value;
}
