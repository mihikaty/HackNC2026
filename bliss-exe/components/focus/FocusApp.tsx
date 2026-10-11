"use client";

import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { SendToSproutButton } from "@/components/sprout/SendToSproutButton";
import "./focus.css";

type StudyTask = {
  id: string;
  title: string;
  notes: string;
  priority: "Low" | "Medium" | "High";
  dueDate: string;
  done: boolean;
};

const PRESETS = [25, 50, 90];
const TASKS_STORAGE_KEY = "bliss-focus-tasks-v1";

function formatTime(milliseconds: number) {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function FocusApp() {
  const [tasks, setTasks] = useState<StudyTask[]>(() => {
    if (typeof window === "undefined") return [];

    try {
      const saved = window.localStorage.getItem(TASKS_STORAGE_KEY);
      if (!saved) return [];

      const parsed = JSON.parse(saved) as StudyTask[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskNotes, setNewTaskNotes] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<StudyTask["priority"]>("Medium");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState("");

  const [duration, setDuration] = useState(25);
  const [customMinutes, setCustomMinutes] = useState("25");
  const [remainingMs, setRemainingMs] = useState(25 * 60_000);
  const [running, setRunning] = useState(false);
  const [endAt, setEndAt] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [showTaskForm, setShowTaskForm] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // The app remains usable if browser storage is unavailable.
    }
  }, [tasks]);

  useEffect(() => {
    if (!running || endAt === null) return;

    function tick() {
      const remaining = Math.max(0, endAt! - Date.now());
      setRemainingMs(remaining);

      if (remaining === 0) {
        setRunning(false);
        setEndAt(null);
        setCompleted(true);
        setCompletedSessions((count) => count + 1);
      }
    }

    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [running, endAt]);

  const selectedTask = tasks.find((task) => task.id === selectedTaskId);
  const openTasks = tasks.filter((task) => !task.done);
  const doneTasks = tasks.filter((task) => task.done);

  const progress = useMemo(() => {
    const total = duration * 60_000;
    if (total <= 0) return 0;
    return Math.min(100, Math.max(0, ((total - remainingMs) / total) * 100));
  }, [duration, remainingMs]);

  const focusContext = useMemo(() => {
    const taskList = tasks.length
      ? tasks
          .map((task) => {
            const due = task.dueDate ? `, due ${task.dueDate}` : "";
            const notes = task.notes ? `, details: ${task.notes}` : "";
            return `- ${task.done ? "[Completed]" : "[Outstanding]"} ${task.title} (priority: ${task.priority}${due}${notes})`;
          })
          .join("\n")
      : "No assignments have been added yet.";

    return [
      "The user is using Focus.exe, a study planner and Pomodoro timer inside Bliss.exe.",
      `Selected focus task: ${selectedTask?.title ?? "No task selected"}.`,
      `Selected task details: ${selectedTask?.notes || "No extra details provided"}.`,
      `Selected task priority: ${selectedTask?.priority ?? "Not set"}.`,
      `Selected task due date: ${selectedTask?.dueDate || "Not provided"}.`,
      `Focus session length: ${duration} minutes.`,
      `Time remaining: ${formatTime(remainingMs)}.`,
      `Timer state: ${completed ? "The latest session just finished" : running ? "Running" : "Paused or not started"}.`,
      `Completed focus sessions in this visit: ${completedSessions}.`,
      `Assignments completed: ${doneTasks.length}; assignments remaining: ${openTasks.length}.`,
      "Current assignment list:",
      taskList,
      "Help the user make a realistic plan based on the available time and their outstanding tasks. When useful, break the selected task into small, actionable steps, suggest what to do during this session, and recommend a short break after a completed session. Do not assume deadlines or task details that were not provided.",
    ].join("\n");
  }, [
    tasks,
    selectedTask,
    duration,
    remainingMs,
    completed,
    running,
    completedSessions,
    doneTasks.length,
    openTasks.length,
  ]);

  function applyDuration(minutes: number) {
    const safeMinutes = Math.min(180, Math.max(1, Math.round(minutes)));
    setDuration(safeMinutes);
    setCustomMinutes(String(safeMinutes));
    setRemainingMs(safeMinutes * 60_000);
    setRunning(false);
    setEndAt(null);
    setCompleted(false);
  }

  function applyCustomDuration() {
    const parsed = Number(customMinutes);
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 180) return;
    applyDuration(parsed);
  }

  function startTimer() {
    const remaining = remainingMs > 0 ? remainingMs : duration * 60_000;
    setRemainingMs(remaining);
    setEndAt(Date.now() + remaining);
    setRunning(true);
    setCompleted(false);
  }

  function pauseTimer() {
    if (endAt !== null) setRemainingMs(Math.max(0, endAt - Date.now()));
    setEndAt(null);
    setRunning(false);
  }

  function resetTimer() {
    setRunning(false);
    setEndAt(null);
    setRemainingMs(duration * 60_000);
    setCompleted(false);
  }

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newTaskTitle.trim();
    if (!title) return;

    const task: StudyTask = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      notes: newTaskNotes.trim(),
      priority: newTaskPriority,
      dueDate: newTaskDueDate,
      done: false,
    };

    setTasks((current) => [task, ...current]);
    setSelectedTaskId(task.id);
    setNewTaskTitle("");
    setNewTaskNotes("");
    setNewTaskPriority("Medium");
    setNewTaskDueDate("");
    setShowTaskForm(false);
  }

  function toggleTask(taskId: string) {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, done: !task.done } : task,
      ),
    );
  }

  function deleteTask(taskId: string) {
    setTasks((current) => current.filter((task) => task.id !== taskId));
    if (selectedTaskId === taskId) setSelectedTaskId("");
  }

  return (
    <div className="focus-aero">
      <header className="focus-welcome">
        <div className="focus-orb" aria-hidden="true">✦</div>
        <div>
          <p className="focus-eyebrow">YOUR LITTLE PRODUCTIVITY PARADISE</p>
          <h2>Focus Garden</h2>
          <p className="focus-subtitle">
            One task, one session, one little win at a time.
          </p>
        </div>
      </header>

      <section className="focus-glass focus-timer-card" aria-label="Pomodoro timer">
        <div className="focus-card-heading">
          <div>
            <p className="focus-eyebrow">FOCUS SESSION</p>
            <h3>Make a little progress</h3>
          </div>
          <span className={`focus-live-pill ${running ? "is-running" : ""}`}>
            <span className="focus-live-dot" />
            {running ? "IN THE ZONE" : completed ? "SESSION COMPLETE" : "READY WHEN YOU ARE"}
          </span>
        </div>

        <div className="focus-timer-ring" style={{ "--focus-progress": `${progress}%` } as CSSProperties}>
          <div className="focus-timer-inner">
            <span className="focus-timer-sparkle" aria-hidden="true">✧</span>
            <div className="focus-time" role="timer" aria-label={`${formatTime(remainingMs)} remaining`}>
              {formatTime(remainingMs)}
            </div>
            <span className="focus-time-caption">
              {completed ? "Beautiful work!" : running ? "Stay with this" : "Time for yourself"}
            </span>
          </div>
        </div>

        <div className="focus-duration-area">
          <span className="focus-mini-label">SESSION LENGTH</span>
          <div className="focus-presets" aria-label="Preset focus durations">
            {PRESETS.map((preset) => (
              <button
                type="button"
                key={preset}
                className={`focus-preset ${duration === preset ? "is-selected" : ""}`}
                onClick={() => applyDuration(preset)}
                disabled={running}
              >
                {preset}<small>min</small>
              </button>
            ))}
          </div>
          <form
            className="focus-custom-duration"
            onSubmit={(event) => {
              event.preventDefault();
              applyCustomDuration();
            }}
          >
            <label htmlFor="focus-custom-minutes">Or choose your own</label>
            <div className="focus-custom-control">
              <input
                id="focus-custom-minutes"
                type="number"
                min="1"
                max="180"
                value={customMinutes}
                onChange={(event) => setCustomMinutes(event.target.value)}
                disabled={running}
                aria-label="Custom session length in minutes"
              />
              <span>minutes</span>
              <button type="submit" disabled={running || !customMinutes || Number(customMinutes) < 1 || Number(customMinutes) > 180}>
                Set
              </button>
            </div>
            <span className="focus-hint">Choose 1–180 minutes</span>
          </form>
        </div>

        <div className="focus-actions">
          {running ? (
            <button type="button" className="focus-primary" onClick={pauseTimer}>
              <span aria-hidden="true">Ⅱ</span> Pause session
            </button>
          ) : (
            <button type="button" className="focus-primary" onClick={startTimer}>
              <span aria-hidden="true">▶</span> {remainingMs === 0 ? "Start again" : completed ? "Focus again" : "Start focusing"}
            </button>
          )}
          <button type="button" className="focus-secondary" onClick={resetTimer}>
            ↺ Reset
          </button>
        </div>

        <p className="focus-status" aria-live="polite">
          {completed
            ? "Session complete! Stretch, hydrate, and celebrate the progress you made."
            : running
              ? `You're working on ${selectedTask?.title ? `“${selectedTask.title}”` : "your focus"}. Keep it simple.`
              : "Pick a task, set your time, and ease into it."}
        </p>
      </section>

      <section className="focus-glass focus-task-card">
        <div className="focus-section-heading">
          <div>
            <p className="focus-eyebrow">YOUR STUDY PLAN</p>
            <h3>Assignments & tasks</h3>
            <p className="focus-muted">Choose what this session is for.</p>
          </div>
          <button
            type="button"
            className="focus-add-button"
            onClick={() => setShowTaskForm((shown) => !shown)}
          >
            {showTaskForm ? "× Close" : "+ Add task"}
          </button>
        </div>

        {showTaskForm && (
          <form className="focus-task-form" onSubmit={addTask}>
            <label htmlFor="focus-new-task">Assignment or task name</label>
            <input
              id="focus-new-task"
              className="focus-field"
              value={newTaskTitle}
              onChange={(event) => setNewTaskTitle(event.target.value)}
              placeholder="e.g. Finish Markov chain problem set"
              maxLength={120}
              required
            />

            <label htmlFor="focus-task-notes">What needs to get done?</label>
            <textarea
              id="focus-task-notes"
              className="focus-field focus-notes-field"
              value={newTaskNotes}
              onChange={(event) => setNewTaskNotes(event.target.value)}
              placeholder="Add subtasks, assignment instructions, or where you're stuck..."
              rows={3}
              maxLength={600}
            />

            <div className="focus-form-row">
              <div>
                <label htmlFor="focus-task-priority">Priority</label>
                <select
                  id="focus-task-priority"
                  className="focus-field"
                  value={newTaskPriority}
                  onChange={(event) => setNewTaskPriority(event.target.value as StudyTask["priority"])}
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
              <div>
                <label htmlFor="focus-task-due">Due date (optional)</label>
                <input
                  id="focus-task-due"
                  className="focus-field"
                  type="date"
                  value={newTaskDueDate}
                  onChange={(event) => setNewTaskDueDate(event.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="focus-primary focus-save-task">
              ✦ Save to my study plan
            </button>
          </form>
        )}

        {tasks.length === 0 ? (
          <div className="focus-empty-state">
            <span aria-hidden="true">🌱</span>
            <strong>Your study garden is ready to grow</strong>
            <p>Add an assignment or task, then select it before starting your session.</p>
            {!showTaskForm && (
              <button type="button" className="focus-empty-add" onClick={() => setShowTaskForm(true)}>
                Add your first task
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="focus-task-summary">
              <span>◉ {openTasks.length} to do</span>
              <span>✓ {doneTasks.length} completed</span>
            </div>
            <div className="focus-task-list">
              {tasks.map((task) => (
                <article
                  key={task.id}
                  className={`focus-task-item ${selectedTaskId === task.id ? "is-current" : ""} ${task.done ? "is-done" : ""}`}
                >
                  <button
                    type="button"
                    className={`focus-task-check ${task.done ? "is-checked" : ""}`}
                    aria-label={task.done ? `Mark ${task.title} incomplete` : `Mark ${task.title} complete`}
                    onClick={() => toggleTask(task.id)}
                  >
                    {task.done ? "✓" : ""}
                  </button>
                  <button
                    type="button"
                    className="focus-task-select"
                    onClick={() => setSelectedTaskId(task.id)}
                    aria-pressed={selectedTaskId === task.id}
                  >
                    <span className="focus-task-title">{task.title}</span>
                    {task.notes && <span className="focus-task-notes">{task.notes}</span>}
                    <span className="focus-task-meta">
                      <span className={`focus-priority priority-${task.priority.toLowerCase()}`}>
                        {task.priority} priority
                      </span>
                      {task.dueDate && <span>Due {task.dueDate}</span>}
                      {selectedTaskId === task.id && <span className="focus-current-tag">Selected for focus</span>}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="focus-task-delete"
                    onClick={() => deleteTask(task.id)}
                    aria-label={`Delete ${task.title}`}
                    title="Delete task"
                  >
                    ×
                  </button>
                </article>
              ))}
            </div>
          </>
        )}

        <div className="focus-sprout-box">
          <div className="focus-sprout-icon" aria-hidden="true">✿</div>
          <div className="focus-sprout-copy">
            <strong>Need a tiny plan?</strong>
            <p>Sprout can help you break this assignment into manageable steps.</p>
          </div>
          <SendToSproutButton
            appId="focus"
            text={
              completed
                ? "My focus session just finished. Based on my assignments and progress, help me choose a sensible next step and decide whether I should take a break."
                : selectedTask
                  ? `Help me plan a ${duration}-minute focus session for "${selectedTask.title}". Break it into specific, achievable steps and tell me what to do first.`
                  : "Help me prioritize my outstanding assignments and choose one realistic task to focus on next."
            }
            context={focusContext}
          />
        </div>
      </section>

      <footer className="focus-footer">
        <span>✧</span>
        <span>{completedSessions} focus {completedSessions === 1 ? "session" : "sessions"} completed this visit</span>
        <span className="focus-footer-divider">•</span>
        <span>Small steps still move you forward</span>
      </footer>

      {completed && (
        <div className="focus-completion-note" role="status">
          <span aria-hidden="true">☀</span>
          <div>
            <strong>You made time for what matters.</strong>
            <p>Take a little break, or ask Sprout to help plan your next session.</p>
          </div>
        </div>
      )}
    </div>
  );
}
