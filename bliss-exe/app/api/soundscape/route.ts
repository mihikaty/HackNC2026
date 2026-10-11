import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ambienceFor, getWeather, isSpotId, type Ambience } from "@/lib/weather";

// Generates a looping nature soundscape for the current weather at a study
// spot with ElevenLabs Sound Effects. There are only a handful of weather
// categories, and each sound is generated once and then served from disk, so
// this spends a few credits in total, not one per listen.

const CACHE_DIR = path.join(process.cwd(), ".soundscape-cache");
const SOUND_SECONDS = 20;

// Share one in-flight generation if several requests arrive at once.
const pending = new Map<string, Promise<Buffer>>();

async function generate(ambience: Ambience, apiKey: string) {
  const response = await fetch(
    "https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "xi-api-key": apiKey },
      body: JSON.stringify({
        text: ambience.prompt,
        duration_seconds: SOUND_SECONDS,
        loop: true,
        model_id: "eleven_text_to_sound_v2",
        prompt_influence: 0.5,
      }),
      signal: AbortSignal.timeout(30_000),
    },
  );

  if (!response.ok) {
    throw new Error(`ElevenLabs sound generation failed (${response.status})`);
  }

  return Buffer.from(await response.arrayBuffer());
}

export async function GET(request: Request) {
  const spot = new URL(request.url).searchParams.get("spot");

  if (!isSpotId(spot)) {
    return Response.json({ error: "Unknown spot." }, { status: 400 });
  }

  const weather = await getWeather(spot);

  if (!weather) {
    return Response.json(
      { error: "Couldn't check the weather, so I can't pick a soundscape." },
      { status: 502 },
    );
  }

  const ambience = ambienceFor(weather);
  const file = path.join(CACHE_DIR, `${ambience.id}.mp3`);
  let audio: Buffer | null = await readFile(file).catch(() => null);

  if (!audio) {
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "Soundscapes need ELEVENLABS_API_KEY in bliss-exe/.env.local." },
        { status: 503 },
      );
    }

    try {
      let job = pending.get(ambience.id);

      if (!job) {
        job = generate(ambience, apiKey).finally(() => pending.delete(ambience.id));
        pending.set(ambience.id, job);
      }

      audio = await job;
      await mkdir(CACHE_DIR, { recursive: true });
      await writeFile(file, audio);
    } catch (error) {
      console.error("Soundscape generation failed:", error);

      return Response.json(
        { error: "Couldn't generate the soundscape right now." },
        { status: 502 },
      );
    }
  }

  return new Response(new Uint8Array(audio), {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "private, max-age=3600",
      "X-Ambience-Label": encodeURIComponent(ambience.label),
      "X-Ambience-Id": ambience.id,
    },
  });
}
