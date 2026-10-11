"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ChangeEvent } from "react";
import { SendToSproutButton } from "@/app/components/sprout/SendToSproutButton";
import WeatherAmbience from "@/app/components/weather/WeatherAmbience";
import "./nature.css";

const TRACKS = [
  {
    id: "ambient",
    title: "Ambient Nature Loop",
    subtitle: "Soft forest ambience",
    source: "/audio/music.mp3",
    image: "/images/music-1.jpg",
    mood: "Forest",
  },
  {
    id: "morning",
    title: "Morning Nature",
    subtitle: "A fresh start outdoors",
    source: "/audio/music2short.mp3",
    image: "/images/music-2.jpg",
    mood: "Morning",
  },
  {
    id: "outdoor-break",
    title: "Peaceful Outdoor Break",
    subtitle: "A little space to breathe",
    source: "/audio/music3short.mp3",
    image: "/images/music-3.jpg",
    mood: "Calm",
  },
] as const;

const formatTime = (value: number) => {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const seconds = Math.floor(value);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

export default function NatureFmApp() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const continuePlayingRef = useRef(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loopPlaylist, setLoopPlaylist] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.72);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const track = TRACKS[trackIndex];
  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const status = error ? "Needs attention" : playing ? "Now playing" : loaded ? "Ready when you are" : "Preparing soundscape";

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const shouldResume = continuePlayingRef.current;
    setLoaded(false);
    setError(null);
    setDuration(0);
    setCurrentTime(0);

    const resumePlayback = () => {
      if (!shouldResume) return;
      void audio.play().catch((reason: unknown) => {
        continuePlayingRef.current = false;
        setPlaying(false);
        setError(reason instanceof Error ? reason.message : "Playback could not start. Try pressing play again.");
      });
    };

    audio.addEventListener("canplay", resumePlayback, { once: true });
    audio.load();
    return () => audio.removeEventListener("canplay", resumePlayback);
  }, [trackIndex]);

  const changeTrack = useCallback((nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= TRACKS.length) return;
    setTrackIndex(nextIndex);
  }, []);

  const stepTrack = useCallback((direction: number) => {
    setTrackIndex((index) => {
      const next = index + direction;
      if (next < 0) return TRACKS.length - 1;
      if (next >= TRACKS.length) return 0;
      return next;
    });
  }, []);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      continuePlayingRef.current = true;
      setError(null);
      try {
        await audio.play();
        setPlaying(true);
      } catch (reason) {
        continuePlayingRef.current = false;
        setPlaying(false);
        setError(reason instanceof Error ? reason.message : "Playback could not start. Please try again.");
      }
    } else {
      continuePlayingRef.current = false;
      audio.pause();
      setPlaying(false);
    }
  };

  const seekTo = (event: ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const nextTime = Number(event.target.value);
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const handleEnded = () => {
    if (trackIndex === TRACKS.length - 1 && !loopPlaylist) {
      continuePlayingRef.current = false;
      setPlaying(false);
      return;
    }
    continuePlayingRef.current = true;
    stepTrack(1);
  };

  const context = useMemo(
    () =>
      `Nature.fm soundscape. Current track: "${track.title}". Playback: ${playing ? "playing" : "paused"}. Playlist looping: ${loopPlaylist ? "on" : "off"}. Available soundscapes: ${TRACKS.map((item) => item.title).join(", ")}.`,
    [track.title, playing, loopPlaylist],
  );

  return (
    <main className="nature-fm" aria-label="Nature.fm soundscape player">
      <div className="nature-fm-sky" aria-hidden="true">
        <span className="nature-orb nature-orb-one" />
        <span className="nature-orb nature-orb-two" />
        <span className="nature-orb nature-orb-three" />
      </div>

      <header className="nature-fm-heading">
        <div className="nature-fm-brandline">
          <span className="nature-fm-brand-icon" aria-hidden="true">♫</span>
          <span>ctrl + alt + study sound studio</span>
          <span className="nature-fm-live-dot" />
          <span className="nature-fm-live-label">AUDIO SPACE</span>
        </div>
        <div className="nature-fm-title-row">
          <div>
            <p className="nature-fm-kicker">A little calm, on demand</p>
            <h2>Nature<span>.fm</span></h2>
            <p className="nature-fm-intro">A soft soundtrack for your next little stretch of focus.</p>
          </div>
          <div className={`nature-fm-status ${error ? "is-error" : ""}`}>
            <span className="nature-fm-status-pulse" />
            {status}
          </div>
        </div>
      </header>

      <section className="nature-fm-layout">
        <div className="nature-fm-main-column">
          <section className="nature-fm-now-playing glass-panel" aria-label="Current soundscape">
            <div className="nature-fm-artwork" style={{ backgroundImage: `url(${track.image})` }}>
              {/* Plain <img>: local artwork with an onError fallback. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="nature-fm-art-image" src={track.image} alt={`${track.title} artwork`} onError={(event) => { event.currentTarget.hidden = true; }} />
              <div className="nature-fm-art-glow" />
              <div className="nature-fm-art-sun" />
              <div className="nature-fm-art-hill nature-fm-art-hill-back" />
              <div className="nature-fm-art-hill nature-fm-art-hill-front" />
              <span className="nature-fm-art-caption">SLOW DOWN · TUNE IN</span>
            </div>

            <div className="nature-fm-track-content">
              <div className="nature-fm-track-topline">
                <span className="nature-fm-pill"><span className="nature-fm-equalizer" aria-hidden="true"><i /><i /><i /></span> {playing ? "Playing now" : "Selected soundscape"}</span>
                <span className="nature-fm-track-mood">{track.mood} collection</span>
              </div>
              <p className="nature-fm-track-subtitle">{track.subtitle}</p>
              <h3>{track.title}</h3>
              <p className="nature-fm-track-description">Settle into a gentle soundscape, find your rhythm, and let the outside world feel a little closer.</p>

              <audio
                ref={audioRef}
                src={track.source}
                preload="metadata"
                onLoadedMetadata={(event) => {
                  setDuration(event.currentTarget.duration || 0);
                  setCurrentTime(event.currentTarget.currentTime || 0);
                  setLoaded(true);
                  setError(null);
                }}
                onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime || 0)}
                onPlay={() => setPlaying(true)}
                onPause={() => {
                  if (!continuePlayingRef.current) setPlaying(false);
                }}
                onEnded={handleEnded}
                onError={() => {
                  continuePlayingRef.current = false;
                  setLoaded(false);
                  setPlaying(false);
                  setError(`Couldn't load ${track.source}. Check that the audio file exists in public/audio.`);
                }}
              />

              {error && <p className="nature-fm-error" role="alert">{error}</p>}

              <div className="nature-fm-progress">
                <input
                  aria-label="Track position"
                  type="range"
                  min={0}
                  max={duration || 1}
                  step={1}
                  value={Math.min(currentTime, duration || 1)}
                  onChange={seekTo}
                  disabled={!loaded || !duration}
                  style={{ "--progress": `${progress}%` } as CSSProperties}
                />
                <div className="nature-fm-time"><span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span></div>
              </div>

              <div className="nature-fm-controls">
                <button className="nature-fm-icon-button" type="button" onClick={() => stepTrack(-1)} aria-label="Previous soundscape" title="Previous soundscape">‹|</button>
                <button className="nature-fm-play-button" type="button" onClick={togglePlayback} aria-label={playing ? "Pause soundscape" : "Play soundscape"}>
                  <span aria-hidden="true">{playing ? "Ⅱ" : "▶"}</span>
                  {playing ? "Pause" : "Play soundscape"}
                </button>
                <button className="nature-fm-icon-button" type="button" onClick={() => stepTrack(1)} aria-label="Next soundscape" title="Next soundscape">|›</button>
                <button className={`nature-fm-loop-button ${loopPlaylist ? "is-active" : ""}`} type="button" onClick={() => setLoopPlaylist((value) => !value)} aria-pressed={loopPlaylist}>
                  <span aria-hidden="true">⟳</span> Loop {loopPlaylist ? "on" : "off"}
                </button>
              </div>

              <label className="nature-fm-volume">
                <span><span aria-hidden="true">◖</span> Volume</span>
                <input aria-label="Volume" type="range" min={0} max={1} step={0.01} value={volume} onChange={(event) => setVolume(Number(event.target.value))} style={{ "--progress": `${volume * 100}%` } as CSSProperties} />
                <span className="nature-fm-volume-value">{Math.round(volume * 100)}%</span>
              </label>
            </div>
          </section>

          <section className="nature-fm-note glass-panel">
            <span className="nature-fm-note-icon" aria-hidden="true">✦</span>
            <div>
              <strong>Your tiny reminder</strong>
              <p>You don&apos;t need to rush. Pick a sound, take a breath, and begin with one small thing.</p>
            </div>
          </section>
        </div>

        <aside className="nature-fm-side-column">
          <section className="nature-fm-playlist glass-panel" aria-label="Soundscape library">
            <div className="nature-fm-section-heading">
              <div>
                <p className="nature-fm-kicker">Pick your atmosphere</p>
                <h3>Sound library</h3>
              </div>
              <span className="nature-fm-count">{TRACKS.length} tracks</span>
            </div>
            <div className="nature-fm-track-list">
              {TRACKS.map((item, index) => {
                const active = index === trackIndex;
                return (
                  <button key={item.id} type="button" className={`nature-fm-track-option ${active ? "is-selected" : ""}`} onClick={() => changeTrack(index)} aria-current={active ? "true" : undefined}>
                    <span className="nature-fm-option-copy">
                      <strong>{item.title}</strong>
                      <small>{item.subtitle}</small>
                    </span>
                    <span className="nature-fm-option-action" aria-hidden="true">{active && playing ? "♫" : active ? "✓" : "▶"}</span>
                  </button>
                );
              })}
            </div>
            <div className="nature-fm-playlist-footer"><span className="nature-fm-footer-leaf">❋</span> Curated for a calmer study session</div>
          </section>

          <WeatherAmbience />

          <section className="nature-fm-sprout glass-panel">
            <div className="nature-fm-sprout-orb" aria-hidden="true">🫧</div>
            <p className="nature-fm-kicker">Your study companion</p>
            <h3>Need a little guidance?</h3>
            <p>Ask Sprout which soundscape might fit the kind of work or break you have planned.</p>
            <div className="nature-fm-sprout-action">
              <SendToSproutButton appId="nature" text="Which nature sound should I study to?" context={context} />
            </div>
          </section>
        </aside>
      </section>
      <footer className="nature-fm-footer">
        <span>☼ Take it at your own pace</span>
        <span>ctrl + alt + study · nature.fm</span>
      </footer>
    </main>
  );
}
