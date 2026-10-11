import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { ensureM4a } from "@spectrum-ts/core/authoring";

// Turns a voice note someone sends Sprout into text with ElevenLabs Speech to
// Text, so it can go through the same Gemini reply path as a typed message.
// Resolves to null on any failure; the caller falls back to asking again.

const MODEL_ID = "scribe_v2";
const MAX_BYTES = 8 * 1024 * 1024; // ignore very long recordings

let client: ElevenLabsClient | null = null;

export function voiceInEnabled() {
  return (
    Boolean(process.env.ELEVENLABS_API_KEY) &&
    process.env.SPROUT_VOICE_IN?.toLowerCase() !== "off"
  );
}

export async function transcribeVoice(
  audio: Buffer,
  mimeType: string,
): Promise<string | null> {
  if (!voiceInEnabled() || audio.length === 0 || audio.length > MAX_BYTES) {
    return null;
  }

  try {
    // iPhone voice notes arrive as CAF. Convert to M4A with the same ffmpeg
    // helper Spectrum uses for outgoing voice, so the API sees a common format.
    let data = audio;
    let contentType = mimeType;

    try {
      const converted = await ensureM4a(audio, mimeType);

      data = converted.buffer;
      contentType = "audio/mp4";
    } catch (error) {
      console.error("Voice conversion failed, sending original audio:", error);
    }

    client ??= new ElevenLabsClient();

    const result = await client.speechToText.convert(
      {
        modelId: MODEL_ID,
        file: { data, filename: "voice.m4a", contentType },
      },
      { timeoutInSeconds: 30, maxRetries: 0 },
    );
    const text = "text" in result ? result.text.trim() : "";

    return text || null;
  } catch (error) {
    console.error("Voice transcription failed:", error);
    return null;
  }
}
