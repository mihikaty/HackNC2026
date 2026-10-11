"use client";

import type { ReactNode } from "react";
import { useSprout, type SproutAppId } from "./SproutProvider";

type Props = {
  appId: SproutAppId;
  /** What the person says to Sprout (shown in the chat). */
  text: string;
  /** What they were looking at (sent to Sprout, not shown). */
  context: string;
  className?: string;
  children?: ReactNode;
};

export function SendToSproutButton({
  appId,
  text,
  context,
  className = "sprout-send-button",
  children = "Ask Sprout 🫧",
}: Props) {
  const { sendFromApp, sending } = useSprout();

  return (
    <button
      type="button"
      className={className}
      disabled={sending}
      onClick={() => sendFromApp({ appId, text, context })}
    >
      {children}
    </button>
  );
}
