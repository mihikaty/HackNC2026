"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { FocusApp } from "@/app/components/focus/FocusApp";
import NatureFmApp from "@/app/components/nature/NatureFmApp";
import TouchGrassApp from "@/app/components/Touching/TouchGrassApp";
import ExploreApp from "@/app/components/explore/ExploreApp";
import SproutApp from "@/app/components/sprout/SproutApp";
import { SproutProvider } from "@/app/components/sprout/SproutProvider";
import WeatherApp from "@/app/components/weather/WeatherApp";
import Screensaver from "@/app/components/screensaver/Screensaver";

const PROGRAMS = [
  { id: "focus", name: "Focus.exe", icon: "/icons/pomodoro.jpg", description: "Your personal study timer and task space.", next: "Build a focus timer, task list, and session history here." },
  { id: "explore", name: "Explore.exe", icon: "/icons/explore.jpg", description: "Find your next outdoor study spot.", next: "Build the campus map, location cards, and filters here." },
  { id: "nature", name: "Nature.fm", icon: "/icons/naturefm.jpg", description: "Bring the sounds of nature into your study session.", next: "Build the audio player and nature sound library here." },
  { id: "touchgrass", name: "TouchGrass.exe", icon: "/icons/touchgrass.jpg", description: "Take a tiny break away from your screen.", next: "Build outdoor challenges, activity instructions, and optional progress logging here." },
  { id: "weather", name: "Weather.exe", icon: "/icons/weather.jpg", description: "Find out whether it is a good time to go outside.", next: "Connect a weather API and generate weather-aware recommendations here." },
  { id: "sprout", name: "Sprout.exe", icon: "/icons/sprout.jpg", description: "Your study and outdoor-break companion.", next: "Connect the chat interface to the Sprout backend and Photon iMessage agent." },
  { id: "screensaver", name: "Screensaver.exe", icon: "/icons/fish6.jpg", description: "A little fish swimming through a galaxy.", next: "Watch a fish drift through deep space." },
] as const;

type ProgramId = (typeof PROGRAMS)[number]["id"];
type Theme = "day" | "night";

type WindowState = {
  id: ProgramId;
  x: number;
  y: number;
  minimized: boolean;
  maximized: boolean;
  zIndex: number;
};

const SPAWN_OFFSETS = [
  { x: 140, y: 55 }, { x: 175, y: 85 }, { x: 210, y: 45 },
  { x: 155, y: 105 }, { x: 190, y: 70 }, { x: 145, y: 90 },
  { x: 205, y: 110 },
];

