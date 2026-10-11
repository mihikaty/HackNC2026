"use client";

import { useEffect, useRef, useState } from "react";
import { SPOTS, type SpotId } from "@/lib/weather";

const SPOT_IDS = Object.keys(SPOTS) as SpotId[];

/** Nature.fm panel: plays a looping soundscape that matches the real weather. */
export default function WeatherAmbience() {
  const [spot, setSpot] = useState<SpotId>(SPOT_IDS[0]);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");
  const [volume, setVolume] = useState(0.6);
  const audioRef = useRef<HTMLAudioElement>(null);
  const urlRef = useRef<string | null>(null);

  // Stop playing and free the audio when the window closes.
  useEffect(() => {
    const audio = audioRef.current;

    return () => {
      audio?.pause();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  async function start() {
    const audio = audioRef.current;

    if (!audio || loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/soundscape?spot=${spot}`);

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;

        throw new Error(body?.error ?? "Soundscape unavailable.");
      }

      const blob = await response.blob();
      const next = URL.createObjectURL(blob);

      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = next;
      audio.src = next;
      audio.volume = volume;
      await audio.play();
      setLabel(
        decodeURIComponent(response.headers.get("X-Ambience-Label") ?? ""),
      );
      setPlaying(true);
    } catch (reason) {
      setPlaying(false);
      setError(
        reason instanceof Error ? reason.message : "Soundscape unavailable.",
      );
    } finally {
      setLoading(false);
    }
  }

  function stop() {
    audioRef.current?.pause();
    setPlaying(false);
  }

  function changeVolume(next: number) {
    setVolume(next);
    if (audioRef.current) audioRef.current.volume = next;
  }

  return (
    <section className="ambience-panel" aria-label="Weather ambience">
      <div className="ambience-title">
        <strong>Weather ambience</strong>
        <span>A sound made for the sky outside</span>
      </div>

      <div className="ambience-row">
        <label>
          <span>Spot </span>
          <select
            value={spot}
            onChange={(event) => setSpot(event.target.value as SpotId)}
            disabled={loading}
          >
            {SPOT_IDS.map((id) => (
              <option key={id} value={id}>
                {SPOTS[id].name}
              </option>
            ))}
          </select>
        </label>

        {playing ? (
          <button type="button" onClick={stop}>
            Stop
          </button>
        ) : (
          <button type="button" onClick={start} disabled={loading}>
            {loading ? "Listening to the sky…" : "Play matching sound"}
          </button>
        )}

        <label>
          <span>Volume </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(event) => changeVolume(Number(event.target.value))}
            aria-label="Ambience volume"
          />
        </label>
      </div>

      {playing && label && (
        <p className="ambience-note" role="status">
          Now playing: {label}
        </p>
      )}
      {error && (
        <p className="ambience-note" role="alert">
          {error}
        </p>
      )}

      <audio ref={audioRef} loop onEnded={() => setPlaying(false)} />
    </section>
  );
}
