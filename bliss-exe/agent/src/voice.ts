import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { voice } from "spectrum-ts";

// Turns Sprout's text replies into iMessage voice notes with ElevenLabs.
// Every failure path resolves quietly: voice is a bonus on top of the text,
// so it must never break or delay a reply.

const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "btaSeNTVh1pGx4pjFzub";
const MODEL_ID = "eleven_flash_v2_5";
const MAX_CHARS = 450; // keeps free-tier credits and listening time down

let client: ElevenLabsClient | null = null;
let warned = false;

function voiceEnabled() {
  if (process.env.SPROUT_VOICE?.toLowerCase() === "off") return false;

  if (!process.env.ELEVENLABS_API_KEY) {
    if (!warned) {
      console.log("Voice notes off: ELEVENLABS_API_KEY is not set in agent/.env.");
      warned = true;
    }

    return false;
  }

  return true;
}

/** Spell out shorthand the voice would mispronounce ("min." reads as "minnow"). */
function expandShorthand(text: string) {
  return text
    .replace(/(\d)\s*[\u2013\u2014-]\s*(?=\d)/g, "$1 to ")
    .replace(/\b(\d+(?:\.\d+)?)\s*(?:mins?|minutes?)\b/gi, (_, n: string) =>
      Number(n) === 1 ? `${n} minute` : `${n} minutes`,
    )
    .replace(/\b(\d+(?:\.\d+)?)\s*(?:secs?|seconds?)\b/gi, (_, n: string) =>
      Number(n) === 1 ? `${n} second` : `${n} seconds`,
    )
    .replace(/\b(\d+(?:\.\d+)?)\s*(?:hrs?|hours?)\b/gi, (_, n: string) =>
      Number(n) === 1 ? `${n} hour` : `${n} hours`,
    )
    .replace(/\bpts\b/gi, "points");
}

/** Strip things a voice would read out loud awkwardly. */
export function toSpeakable(text: string) {
  return expandShorthand(text)
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[*_`#>~]/g, "")
    .replace(/[\p{Extended_Pictographic}\u200d\ufe0f]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

const MORE_IN_TEXT = " There's more in my text.";

/**
 * Keep long replies within the character limit by speaking the first part:
 * up to the last full sentence that fits (or the last word, if a sentence runs
 * on), then a short pointer to the rest.
 */
export function fitToLimit(text: string, max = MAX_CHARS) {
  if (text.length <= max) return text;

  const room = max - MORE_IN_TEXT.length;
  const head = text.slice(0, room);
  const sentenceEnd = Math.max(
    head.lastIndexOf(". "),
    head.lastIndexOf("! "),
    head.lastIndexOf("? "),
  );
  // Prefer a sentence boundary, but not one so early it leaves almost nothing.
  const cut =
    sentenceEnd >= room * 0.4
      ? head.slice(0, sentenceEnd + 1)
      : head.slice(0, head.lastIndexOf(" ") > 0 ? head.lastIndexOf(" ") : room);

  return cut.trim() + MORE_IN_TEXT;
}

/** MP3 audio of `text` in Sprout's voice, or null if voice is off or failed. */
export async function speak(text: string): Promise<Buffer | null> {
  if (!voiceEnabled()) return null;

  const speakable = toSpeakable(text);

  if (!speakable) return null;

  const spoken = fitToLimit(speakable);

  if (spoken !== speakable) {
    console.log(
      `Voice note shortened: speaking ${spoken.length} of ${speakable.length} characters.`,
    );
  }

  try {
    client ??= new ElevenLabsClient();

    const stream = await client.textToSpeech.convert(
      VOICE_ID,
      {
        text: spoken,
        modelId: MODEL_ID,
        outputFormat: "mp3_44100_128",
      },
      { timeoutInSeconds: 15, maxRetries: 0 },
    );
    const chunks: Uint8Array[] = [];

    const reader = stream.getReader();

    for (;;) {
      const { done, value } = await reader.read();

      if (done) break;
      chunks.push(value);
    }

    const audio = Buffer.concat(chunks);

    return audio.length > 0 ? audio : null;
  } catch (error) {
    console.error("Voice generation failed (text reply was still sent):", error);
    return null;
  }
}

type Sendable = { send: (content: ReturnType<typeof voice>) => Promise<unknown> };

/** Send `text` as a voice note. Never throws. */
export async function sendVoiceNote(space: Sendable, text: string) {
  const audio = await speak(text);

  if (!audio) return;

  try {
    await space.send(voice(audio, { mimeType: "audio/mpeg" }));
    console.log("Voice note sent.");
  } catch (error) {
    console.error("Voice note failed to send (text reply was still sent):", error);
  }
}
