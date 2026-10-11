"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "./Screensaver.module.css";

export default function Screensaver() {
  const stageRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLCanvasElement>(null);
  const iceBlockRef = useRef<HTMLDivElement>(null);
  const trailPointsRef = useRef<{ x: number; y: number; time: number }[]>([]);
  const positionRef = useRef<{
    x: number;
    y: number;
    velocityX: number;
    velocityY: number;
    target: { x: number; y: number } | null;
  }>({ x: 12, y: 12, velocityX: 56.25, velocityY: 43.75, target: null });
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const stage = stageRef.current;
    const trail = trailRef.current;
    const iceBlock = iceBlockRef.current;
    if (!stage || !trail || !iceBlock) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const position = positionRef.current;
    const points = trailPointsRef.current;
    const context = trail.getContext("2d");

    let previousTime = 0;
    let frameId = 0;

    function animate(time: number) {
      if (!stage || !trail || !iceBlock) return;

      const elapsed = previousTime ? Math.min((time - previousTime) / 1000, 0.05) : 0;
      previousTime = time;

      const maxX = Math.max(0, stage.clientWidth - iceBlock.offsetWidth);
      const maxY = Math.max(0, stage.clientHeight - iceBlock.offsetHeight);
      const isMoving = !paused && !reduceMotion.matches;
      if (isMoving && position.target) {
        const deltaX = position.target.x - position.x;
        const deltaY = position.target.y - position.y;
        const distance = Math.hypot(deltaX, deltaY);
        const travel = 112.5 * elapsed;

        if (distance <= travel || distance === 0) {
          position.x = position.target.x;
          position.y = position.target.y;
          position.velocityX = position.x === 0 ? 56.25 : -56.25;
          position.velocityY = position.y === 0 ? 43.75 : -43.75;
          position.target = null;
        } else {
          position.x += (deltaX / distance) * travel;
          position.y += (deltaY / distance) * travel;
        }
      } else if (isMoving) {
        const nextX = position.x + position.velocityX * elapsed;
        const nextY = position.y + position.velocityY * elapsed;
        const hitLeftOrRight = nextX < 0 || nextX > maxX;
        const hitTopOrBottom = nextY < 0 || nextY > maxY;

        if (hitLeftOrRight || hitTopOrBottom) {
          position.velocityX = (hitLeftOrRight ? (nextX < 0 ? 1 : -1) : Math.random() < 0.5 ? -1 : 1) * (35 + Math.random() * 75) * 1.25;
          position.velocityY = (hitTopOrBottom ? (nextY < 0 ? 1 : -1) : Math.random() < 0.5 ? -1 : 1) * (30 + Math.random() * 70) * 1.25;
        }

        position.x = Math.min(Math.max(nextX, 0), maxX);
        position.y = Math.min(Math.max(nextY, 0), maxY);
      }

      const centerX = position.x + iceBlock.offsetWidth / 2;
      const centerY = position.y + iceBlock.offsetHeight / 2;
      const lastPoint = points[points.length - 1];
      if (isMoving && (!lastPoint || Math.hypot(centerX - lastPoint.x, centerY - lastPoint.y) > 2)) {
        points.push({ x: centerX, y: centerY, time });
      }

      const trailLifetime = 325;
      while (points.length > 0 && time - points[0].time > trailLifetime) points.shift();
      if (context) {
        const pixelRatio = window.devicePixelRatio || 1;
        const canvasWidth = stage.clientWidth;
        const canvasHeight = stage.clientHeight;
        if (trail.width !== Math.round(canvasWidth * pixelRatio) || trail.height !== Math.round(canvasHeight * pixelRatio)) {
          trail.width = Math.round(canvasWidth * pixelRatio);
          trail.height = Math.round(canvasHeight * pixelRatio);
        }
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        context.clearRect(0, 0, canvasWidth, canvasHeight);
        context.lineWidth = 27;
        context.lineCap = "round";
        context.lineJoin = "round";
        context.shadowBlur = 10;
        for (let index = 1; index < points.length; index += 1) {
          const point = points[index];
          const age = time - point.time;
          context.beginPath();
          context.moveTo(points[index - 1].x, points[index - 1].y);
          context.lineTo(point.x, point.y);
          context.strokeStyle = `hsl(${(index * 14) % 360} 100% 65%)`;
          context.shadowColor = context.strokeStyle;
          context.globalAlpha = Math.max(0, 1 - age / trailLifetime);
          context.stroke();
        }
        context.globalAlpha = 1;
        context.shadowBlur = 0;
      }

      iceBlock.style.transform = `translate3d(${position.x}px, ${position.y}px, 0) scaleX(${position.velocityX < 0 ? 1 : -1})`;
      frameId = window.requestAnimationFrame(animate);
    }

    frameId = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frameId);
  }, [paused]);

  function sendToCorner() {
    const stage = stageRef.current;
    const iceBlock = iceBlockRef.current;
    if (!stage || !iceBlock) return;

    const maxX = Math.max(0, stage.clientWidth - iceBlock.offsetWidth);
    const maxY = Math.max(0, stage.clientHeight - iceBlock.offsetHeight);
    const position = positionRef.current;
    const corners = [
      { x: 0, y: 0 },
      { x: maxX, y: 0 },
      { x: 0, y: maxY },
      { x: maxX, y: maxY },
    ];
    const target = corners.reduce((nearest, corner) =>
      Math.hypot(corner.x - position.x, corner.y - position.y) <
      Math.hypot(nearest.x - position.x, nearest.y - position.y)
        ? corner
        : nearest,
    );

    position.target = target;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      position.x = target.x;
      position.y = target.y;
      position.velocityX = position.x === 0 ? 56.25 : -56.25;
      position.velocityY = position.y === 0 ? 43.75 : -43.75;
      position.target = null;
      iceBlock.style.transform = `translate3d(${position.x}px, ${position.y}px, 0) scaleX(${position.velocityX < 0 ? 1 : -1})`;
    }
    setPaused(false);
  }

  return (
    <section className={styles.screensaver} aria-label="Galaxy fish screensaver">
      <div className={styles.stage} ref={stageRef}>
        <div className={styles.hud} aria-hidden="true">
          <span className={styles.eyebrow}>COSMIC AQUARIUM</span>
          <span className={styles.signal}><span /> LIVE FISH CAM</span>
        </div>
        <canvas className={styles.trail} ref={trailRef} aria-hidden="true" />
        <div className={styles.iceBlock} ref={iceBlockRef}>
          <Image
            className={styles.fish}
            src="/screensaver/fish6.png"
            width={1920}
            height={1920}
            alt="A colorful fish swimming through a galaxy, encased in a square ice block"
            priority
            unoptimized
          />
          <span className={styles.iceShine} aria-hidden="true" />
        </div>
        <div className={styles.caption} aria-hidden="true">
          <span>Somewhere, among the stars</span>
          <span className={styles.coordinates}>SECTOR 07 · DEEP SPACE</span>
        </div>
      </div>
      <div className={styles.controls}>
        <p>A little fish, a very big universe.</p>
        <div className={styles.actions}>
          <button className={styles.pauseButton} type="button" onClick={sendToCorner}>
            Go to corner
          </button>
          <button
            className={styles.pauseButton}
            type="button"
            onClick={() => setPaused((current) => !current)}
            aria-pressed={paused}
          >
            {paused ? "Resume swim" : "Pause swim"}
          </button>
        </div>
      </div>
    </section>
  );
}
