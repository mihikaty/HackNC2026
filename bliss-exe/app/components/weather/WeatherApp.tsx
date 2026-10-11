"use client";

import { useCallback, useEffect, useState } from "react";
import { SendToSproutButton } from "@/app/components/sprout/SendToSproutButton";
import styles from "./WeatherApp.module.css";
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
  const verdictClass = verdict
    ? {
        go: styles.weatherVerdictGo,
        caution: styles.weatherVerdictCaution,
        "stay-in": styles.weatherVerdictStayIn,
        unknown: styles.weatherVerdictUnknown,
      }[verdict.status]
    : "";

  return (
    <div className={styles.weatherApp}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>WEATHER.EXE</p>
          <h2>Outdoor conditions</h2>
          <p className={styles.subtitle}>Check the next few hours before choosing a study spot.</p>
        </div>
        <span className={styles.status}>LIVE CHECK</span>
      </header>
      <div className={styles.weatherSpots} role="tablist" aria-label="Study spot">
        {SPOT_IDS.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={id === spot}
            className={`${styles.weatherSpot} ${id === spot ? styles.weatherSpotSelected : ""}`}
            onClick={() => choose(id)}
          >
            {SPOTS[id].name}
          </button>
        ))}
      </div>

      {loading && <p className={styles.weatherNote}>Checking the sky…</p>}

      {!loading && error && (
        <div className={styles.weatherNote} role="alert">
          <p>Couldn&apos;t load the weather: {error}</p>
          <button type="button" className={styles.retryButton} onClick={retry}>
            Try again
          </button>
        </div>
      )}

      {!loading && weather && verdict && (
        <>
          <section
            className={`${styles.weatherVerdict} ${verdictClass}`}
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

          <section className={styles.weatherNow} aria-label={`Weather at ${spotName}`}>
            <div className={styles.weatherIcon} aria-hidden="true">
              {weather.icon}
            </div>
            <div>
              <div className={styles.weatherTemp}>{Math.round(weather.tempF)}°F</div>
              <div>
                {weather.conditions} · feels like{" "}
                {Math.round(weather.feelsLikeF)}°F
              </div>
            </div>
          </section>

          <dl className={styles.weatherStats}>
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

          <section className={styles.weatherHours} aria-label="Next hours">
            {weather.hours.map((hour) => (
              <div key={hour.time} className={styles.weatherHour}>
                <span>{hourLabel(hour.time)}</span>
                <strong>{Math.round(hour.tempF)}°</strong>
                <span>☔ {hour.rainChance}%</span>
                <span>UV {Math.round(hour.uvIndex)}</span>
              </div>
            ))}
          </section>

          <div className={styles.weatherFooter}>
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
