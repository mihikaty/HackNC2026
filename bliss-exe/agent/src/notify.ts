import { createServer } from "node:http";
import { imessage } from "spectrum-ts/providers/imessage";
import type { Spectrum } from "spectrum-ts";
import { sendVoiceNote } from "./voice.js";

// The website's server POSTs { to, text } here and Sprout texts that number.
// Bound to localhost only; set SPROUT_NOTIFY_SECRET in both .env files to
// also require a shared secret.

const PORT = Number(process.env.SPROUT_NOTIFY_PORT ?? 8787);
const SECRET = process.env.SPROUT_NOTIFY_SECRET;
const MAX_BODY = 4_000;
const MAX_TEXT = 600;
const PER_NUMBER_COOLDOWN_MS = 5_000;
const GLOBAL_LIMIT_PER_HOUR = 60;

const E164 = /^\+[1-9]\d{7,14}$/;

const lastSent = new Map<string, number>();
let sentThisHour: number[] = [];

type App = Awaited<ReturnType<typeof Spectrum>>;

export function startNotifyServer(app: App) {
  const server = createServer((req, res) => {
    const reply = (status: number, body: object) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(body));
    };

    if (req.method !== "POST" || req.url !== "/notify") {
      return reply(404, { error: "Not found" });
    }

    if (SECRET && req.headers["x-sprout-secret"] !== SECRET) {
      return reply(401, { error: "Unauthorized" });
    }

    let raw = "";

    req.on("data", (chunk: Buffer) => {
      raw += chunk;

      if (raw.length > MAX_BODY) req.destroy();
    });

    req.on("end", async () => {
      let payload: { to?: unknown; text?: unknown; voice?: unknown };

      try {
        payload = JSON.parse(raw);
      } catch {
        return reply(400, { error: "Invalid JSON" });
      }

      const { to, text } = payload;

      if (typeof to !== "string" || !E164.test(to)) {
        return reply(400, { error: "`to` must be an E.164 number" });
      }

      if (typeof text !== "string" || !text.trim()) {
        return reply(400, { error: "`text` is required" });
      }

      const now = Date.now();

      sentThisHour = sentThisHour.filter((t) => now - t < 3_600_000);

      if (
        now - (lastSent.get(to) ?? 0) < PER_NUMBER_COOLDOWN_MS ||
        sentThisHour.length >= GLOBAL_LIMIT_PER_HOUR
      ) {
        return reply(429, { error: "Rate limited" });
      }

      lastSent.set(to, now);
      sentThisHour.push(now);

      try {
        const space = await imessage(app).space.create(to);

        const message = text.trim().slice(0, MAX_TEXT);

        await space.send(message);
        console.log("Proactive text sent.");
        reply(200, { ok: true });

        // Optional spoken copy, after the text. Never affects the response.
        if (payload.voice === true) void sendVoiceNote(space, message);
      } catch (error) {
        console.error("Proactive text failed:", error);
        reply(502, { error: "Could not send text" });
      }
    });
  });

  server.on("error", (error) => {
    console.error("Notify server error (texts from the site disabled):", error);
  });

  server.listen(PORT, "127.0.0.1", () => {
    console.log(`Sprout notify endpoint on http://127.0.0.1:${PORT}/notify`);
  });
}
