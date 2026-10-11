import { getVerdict, getWeather, isSpotId } from "@/lib/weather";

export async function GET(request: Request) {
  const spot = new URL(request.url).searchParams.get("spot");

  if (!isSpotId(spot)) {
    return Response.json({ error: "Unknown spot." }, { status: 400 });
  }

  const weather = await getWeather(spot);

  if (!weather) {
    return Response.json(
      { error: "Couldn't reach the weather service." },
      { status: 502 },
    );
  }

  return Response.json({ weather, verdict: getVerdict(weather) });
}
