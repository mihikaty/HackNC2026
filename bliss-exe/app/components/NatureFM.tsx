"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { SendToSproutButton } from "@/app/components/sprout/SendToSproutButton";
import WeatherAmbience from "@/app/components/weather/WeatherAmbience";

const TRACKS = [
  {
    title: "Ambient Nature Loop",
    source: "/audio/music.mp3",
  },
  {
    title: "Morning Nature",
    source: "/audio/music2short.mp3",
  },
  {
    title: "Peaceful Outdoor Break",
    source: "/audio/music3short.mp3",
  },
] as const;

const REWIND_SECONDS = 15;
const FAST_FORWARD_SECONDS = 15;
const SKIP_SECONDS = 30;

export default function NatureFmApp() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Remembers whether playback should continue while switching tracks.
  const shouldContinuePlayingRef = useRef(false);

  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [loaded, setLoaded] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  const currentTrack = TRACKS[currentTrackIndex];
  const canSeek = duration > 0;

  const timeLabel = useMemo(() => {
    const format = (seconds: number) => {
      if (!Number.isFinite(seconds) || seconds < 0) {
        return "00:00";
      }

      const whole = Math.floor(seconds);
      const minutes = Math.floor(whole / 60);
      const secs = whole % 60;

      return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(
        2,
        "0",
      )}`;
    };

    return {
      current: format(currentTime),
      total: format(duration),
    };
  }, [currentTime, duration]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    const shouldContinuePlaying = shouldContinuePlayingRef.current;

    setLoaded(false);
    setPlaybackError(null);
    setDuration(0);
    setCurrentTime(0);

    const playWhenReady = () => {
      if (!shouldContinuePlaying) {
        return;
      }

      void audio.play().catch((error: unknown) => {
        shouldContinuePlayingRef.current = false;
        setIsPlaying(false);

        setPlaybackError(
          error instanceof Error
            ? `Playback failed: ${error.message}`
            : "Playback failed. Please try again.",
        );
      });
    };

    audio.addEventListener("canplay", playWhenReady, { once: true });
    audio.load();

    return () => {
      audio.removeEventListener("canplay", playWhenReady);
    };
  }, [currentTrackIndex]);

  function handleLoadedMetadata() {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    setDuration(audio.duration || 0);
    setCurrentTime(audio.currentTime || 0);
    setLoaded(true);
    setPlaybackError(null);
  }

  function handleTimeUpdate() {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    setCurrentTime(audio.currentTime || 0);
  }

  function handlePlay() {
    setIsPlaying(true);
  }

  function handlePause() {
    /*
     * Track changes may briefly trigger a pause event.
     * Do not change the visible status during that transition.
     */
    if (!shouldContinuePlayingRef.current) {
      setIsPlaying(false);
    }
  }

  function handleAudioError() {
    shouldContinuePlayingRef.current = false;
    setLoaded(false);
    setIsPlaying(false);

    setPlaybackError(
      "The audio file could not be loaded. Make sure it is inside public/audio.",
    );
  }

  function handleEnded() {
    const isLastTrack = currentTrackIndex === TRACKS.length - 1;

    if (isLastTrack && !isLooping) {
      shouldContinuePlayingRef.current = false;
      setIsPlaying(false);
      return;
    }

    // Continue playing automatically when the next song begins.
    shouldContinuePlayingRef.current = true;

    setCurrentTrackIndex((index) =>
      index === TRACKS.length - 1 ? 0 : index + 1,
    );
  }

  async function togglePlayPause() {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (audio.paused) {
      // The user intentionally clicked Play.
      shouldContinuePlayingRef.current = true;
      setPlaybackError(null);

      try {
        await audio.play();
        setIsPlaying(true);
      } catch (error) {
        shouldContinuePlayingRef.current = false;
        setIsPlaying(false);

        setPlaybackError(
          error instanceof Error
            ? `Playback failed: ${error.message}`
            : "Playback failed. Please try again.",
        );
      }
    } else {
      // The user intentionally clicked Pause.
      shouldContinuePlayingRef.current = false;
      audio.pause();
      setIsPlaying(false);
    }
  }

  function selectTrack(index: number) {
    if (index < 0 || index >= TRACKS.length) {
      return;
    }

    setCurrentTrackIndex(index);
  }

  function nextTrack() {
    setCurrentTrackIndex((index) =>
      index === TRACKS.length - 1 ? 0 : index + 1,
    );
  }

  function previousTrack() {
    setCurrentTrackIndex((index) =>
      index === 0 ? TRACKS.length - 1 : index - 1,
    );
  }

  function seekBy(deltaSeconds: number) {
    const audio = audioRef.current;

    if (!audio || !canSeek) {
      return;
    }

    const nextTime = Math.min(
      duration,
      Math.max(0, audio.currentTime + deltaSeconds),
    );

    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  function handleVolumeChange(event: ChangeEvent<HTMLInputElement>) {
    const nextVolume = Number(event.target.value);
    const audio = audioRef.current;

    setVolume(nextVolume);

    if (audio) {
      audio.volume = nextVolume;
    }
  }

  function restartTrack() {
    const audio = audioRef.current;

    if (!audio || !canSeek) {
      return;
    }

    audio.currentTime = 0;
    setCurrentTime(0);
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

          <span className="nature-loop-status">
            Playlist loop {isLooping ? "On" : "Off"}
          </span>
        </div>

        <div className="nature-track-details">
          <div className="nature-artwork" aria-hidden="true">
            🌿
          </div>

          <div className="nature-track-info">
            <p className="nature-track-title">{currentTrack.title}</p>

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
                    width:
                      duration > 0
                        ? `${(currentTime / duration) * 100}%`
                        : "0%",
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

      <audio
        ref={audioRef}
        src={currentTrack.source}
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onError={handleAudioError}
      />

      <section className="nature-playlist" aria-label="Music playlist">
        <div className="nature-playlist-header">
          <strong>Playlist</strong>

          <span className="nature-playlist-count">
            {TRACKS.length} songs
          </span>
        </div>

        <div className="nature-playlist-items">
          {TRACKS.map((track, index) => (
            <button
              key={track.source}
              type="button"
              className={`nature-playlist-item ${
                index === currentTrackIndex
                  ? "nature-playlist-item-active"
                  : ""
              }`}
              onClick={() => selectTrack(index)}
              aria-current={
                index === currentTrackIndex ? "true" : undefined
              }
            >
              <span className="nature-playlist-song-title">
                {track.title}
              </span>

              {index === currentTrackIndex && (
                <span className="nature-playing-indicator">
                  Playing
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      <div className="nature-player-controls">
        <div className="nature-seek-controls">
          <button
            type="button"
            onClick={() => seekBy(-REWIND_SECONDS)}
            disabled={!canSeek}
          >
            ⏪ Rewind {REWIND_SECONDS}s
          </button>

          <button
            type="button"
            onClick={() => seekBy(SKIP_SECONDS)}
            disabled={!canSeek}
          >
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
          <button type="button" onClick={previousTrack}>
            Previous
          </button>

          <button
            type="button"
            className="nature-play-button"
            onClick={togglePlayPause}
          >
            {isPlaying ? "Pause" : "Play"}
          </button>

          <button type="button" onClick={nextTrack}>
            Next
          </button>

          <button
            type="button"
            onClick={restartTrack}
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

      <WeatherAmbience />

      <div className="sprout-app-bar">
        <SendToSproutButton
          appId="nature"
          text="Which nature sound should I study to?"
          context={`Nature.fm. Current track: "${currentTrack.title}" (${isPlaying ? "playing" : "paused"}). Available tracks: ${TRACKS.map((track) => track.title).join(", ")}. Looping: ${isLooping ? "on" : "off"}.`}
        />
      </div>

      <aside className="nature-session-notes">
        <strong>Study session notes</strong>

        <p>
          Use the looping nature playlist as background ambience while you
          work. Choose a song or let the playlist move automatically to the
          next track.
        </p>
      </aside>
    </div>
  );
}