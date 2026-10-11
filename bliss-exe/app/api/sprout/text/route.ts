const NOTIFY_URL =
  process.env.SPROUT_NOTIFY_URL ?? "http://127.0.0.1:8787/notify";
const E164 = /^\+[1-9]\d{7,14}$/;

// Approximate coordinates for the Explore.exe study spots.
const SPOTS: Record<string, { name: string; lat: number; lon: number }> = {
  "coker-arboretum": { name: "Coker Arboretum", lat: 35.9067, lon: -79.0383 },
  "sitterson-tables": { name: "Sitterson Hall", lat: 35.9094, lon: -79.0531 },
  "quad-old-well": { name: "The Quad / Old Well", lat: 35.9124, lon: -79.0513 },
};

const WELL_WISHES = [
  "Happy studying! 🌿",
  "You've got this! 🌱",
  "Go get 'em, Tar Heel! 🌞",
];

type Body = {
  kind?: unknown;
  phone?: unknown;
  task?: unknown;
  minutes?: unknown;
  spotId?: unknown;
};

/** True/false when the forecast says rain, null when we couldn't tell. */
async function rainExpected(lat: number, lon: number) {
  try {
    const url =
      "https://api.open-meteo.com/v1/forecast" +
      `?latitude=${lat}&longitude=${lon}` +
      "&current=precipitation,weather_code" +
      "&hourly=precipitation_probability&forecast_hours=3&timezone=auto";
    const response = await fetch(url, { signal: AbortSignal.timeout(5_000) });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      current?: { precipitation?: number; weather_code?: number };
      hourly?: { precipitation_probability?: number[] };
    };
    const code = data.current?.weather_code ?? 0;
    const wetCode = (code >= 51 && code <= 67) || (code >= 80 && code <= 99);
    const raining = (data.current?.precipitation ?? 0) > 0 || wetCode;
    const chance = Math.max(0, ...(data.hourly?.precipitation_probability ?? []));

    return raining || chance >= 50;
  } catch {
    return null;
  }
}

function cleanTask(task: unknown) {
  return typeof task === "string" ? task.trim().slice(0, 80) : "";
}

async function buildText(body: Body): Promise<string | null> {
  const wish = WELL_WISHES[Math.floor(Math.random() * WELL_WISHES.length)];

  if (body.kind === "timer-start") {
    const task = cleanTask(body.task);
    const minutes = Number(body.minutes);
    const length = Number.isFinite(minutes) && minutes > 0 ? `${Math.round(minutes)}-minute ` : "";

    return `Focus time! 🌱 Your ${length}session${task ? ` on "${task}"` : ""} just started. ${wish}`;
  }

  if (body.kind === "timer-end") {
    const task = cleanTask(body.task);

    return `Time's up! 🌿 Nice work${task ? ` on "${task}"` : ""}. Go stretch, drink some water, and maybe step outside for a minute. 🌞`;
  }

  if (body.kind === "study-spot") {
    const spot = typeof body.spotId === "string" ? SPOTS[body.spotId] : undefined;

    if (!spot) return null;

    const rain = await rainExpected(spot.lat, spot.lon);

    if (rain === true) {
      return `Heading to ${spot.name}? ☔ Rain is in the forecast, so grab an umbrella! Happy studying. 🌿`;
    }

    // rain === null means we couldn't check, so don't claim the weather is nice.
    return rain === false
      ? `${spot.name} is a great pick, and no rain is expected right now. ☀️ ${wish}`
      : `${spot.name} is a great pick! ${wish}`;
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

  if (!text) {
    return Response.json({ error: "Unknown request." }, { status: 400 });
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

    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { error: "Sprout's text agent isn't running (start it in bliss-exe/agent)." },
      { status: 503 },
    );
  }
}
