"use client";

import { useEffect, useState } from "react";
import { FocusApp } from "@/components/FocusApp";

const PROGRAMS = [
  {
    id: "focus",
    name: "Focus.exe",
    icon: "⏱️",
    description: "Your personal study timer and task space.",
    next: "Build a focus timer, task list, and session history here.",
  },
  {
    id: "explore",
    name: "Explore.exe",
    icon: "🧭",
    description: "Find your next outdoor study spot.",
    next: "Build the campus map, location cards, and filters here.",
  },
  {
    id: "nature",
    name: "Nature.fm",
    icon: "🎧",
    description: "Bring the sounds of nature into your study session.",
    next: "Build the audio player and nature sound library here.",
  },
  {
    id: "touchgrass",
    name: "TouchGrass.exe",
    icon: "🌱",
    description: "Take a tiny break away from your screen.",
    next: "Build outdoor challenges, activity instructions, and optional progress logging here.",
  },
  {
    id: "weather",
    name: "Weather.exe",
    icon: "🌤️",
    description: "Find out whether it is a good time to go outside.",
    next: "Connect a weather API and generate weather-aware recommendations here.",
  },
  {
    id: "sprout",
    name: "Sprout.exe",
    icon: "🫧",
    description: "Your study and outdoor-break companion.",
    next: "Connect the chat interface to the Sprout backend and Photon iMessage agent.",
  },
] as const;

type ProgramId = (typeof PROGRAMS)[number]["id"];
type Theme = "day" | "night";