export default function Home() {
  const [theme, setTheme] = useState<Theme>("day");
  const [themeLoaded, setThemeLoaded] = useState(false);
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [activeId, setActiveId] = useState<ProgramId | null>(null);
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [clock, setClock] = useState("--:--");
  const [date, setDate] = useState("");
  const zCounter = useRef(10);
  const dragRef = useRef<{ id: ProgramId; startMX: number; startMY: number; startWX: number; startWY: number } | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("bliss-theme");

    const loadTheme = window.setTimeout(() => {
      if (saved === "day" || saved === "night") setTheme(saved);
      setThemeLoaded(true);
    }, 0);

    return () => window.clearTimeout(loadTheme);
  }, []);

  useEffect(() => {
    if (themeLoaded) window.localStorage.setItem("bliss-theme", theme);
  }, [theme, themeLoaded]);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
      setDate(now.toLocaleDateString([], { month: "numeric", day: "numeric", year: "2-digit" }));
    };
    updateClock();
    const interval = window.setInterval(updateClock, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      if (!dragRef.current) return;
      const drag = dragRef.current;
      setWindows((current) => current.map((win) => win.id === drag.id ? { ...win, x: drag.startWX + event.clientX - drag.startMX, y: drag.startWY + event.clientY - drag.startMY } : win));
    };
    const onUp = () => { dragRef.current = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  function bringToFront(id: ProgramId) {
    zCounter.current += 1;
    setWindows((current) => current.map((win) => win.id === id ? { ...win, zIndex: zCounter.current, minimized: false } : win));
    setActiveId(id);
  }

  function openApp(id: ProgramId) {
    setStartMenuOpen(false);
    if (windows.some((win) => win.id === id)) { bringToFront(id); return; }
    const offset = window.innerWidth <= 640
      ? { x: 12, y: 72 }
      : SPAWN_OFFSETS[windows.length % SPAWN_OFFSETS.length];
    zCounter.current += 1;
    setWindows((current) => [...current, { id, x: offset.x, y: offset.y, minimized: false, maximized: false, zIndex: zCounter.current }]);
    setActiveId(id);
  }

  function closeApp(id: ProgramId) {
    setWindows((current) => current.filter((win) => win.id !== id));
    setActiveId((current) => current === id ? null : current);
  }

  function minimizeWindow(id: ProgramId) {
    setWindows((current) => current.map((win) => win.id === id ? { ...win, minimized: true } : win));
    setActiveId((current) => current === id ? null : current);
  }

  function toggleMaximize(id: ProgramId) {
    setWindows((current) => current.map((win) => win.id === id ? { ...win, maximized: !win.maximized } : win));
  }

  function startDrag(event: React.MouseEvent, id: ProgramId) {
    const win = windows.find((item) => item.id === id);
    if (!win || win.maximized) return;
    bringToFront(id);
    dragRef.current = { id, startMX: event.clientX, startMY: event.clientY, startWX: win.x, startWY: win.y };
    event.preventDefault();
  }

  function handleTaskbarClick(id: ProgramId) {
    const win = windows.find((item) => item.id === id);
    if (!win) return;
    if (win.minimized || activeId !== id) bringToFront(id); else minimizeWindow(id);
  }

  return (
    <SproutProvider openSprout={() => openApp("sprout")}>
    <main className="desktop" data-theme={theme} onClick={() => setStartMenuOpen(false)}>
      <div className="sky" aria-hidden="true" />
      <header className="desktop-header"><div><div className="desktop-brand">B L I S S . E X E</div><div className="desktop-subtitle">A little more focus. A little more outside.</div></div><div className="desktop-status"><span className="status-dot" />YOUR LITTLE CORNER OF THE WORLD</div></header>

      <section className="desktop-icons" aria-label="Desktop applications">
        {PROGRAMS.map((program) => <button key={program.id} className={`desktop-icon${activeId === program.id ? " selected" : ""}`} onClick={(event) => { event.stopPropagation(); openApp(program.id); }} aria-label={`Open ${program.name}`}><span className="desktop-icon-image"><Image src={program.icon} alt="" width={48} height={48} unoptimized /></span><span className="desktop-icon-label">{program.name}</span></button>)}
      </section>

      {windows.map((win) => {
        const program = PROGRAMS.find((item) => item.id === win.id)!;
        const isActive = activeId === win.id;
        return <section key={win.id} className={`app-window resizable${win.id === "explore" ? " explore-window" : ""} ${win.id}-window${isActive ? " active" : ""}${win.maximized ? " maximized" : ""}`} style={win.maximized ? { zIndex: win.zIndex } : { transform: `translate(${win.x}px, ${win.y}px)`, zIndex: win.zIndex, display: win.minimized ? "none" : "flex" }} onMouseDown={() => bringToFront(win.id)} aria-label={program.name}>
          <div className="window-titlebar" style={{ cursor: win.maximized ? "default" : "grab" }} onMouseDown={(event) => startDrag(event, win.id)} onDoubleClick={() => toggleMaximize(win.id)}><div className="window-title"><span><Image src={program.icon} alt="" width={48} height={48} unoptimized /></span><span>{program.name}</span></div><div className="window-controls"><button className="window-control" onClick={(event) => { event.stopPropagation(); minimizeWindow(win.id); }} aria-label={`Minimize ${program.name}`} title="Minimize">─</button><button className="window-control" onClick={(event) => { event.stopPropagation(); toggleMaximize(win.id); }} aria-label={win.maximized ? `Restore ${program.name}` : `Maximize ${program.name}`} title={win.maximized ? "Restore" : "Maximize"}>{win.maximized ? "❐" : "□"}</button><button className="window-close" onClick={(event) => { event.stopPropagation(); closeApp(win.id); }} aria-label={`Close ${program.name}`} title="Close">×</button></div></div>
          <div className="window-content">{win.id === "focus" ? <FocusApp /> : win.id === "nature" ? <NatureFmApp /> : win.id === "touchgrass" ? <TouchGrassApp /> : win.id === "explore" ? <ExploreApp /> : win.id === "sprout" ? <SproutApp /> : win.id === "screensaver" ? <Screensaver /> : win.id === "weather" ? <WeatherApp /> : <><div className="program-hero-icon"><Image src={program.icon} alt="" width={58} height={58} unoptimized /></div><h2>{program.name}</h2><p className="program-description">{program.description}</p><div className="program-placeholder"><span className="placeholder-label">COMING TO THIS WINDOW</span><p>{program.next}</p></div></>}</div>
        </section>;
      })}

      {startMenuOpen && <section className="start-menu" aria-label="Start menu" onClick={(event) => event.stopPropagation()}><div className="start-menu-header"><div className="start-avatar">🌿</div><div><strong>Welcome to Bliss</strong><span>Your study space</span></div></div><div className="start-menu-list">{PROGRAMS.map((program) => <button key={program.id} className="start-menu-item" onClick={() => openApp(program.id)}><span><Image src={program.icon} alt="" width={23} height={23} unoptimized /></span>{program.name}</button>)}</div><div className="start-menu-footer">Take a breath. You&apos;re doing fine.</div></section>}
      <footer className="taskbar" onClick={(event) => event.stopPropagation()}><button className="start-button" onClick={() => setStartMenuOpen((current) => !current)} aria-expanded={startMenuOpen}><span className="start-orb">✿</span>Start</button><div className="taskbar-divider" /><div className="taskbar-apps">{windows.map((win) => { const program = PROGRAMS.find((item) => item.id === win.id)!; return <button key={win.id} className={`taskbar-app${activeId === win.id && !win.minimized ? " taskbar-app-active" : ""}`} onClick={() => handleTaskbarClick(win.id)} title={program.name}><Image src={program.icon} alt="" width={17} height={17} unoptimized /> {program.name}</button>; })}</div><div className="taskbar-spacer" /><button className="theme-toggle" onClick={() => setTheme((current) => current === "day" ? "night" : "day")} title="Switch day and night modes">{theme === "day" ? "☀ Day" : "☾ Night"}</button><div className="system-clock">{clock}</div></footer>
    </main>
    </SproutProvider>
  );
}
