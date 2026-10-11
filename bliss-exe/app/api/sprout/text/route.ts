import { SPOTS, getVerdict, getWeather, isSpotId } from "@/lib/weather";

const NOTIFY_URL =
  process.env.SPROUT_NOTIFY_URL ?? "http://127.0.0.1:8787/notify";
const E164 = /^\+[1-9]\d{7,14}$/;

const WELL_WISHES = [
  "Happy studying!",
  "You've got this!",
  "Go get 'em, Tar Heel!",
];

type Body = {
  kind?: unknown;
  phone?: unknown;
  task?: unknown;
  minutes?: unknown;
  spotId?: unknown;
};

function cleanTask(task: unknown) {
  return typeof task === "string" ? task.trim().slice(0, 80) : "";
}

/** Text to send, "" for "nothing to say", or null for an invalid request. */
async function buildText(body: Body): Promise<string | null> {
  const wish = WELL_WISHES[Math.floor(Math.random() * WELL_WISHES.length)];

  if (body.kind === "timer-start") {
    const task = cleanTask(body.task);
    const minutes = Number(body.minutes);
    const length = Number.isFinite(minutes) && minutes > 0 ? `${Math.round(minutes)}-minute ` : "";

    return `Focus time! Your ${length}session${task ? ` on "${task}"` : ""} just started. ${wish}`;
  }

  if (body.kind === "timer-end") {
    const task = cleanTask(body.task);

    return `Time's up! Nice work${task ? ` on "${task}"` : ""}. Go stretch, drink some water, and maybe step outside for a minute.`;
  }

  if (body.kind === "study-spot") {
    if (!isSpotId(body.spotId)) return null;

    const spot = SPOTS[body.spotId];
    const verdict = getVerdict(await getWeather(body.spotId));

    // Only text when the weather is worth mentioning. If we couldn't check
    // ("unknown") or conditions are fine ("go"), stay quiet.
    if (verdict.issues.length === 0) return "";

    return `Heading to ${spot.name}? ${verdict.issues.map((issue) => issue.tip).join(" ")} Happy studying!`;
  }

  return null;
}

export async function POST(request: Request) {
  let body: Body;

  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (typeof body.phone !== "string" || !E164.test(body.phone)) {
    return Response.json({ error: "Invalid phone number." }, { status: 400 });
  }

  const text = await buildText(body);

  if (text === null) {
    return Response.json({ error: "Unknown request." }, { status: 400 });
  }

  if (text === "") {
    return Response.json({ ok: true, sent: false });
  }

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };

    if (process.env.SPROUT_NOTIFY_SECRET) {
      headers["x-sprout-secret"] = process.env.SPROUT_NOTIFY_SECRET;
    }

    const response = await fetch(NOTIFY_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ to: body.phone, text }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      return Response.json({ error: "Sprout couldn't send the text." }, { status: 502 });
    }

    return Response.json({ ok: true, sent: true });
  } catch {
    return Response.json(
      { error: "Sprout's text agent isn't running (start it in bliss-exe/agent)." },
      { status: 503 },
    );
  }
}
