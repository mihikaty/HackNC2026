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

type SproutContextValue = {
  messages: SproutMessage[];
  sending: boolean;
  send: (text: string) => void;
  /** Push a message from an app into the chat and bring Sprout.exe forward. */
  sendFromApp: (request: AppRequest) => void;
};

const SproutContext = createContext<SproutContextValue | null>(null);

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

  // Refs keep `post` stable and free of stale state between rapid clicks.
  const messagesRef = useRef<SproutMessage[]>([]);
  const sendingRef = useRef(false);
  const nextId = useRef(1);
  const openRef = useRef(openSprout);

  useEffect(() => {
    openRef.current = openSprout;
  }, [openSprout]);

  const post = useCallback(
    async (userMessage: Omit<SproutMessage, "id" | "role">) => {
      if (sendingRef.current) return;

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

  const value = useMemo(
    () => ({ messages, sending, send, sendFromApp }),
    [messages, sending, send, sendFromApp],
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
