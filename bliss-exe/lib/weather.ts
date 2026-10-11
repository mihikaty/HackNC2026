// Weather for the Explore.exe study spots, from Open-Meteo (free, no API key).
// Used by /api/weather (Weather.exe) and /api/sprout/text (study-spot texts)
// so both always agree.

export const SPOTS = {
  "coker-arboretum": { name: "Coker Arboretum", lat: 35.9067, lon: -79.0383 },
  "sitterson-tables": { name: "Sitterson Hall", lat: 35.9094, lon: -79.0531 },
  "quad-old-well": { name: "The Quad / Old Well", lat: 35.9124, lon: -79.0513 },
} as const;

export type SpotId = keyof typeof SPOTS;

export function isSpotId(value: unknown): value is SpotId {
  return typeof value === "string" && value in SPOTS;
}

export type HourForecast = {
  /** Local time like "2026-10-10T21:00". */
  time: string;
  tempF: number;
  rainChance: number;
  uvIndex: number;
};

export type Weather = {
  tempF: number;
  feelsLikeF: number;
  windMph: number;
  gustMph: number;
  uvIndex: number;
  isDay: boolean;
  weatherCode: number;
  conditions: string;
  icon: string;
  /** Highest rain chance (0-100) over the next 3 hours. */
  rainChance: number;
  raining: boolean;
  thunder: boolean;
  hours: HourForecast[];
  /** ISO timestamp of when we fetched this. */
  fetchedAt: string;
};

export type Issue = {
  level: "caution" | "stay-in";
  /** Short text for the Weather.exe card. */
  reason: string;
  /** Friendly sentence for a text message. */
  tip: string;
};

export type Verdict = {
  status: "go" | "caution" | "stay-in" | "unknown";
  headline: string;
  issues: Issue[];
};

// Thresholds. Adjust here.
const HOT_CAUTION_F = 90;
const HOT_STAY_IN_F = 100;
const COLD_CAUTION_F = 40;
const COLD_STAY_IN_F = 25;
const WINDY_MPH = 25;
const RAIN_CHANCE_PERCENT = 50;
const UV_CAUTION = 6;

const CONDITIONS: Array<[number, string, string]> = [
  [0, "Clear", "☀️"],
  [2, "Partly cloudy", "⛅"],
  [3, "Overcast", "☁️"],
  [48, "Foggy", "🌫️"],
  [57, "Drizzle", "🌦️"],
  [67, "Rain", "🌧️"],
  [77, "Snow", "🌨️"],
  [82, "Rain showers", "🌧️"],
  [86, "Snow showers", "🌨️"],
  [99, "Thunderstorms", "⛈️"],
];

function describe(code: number) {
  const match = CONDITIONS.find(([max]) => code <= max) ?? CONDITIONS[0];

  return { conditions: match[1], icon: match[2] };
}

export function uvLabel(uv: number) {
  if (uv < 3) return "Low";
  if (uv < 6) return "Moderate";
  if (uv < 8) return "High";
  if (uv < 11) return "Very high";

  return "Extreme";
}

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    precipitation?: number;
    weather_code?: number;
    wind_speed_10m?: number;
    wind_gusts_10m?: number;
    uv_index?: number;
    is_day?: number;
  };
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    precipitation_probability?: number[];
    uv_index?: number[];
  };
};

const CACHE_MS = 10 * 60_000;
const cache = new Map<SpotId, { at: number; value: Weather }>();

/** Weather at a study spot, or null if we couldn't get it (never a guess). */
export async function getWeather(spotId: SpotId): Promise<Weather | null> {
  const cached = cache.get(spotId);

  if (cached && Date.now() - cached.at < CACHE_MS) return cached.value;

  const { lat, lon } = SPOTS[spotId];

  try {
    const url =
      "https://api.open-meteo.com/v1/forecast" +
      `?latitude=${lat}&longitude=${lon}` +
      "&current=temperature_2m,apparent_temperature,precipitation,weather_code," +
      "wind_speed_10m,wind_gusts_10m,uv_index,is_day" +
      "&hourly=temperature_2m,precipitation_probability,uv_index" +
      "&forecast_hours=6&temperature_unit=fahrenheit&wind_speed_unit=mph" +
      "&timezone=auto";
    const response = await fetch(url, { signal: AbortSignal.timeout(5_000) });

    if (!response.ok) return null;

    const data = (await response.json()) as OpenMeteoResponse;
    const now = data.current;
    const hourly = data.hourly;

    if (
      !now ||
      !hourly?.time ||
      now.temperature_2m === undefined ||
      now.apparent_temperature === undefined ||
      now.weather_code === undefined ||
      now.wind_speed_10m === undefined ||
      now.uv_index === undefined
    ) {
      return null;
    }

    const hours: HourForecast[] = hourly.time.map((time, i) => ({
      time,
      tempF: hourly.temperature_2m?.[i] ?? now.temperature_2m!,
      rainChance: hourly.precipitation_probability?.[i] ?? 0,
      uvIndex: hourly.uv_index?.[i] ?? 0,
    }));
    const code = now.weather_code;
    const wetCode = (code >= 51 && code <= 67) || (code >= 80 && code <= 99);
    const value: Weather = {
      tempF: now.temperature_2m,
      feelsLikeF: now.apparent_temperature,
      windMph: now.wind_speed_10m,
      gustMph: now.wind_gusts_10m ?? now.wind_speed_10m,
      uvIndex: now.uv_index,
      isDay: now.is_day === 1,
      weatherCode: code,
      ...describe(code),
      rainChance: Math.max(0, ...hours.slice(0, 3).map((h) => h.rainChance)),
      raining: (now.precipitation ?? 0) > 0 || wetCode,
      thunder: code >= 95,
      hours,
      fetchedAt: new Date().toISOString(),
    };

    cache.set(spotId, { at: Date.now(), value });

    return value;
  } catch {
    return null;
  }
}

