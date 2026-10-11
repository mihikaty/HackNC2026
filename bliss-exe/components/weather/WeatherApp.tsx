"use client";

import { useCallback, useEffect, useState } from "react";
import { SendToSproutButton } from "@/components/sprout/SendToSproutButton";
import {
  SPOTS,
  uvLabel,
  type SpotId,
  type Verdict,
  type Weather,
} from "@/lib/weather";

type Loaded = { weather: Weather; verdict: Verdict };

const SPOT_IDS = Object.keys(SPOTS) as SpotId[];

function hourLabel(time: string) {
  const hour = Number(time.slice(11, 13));

  return `${hour % 12 || 12}${hour < 12 ? "am" : "pm"}`;
}

export default function WeatherApp() {
  const [spot, setSpot] = useState<SpotId>(SPOT_IDS[0]);
  const [data, setData] = useState<Loaded | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/weather?spot=${spot}`, { signal: controller.signal })
      .then(async (response) => {
        const body = (await response.json()) as Loaded & { error?: string };

        if (!response.ok) throw new Error(body.error ?? "Weather unavailable.");

        setData(body);
        setError("");
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;

        setData(null);
        setError(
          reason instanceof Error ? reason.message : "Weather unavailable.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [spot, reloadKey]);

  const choose = useCallback((id: SpotId) => {
    setLoading(true);
    setSpot(id);
  }, []);

  const retry = useCallback(() => {
    setLoading(true);
    setReloadKey((key) => key + 1);
  }, []);

  const weather = data?.weather;
  const verdict = data?.verdict;
  const spotName = SPOTS[spot].name;

  return (
    <div className="weather-app">
      <div className="weather-spots" role="tablist" aria-label="Study spot">
        {SPOT_IDS.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={id === spot}
            className={`weather-spot${id === spot ? " weather-spot-selected" : ""}`}
            onClick={() => choose(id)}
          >
            {SPOTS[id].name}
          </button>
        ))}
      </div>

      {loading && <p className="weather-note">Checking the sky…</p>}

      {!loading && error && (
        <div className="weather-note" role="alert">
          <p>Couldn&apos;t load the weather: {error}</p>
          <button type="button" className="sprout-chip" onClick={retry}>
            Try again
          </button>
        </div>
      )}

      {!loading && weather && verdict && (
        <>
          <section
            className={`weather-verdict weather-verdict-${verdict.status}`}
            aria-live="polite"
          >
            <strong>{verdict.headline}</strong>
            {verdict.issues.length > 0 && (
              <ul>
                {verdict.issues.map((issue) => (
                  <li key={issue.reason}>{issue.reason}</li>
                ))}
              </ul>
            )}
          </section>

          <section className="weather-now" aria-label={`Weather at ${spotName}`}>
            <div className="weather-icon" aria-hidden="true">
              {weather.icon}
            </div>
            <div>
              <div className="weather-temp">{Math.round(weather.tempF)}°F</div>
              <div>
                {weather.conditions} · feels like{" "}
                {Math.round(weather.feelsLikeF)}°F
              </div>
            </div>
          </section>

          <dl className="weather-stats">
            <div>
              <dt>UV index</dt>
              <dd>
                {Math.round(weather.uvIndex)} · {uvLabel(weather.uvIndex)}
              </dd>
            </div>
            <div>
              <dt>Rain (next 3h)</dt>
              <dd>{weather.rainChance}%</dd>
            </div>
            <div>
              <dt>Wind</dt>
              <dd>{Math.round(weather.windMph)} mph</dd>
            </div>
          </dl>

          <section className="weather-hours" aria-label="Next hours">
            {weather.hours.map((hour) => (
              <div key={hour.time} className="weather-hour">
                <span>{hourLabel(hour.time)}</span>
                <strong>{Math.round(hour.tempF)}°</strong>
                <span>☔ {hour.rainChance}%</span>
                <span>UV {Math.round(hour.uvIndex)}</span>
              </div>
            ))}
          </section>

          <div className="weather-footer">
            <span>
              Updated{" "}
              {new Date(weather.fetchedAt).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
            <SendToSproutButton
              appId="weather"
              text={`Is it a good time to study outside at ${spotName}?`}
              context={`Weather at ${spotName}: ${Math.round(weather.tempF)}°F (feels like ${Math.round(weather.feelsLikeF)}°F), ${weather.conditions}. UV index ${Math.round(weather.uvIndex)} (${uvLabel(weather.uvIndex)}). Rain chance next 3 hours: ${weather.rainChance}%. Wind ${Math.round(weather.windMph)} mph. Verdict: ${verdict.headline}${verdict.issues.length ? ` Issues: ${verdict.issues.map((issue) => issue.reason).join("; ")}.` : ""}`}
            />
          </div>
        </>
      )}
    </div>
  );
}
