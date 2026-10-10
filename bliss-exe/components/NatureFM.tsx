"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const TRACK = "/audio/music.mp3";

const REWIND_SECONDS = 15;
const FAST_FORWARD_SECONDS = 15;
const SKIP_SECONDS = 30;

export default function NatureFmApp() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [loaded, setLoaded] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  const canSeek = duration > 0;

  const timeLabel = useMemo(() => {
    const format = (seconds: number) => {
      if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
      const whole = Math.floor(seconds);
      const minutes = Math.floor(whole / 60);
      const secs = whole % 60;
      return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };

    return {
      current: format(currentTime),
      total: format(duration),
    };
  }, [currentTime, duration]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.loop = isLooping;
  }, [isLooping]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setLoaded(true);
      setCurrentTime(audio.currentTime || 0);
      setPlaybackError(null);
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      if (!audio.loop) {
        setIsPlaying(false);
      }
    };
    const onError = () => {
      setLoaded(false);
      setIsPlaying(false);
      setPlaybackError("The audio file could not be loaded. Please try again later.");
    };
    const onVolumeChange = () => {
      setVolume(audio.volume);
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    audio.addEventListener("volumechange", onVolumeChange);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("volumechange", onVolumeChange);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;

    return () => {
      if (!audio) return;
      audio.pause();
    };
  }, []);

  async function togglePlayPause() {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      setPlaybackError(null);
      try {
        await audio.play();
      } catch (error) {
        setIsPlaying(false);
        setPlaybackError(
          error instanceof Error
            ? `Playback failed: ${error.message}`
            : "Playback failed. Please try again.",
        );
      }
    } else {
      audio.pause();
    }
  }

  function seekBy(deltaSeconds: number) {
    const audio = audioRef.current;
    if (!audio || !canSeek) return;

    const nextTime = Math.min(
      duration,
      Math.max(0, audio.currentTime + deltaSeconds),
    );

    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  function handleVolumeChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextVolume = Number(event.target.value);
    const audio = audioRef.current;
    setVolume(nextVolume);
    if (audio) audio.volume = nextVolume;
  }

  return (
    <div className="nature-player">
      <header className="nature-player-header">
        <div>
          <p className="nature-player-eyebrow">Nature.fm</p>
          <h2>Frutiger Aero Soundscape</h2>
        </div>
        <span className="nature-player-status">
          {playbackError ? "Unavailable" : loaded ? "Ready" : "Loading..."}
        </span>
      </header>

      <section className="nature-track-card" aria-label="Current track">
        <div className="nature-track-meta">
          <span>Now playing</span>
          <span className="nature-loop-status">Loop {isLooping ? "On" : "Off"}</span>
        </div>

        <div className="nature-track-details">
          <div className="nature-artwork" aria-hidden="true">
            🌿
          </div>
          <div className="nature-track-info">
            <p className="nature-track-title">Ambient Nature Loop</p>
            <p className="nature-track-source">Local audio · {TRACK}</p>
            <div className="nature-track-progress">
              <div className="nature-time-labels">
                <span>{timeLabel.current}</span>
                <span>{timeLabel.total}</span>
              </div>
              <div
                className="nature-progress-track"
                role="progressbar"
                aria-label="Track progress"
                aria-valuemin={0}
                aria-valuemax={duration || 1}
                aria-valuenow={currentTime}
              >
                <div
                  className="nature-progress-fill"
                  style={{
                    width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {playbackError && (
        <p className="nature-player-error" role="alert">
          {playbackError}
        </p>
      )}

      <audio ref={audioRef} src={TRACK} preload="metadata" loop={isLooping} />

      <div className="nature-player-controls">
        <div className="nature-seek-controls">
          <button type="button" onClick={() => seekBy(-REWIND_SECONDS)} disabled={!canSeek}>
            ⏪ Rewind {REWIND_SECONDS}s
          </button>
          <button type="button" onClick={() => seekBy(SKIP_SECONDS)} disabled={!canSeek}>
            ⏭ Skip {SKIP_SECONDS}s
          </button>
          <button
            type="button"
            onClick={() => seekBy(FAST_FORWARD_SECONDS)}
            disabled={!canSeek}
          >
            ⏩ Forward {FAST_FORWARD_SECONDS}s
          </button>
          <button
            type="button"
            className={isLooping ? "nature-loop-active" : ""}
            onClick={() => setIsLooping((previous) => !previous)}
            aria-pressed={isLooping}
          >
            Loop {isLooping ? "On" : "Off"}
          </button>
        </div>

        <div className="nature-playback-controls">
          <button type="button" className="nature-play-button" onClick={togglePlayPause}>
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button
            type="button"
            onClick={() => {
              const audio = audioRef.current;
              if (!audio) return;
              audio.currentTime = 0;
              setCurrentTime(0);
            }}
            disabled={!canSeek}
          >
            Restart
          </button>
          <label className="nature-volume-control">
            <span>Volume</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={handleVolumeChange}
              aria-label="Volume"
            />
          </label>
        </div>
      </div>

      <aside className="nature-session-notes">
        <strong>Study session notes</strong>
        <p>
          Use the looping nature track as background ambience while you work.
          Rewind, skip, or fast-forward within the same audio file.
        </p>
      </aside>
    </div>
  );
}