/** Plain rules, no AI: the same weather always gives the same verdict. */
export function getVerdict(weather: Weather | null): Verdict {
  if (!weather) {
    return {
      status: "unknown",
      headline: "Can't check the weather right now.",
      issues: [],
    };
  }

  const issues: Issue[] = [];

  if (weather.thunder) {
    issues.push({
      level: "stay-in",
      reason: "Thunderstorms",
      tip: "Thunderstorms are around, so it's safer to stay inside for now.",
    });
  } else if (weather.raining || weather.rainChance >= RAIN_CHANCE_PERCENT) {
    issues.push({
      level: "caution",
      reason: weather.raining
        ? "It's raining"
        : `${weather.rainChance}% chance of rain soon`,
      tip: "Rain is in the forecast, so grab an umbrella!",
    });
  }

  const feels = weather.feelsLikeF;

  if (feels >= HOT_CAUTION_F) {
    issues.push({
      level: feels >= HOT_STAY_IN_F ? "stay-in" : "caution",
      reason: `Hot (feels like ${Math.round(feels)}°F)`,
      tip: "It's hot out there, so find shade and drink plenty of water.",
    });
  } else if (feels <= COLD_CAUTION_F) {
    issues.push({
      level: feels <= COLD_STAY_IN_F ? "stay-in" : "caution",
      reason: `Cold (feels like ${Math.round(feels)}°F)`,
      tip: "It's cold out there, so bundle up!",
    });
  }

  if (weather.windMph >= WINDY_MPH || weather.gustMph >= WINDY_MPH + 10) {
    issues.push({
      level: "caution",
      reason: `Windy (${Math.round(weather.windMph)} mph)`,
      tip: "It's windy, so hold on to your papers!",
    });
  }

  if (weather.uvIndex >= UV_CAUTION) {
    issues.push({
      level: "caution",
      reason: `UV index ${Math.round(weather.uvIndex)} (${uvLabel(weather.uvIndex)})`,
      tip: `UV is ${uvLabel(weather.uvIndex).toLowerCase()} (${Math.round(weather.uvIndex)}), so wear sunscreen or find some shade.`,
    });
  }

  if (issues.length === 0) {
    return {
      status: "go",
      headline: "Looks like a good time to go outside!",
      issues,
    };
  }

  const stayIn = issues.some((issue) => issue.level === "stay-in");

  return {
    status: stayIn ? "stay-in" : "caution",
    headline: stayIn
      ? "Better to stay in for now."
      : "Fine to go out, but keep this in mind.",
    issues,
  };
}

export type Ambience = {
  /** Stable key, also used as the cache file name. */
  id: string;
  /** Short name shown in Nature.fm. */
  label: string;
  /** Text prompt for the ElevenLabs sound generator. */
  prompt: string;
};

const LOOP_NOTE = "calm, peaceful study ambience, no music, no speech, seamless loop";

/**
 * Which soundscape suits this weather. A small fixed set of categories, so
 * each sound is generated once and then reused from the cache.
 */
export function ambienceFor(weather: Weather): Ambience {
  const code = weather.weatherCode;

  if (weather.thunder) {
    return {
      id: "storm",
      label: "Distant thunderstorm",
      prompt: `Rain on leaves with soft rolling thunder far away, ${LOOP_NOTE}`,
    };
  }

  if (weather.raining) {
    return {
      id: "rain",
      label: "Rain on the leaves",
      prompt: `Steady gentle rain falling on leaves and a quiet campus lawn, ${LOOP_NOTE}`,
    };
  }

  if (code >= 71 && code <= 77) {
    return {
      id: "snow",
      label: "Quiet snowfall",
      prompt: `Hushed winter air with a soft muffled breeze and faint distant wind chimes, ${LOOP_NOTE}`,
    };
  }

  if (code === 45 || code === 48) {
    return {
      id: "fog",
      label: "Foggy morning",
      prompt: `Misty quiet morning with a faint breeze, dripping leaves and a few distant birds, ${LOOP_NOTE}`,
    };
  }

  if (weather.windMph >= 15) {
    return {
      id: "windy",
      label: "Breezy trees",
      prompt: `Wind moving through tall trees and rustling leaves, ${LOOP_NOTE}`,
    };
  }

  if (code >= 2) {
    return {
      id: weather.isDay ? "cloudy-day" : "cloudy-night",
      label: weather.isDay ? "Cloudy afternoon" : "Cloudy evening",
      prompt: weather.isDay
        ? `Soft breeze under an overcast sky with gentle birdsong in the trees, ${LOOP_NOTE}`
        : `Quiet cloudy night with a light breeze and slow crickets, ${LOOP_NOTE}`,
    };
  }

  return weather.isDay
    ? {
        id: "clear-day",
        label: "Sunny afternoon",
        prompt: `Warm breeze through oak trees with cheerful birdsong and a faint stream, ${LOOP_NOTE}`,
      }
    : {
        id: "clear-night",
        label: "Clear night",
        prompt: `Peaceful clear night with soft crickets and a very light breeze, ${LOOP_NOTE}`,
      };
}