export default function Home() {
  const [theme, setTheme] = useState<Theme>("day");
  const [themeLoaded, setThemeLoaded] = useState(false);
  const [openApps, setOpenApps] = useState<ProgramId[]>([]);
  const [activeApp, setActiveApp] = useState<ProgramId | null>(null);
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [clock, setClock] = useState("--:--");

  useEffect(() => {
    const saved = window.localStorage.getItem("bliss-theme");

    window.setTimeout(() => {
      if (saved === "day" || saved === "night") {
        setTheme(saved);
      }

      setThemeLoaded(true);
    }, 0);
  }, []);

  useEffect(() => {
    if (themeLoaded) {
      window.localStorage.setItem("bliss-theme", theme);
    }
  }, [theme, themeLoaded]);

  useEffect(() => {
    const updateClock = () => {
      setClock(
        new Date().toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        }),
      );
    };

    updateClock();
    const interval = window.setInterval(updateClock, 30_000);

    return () => window.clearInterval(interval);
  }, []);

  function openApp(id: ProgramId) {
    setOpenApps((current) =>
      current.includes(id) ? current : [...current, id],
    );
    setActiveApp(id);
    setStartMenuOpen(false);
  }

  function closeApp(id: ProgramId) {
    const remaining = openApps.filter((appId) => appId !== id);

    setOpenApps(remaining);

    if (activeApp === id) {
      setActiveApp(remaining[remaining.length - 1] ?? null);
    }
  }

  const activeProgram = PROGRAMS.find(
    (program) => program.id === activeApp,
  );

  return (
    <main className="desktop" data-theme={theme}>
      {/* CSS-drawn scenery. Replace with your own wallpaper later. */}
      <div className="sky" aria-hidden="true">
        <div className="cloud cloud-one" />
        <div className="cloud cloud-two" />
        <div className="cloud cloud-three" />
        <div className="hill hill-back" />
        <div className="hill hill-front" />
      </div>

      <header className="desktop-header">
        <div>
          <div className="desktop-brand">B L I S S . E X E</div>
          <div className="desktop-subtitle">
            A little more focus. A little more outside.
          </div>
        </div>

        <div className="desktop-status">
          <span className="status-dot" />
          YOUR LITTLE CORNER OF THE WORLD
        </div>
      </header>

      {/* Desktop application shortcuts */}
      <section className="desktop-icons" aria-label="Desktop applications">
        {PROGRAMS.map((program) => (
          <button
            key={program.id}
            className={`desktop-icon ${
              activeApp === program.id ? "selected" : ""
            }`}
            onClick={() => openApp(program.id)}
            aria-label={`Open ${program.name}`}
          >
            <span className="desktop-icon-image">{program.icon}</span>
            <span className="desktop-icon-label">{program.name}</span>
          </button>
        ))}
      </section>

      {/* Open application windows */}
      {openApps.map((appId, index) => {
        const program = PROGRAMS.find((item) => item.id === appId);

        if (!program) return null;

        const isActive = activeApp === appId;

        return (
          <section
            key={appId}
            className={`app-window window-offset-${index % 3} ${
              isActive ? "active" : ""
            }`}
            style={{ zIndex: isActive ? 50 : 10 + index }}
            onMouseDown={() => setActiveApp(appId)}
            aria-label={program.name}
          >
            <div className="window-titlebar">
              <div className="window-title">
                <span>{program.icon}</span>
                <span>{program.name}</span>
              </div>

              <button
                className="window-close"
                onClick={() => closeApp(appId)}
                aria-label={`Close ${program.name}`}
              >
                ×
              </button>
            </div>

            <div className="window-content">
              {appId === "focus" ? (
                <FocusApp />
              ) : (
                <>
                  <div className="program-hero-icon">{program.icon}</div>
                  <h2>{program.name}</h2>
                  <p className="program-description">{program.description}</p>

                  <div className="program-placeholder">
                    <span className="placeholder-label">COMING TO THIS WINDOW</span>
                    <p>{program.next}</p>
                  </div>

                  {appId === "sprout" && (
                    <p className="sprout-note">
                      Sprout&apos;s web chat and real iMessage connection will be
                      added in the next development steps.
                    </p>
                  )}
                </>
              )}
            </div>
          </section>
        );
      })}

      {activeProgram && (
        <div className="active-app-hint" role="status">
          Open: {activeProgram.name}
        </div>
      )}

      {/* Start menu */}
      {startMenuOpen && (
        <section className="start-menu" aria-label="Start menu">
          <div className="start-menu-header">
            <div className="start-avatar">🌿</div>
            <div>
              <strong>Welcome to Bliss</strong>
              <span>Your study space</span>
            </div>
          </div>

          <div className="start-menu-list">
            {PROGRAMS.map((program) => (
              <button
                key={program.id}
                className="start-menu-item"
                onClick={() => openApp(program.id)}
              >
                <span>{program.icon}</span>
                {program.name}
              </button>
            ))}
          </div>

          <div className="start-menu-footer">
            Take a breath. You&apos;re doing fine.
          </div>
        </section>
      )}

      {/* Windows XP-inspired taskbar */}
      <footer className="taskbar">
        <button
          className="start-button"
          onClick={() => setStartMenuOpen((current) => !current)}
          aria-expanded={startMenuOpen}
        >
          <span className="start-orb">✿</span>
          Start
        </button>

        <div className="taskbar-divider" />

        <div className="taskbar-apps">
          {openApps.map((appId) => {
            const program = PROGRAMS.find((item) => item.id === appId);

            if (!program) return null;

            return (
              <button
                key={appId}
                className={`taskbar-app ${
                  activeApp === appId ? "taskbar-app-active" : ""
                }`}
                onClick={() => setActiveApp(appId)}
                title={program.name}
              >
                {program.icon} {program.name}
              </button>
            );
          })}
        </div>

        <div className="taskbar-spacer" />

        <button
          className="theme-toggle"
          onClick={() =>
            setTheme((current) => (current === "day" ? "night" : "day"))
          }
          title="Switch day and night modes"
        >
          {theme === "day" ? "☀ Day Mode" : "☾ Night Mode"}
        </button>

        <div className="system-clock">{clock}</div>
      </footer>
    </main>
  );
}