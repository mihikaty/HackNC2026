"use client";

import { useEffect, useState } from "react";
import { SendToSproutButton } from "@/components/sprout/SendToSproutButton";

const PRESETS = [25, 50];

export function FocusApp() {
  const [task, setTask] = useState("");
  const [duration, setDuration] = useState(25);
  const [remainingMs, setRemainingMs] = useState(25 * 60_000);
  const [running, setRunning] = useState(false);
  const [endAt, setEndAt] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!running || endAt === null) return;

    function tick() {
      const remaining = Math.max(0, endAt! - Date.now());

      setRemainingMs(remaining);

      if (remaining === 0) {
        setRunning(false);
        setEndAt(null);
        setCompleted(true);
      }
    }

    tick();
    const interval = window.setInterval(tick, 250);

    return () => window.clearInterval(interval);
  }, [running, endAt]);

  function startTimer() {
    const remaining =
      remainingMs > 0 ? remainingMs : duration * 60_000;

    setRemainingMs(remaining);
    setEndAt(Date.now() + remaining);
    setRunning(true);
    setCompleted(false);
  }

  function pauseTimer() {
    if (endAt !== null) {
      setRemainingMs(Math.max(0, endAt - Date.now()));
    }

    setEndAt(null);
    setRunning(false);
  }

  function resetTimer() {
    setRunning(false);
    setEndAt(null);
    setRemainingMs(duration * 60_000);
    setCompleted(false);
  }

  function chooseDuration(minutes: number) {
    setDuration(minutes);
    setRemainingMs(minutes * 60_000);
    setCompleted(false);
  }

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return (
    <div className="focus-panel">
      <label className="focus-label" htmlFor="focus-task">
        WHAT ARE YOU WORKING ON?
      </label>

      <input
        id="focus-task"
        className="focus-task-input"
        value={task}
        onChange={(event) => setTask(event.target.value)}
        placeholder="e.g. Review stochastic modeling"
        disabled={running}
      />

      <div className="focus-presets" aria-label="Focus duration">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            className={`focus-preset ${
              duration === preset ? "focus-preset-selected" : ""
            }`}
            onClick={() => chooseDuration(preset)}
            disabled={running}
          >
            {preset} min
          </button>
        ))}
      </div>

      <div
        className="focus-timer"
        role="timer"
        aria-label={`${minutes} minutes and ${seconds} seconds remaining`}
      >
        {String(minutes).padStart(2, "0")}:
        {String(seconds).padStart(2, "0")}
      </div>

      <p className="focus-status">
        {completed
          ? "Session complete! Take a moment to reset."
          : running
            ? "You're in focus mode. One thing at a time."
            : "A little progress is still progress."}
      </p>

      <div className="focus-actions">
        {running ? (
          <button className="focus-primary" onClick={pauseTimer}>
            Pause
          </button>
        ) : (
          <button className="focus-primary" onClick={startTimer}>
            {remainingMs === 0 ? "Start again" : "Start focusing"}
          </button>
        )}

        <button className="focus-secondary" onClick={resetTimer}>
          Reset
        </button>
      </div>

      <div className="sprout-app-bar">
        <SendToSproutButton
          appId="focus"
          text={
            completed
              ? "I just finished a focus session. What should I do next?"
              : task.trim()
                ? "Can you help me break this task into steps?"
                : "Can you help me figure out what to focus on?"
          }
          context={`Focus timer. Task: ${task.trim() || "(none entered)"}. Session length: ${duration} minutes. Time left: ${minutes}m ${seconds}s. ${completed ? "Session just completed." : running ? "Timer is running." : "Timer is not running."}`}
        />
      </div>

      {completed && (
        <div className="focus-break-prompt">
          <strong>You&apos;ve earned a breather.</strong>
          <p>
            Find an outdoor spot in Explore.exe or pick a short activity
            in TouchGrass.exe.
          </p>
        </div>
      )}
    </div>
  );
}