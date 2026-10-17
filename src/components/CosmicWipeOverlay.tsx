/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { WaveTransitionEvent } from '../types/game';

interface CosmicWipeOverlayProps {
  event: WaveTransitionEvent | null;
}

interface WarpStar {
  x: number;
  y: number;
  len: number;
  speed: number;
  alpha: number;
  size: number;
  color: string;
}

interface CosmicSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
}

export const CosmicWipeOverlay: React.FC<CosmicWipeOverlayProps> = ({ event }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeEventRef = useRef<WaveTransitionEvent | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const starsRef = useRef<WarpStar[]>([]);
  const sparksRef = useRef<CosmicSpark[]>([]);

  // Trigger new screen-wipe transition whenever `event` changes
  useEffect(() => {
    if (!event) return;

    activeEventRef.current = event;
    startTimeRef.current = performance.now();

    const canvas = canvasRef.current;
    const width = canvas ? canvas.width : window.innerWidth;
    const height = canvas ? canvas.height : window.innerHeight;

    // Seed warp stars for hyperspace transit
    const starCount = event.isSectorChange ? 90 : 55;
    const colors = [
      '#ffffff',
      event.accentColor,
      event.secondaryColor || '#38bdf8',
      '#e0f2fe',
      '#a5f3fc',
    ];

    starsRef.current = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      len: 20 + Math.random() * 80,
      speed: (event.isSectorChange ? 18 : 12) + Math.random() * 22,
      alpha: 0.3 + Math.random() * 0.7,
      size: 1.0 + Math.random() * 2.2,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    // Seed initial cosmic sparks along the wipe line
    sparksRef.current = [];
  }, [event]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const render = (now: number) => {
      if (!isRunning) return;

      const currentEvent = activeEventRef.current;

      if (!currentEvent) {
        // Clear canvas and wait
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const elapsed = (now - startTimeRef.current) / 1000;
      const duration = currentEvent.isSectorChange ? 1.7 : 1.2;
      const progress = Math.min(1.0, elapsed / duration);

      const w = window.innerWidth;
      const h = window.innerHeight;

      // Clear the overlay frame
      ctx.clearRect(0, 0, w, h);

      if (progress >= 1.0) {
        // Transition finished: reset active event and stop drawing
        activeEventRef.current = null;
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      // Easing functions for smooth organic cosmic motion
      // Ease in-out cubic
      const easeInOut = (t: number) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      // Split into two sweeps: Wipe-In (0 -> 0.45), Savor/Telemetry (0.45 -> 0.62), Wipe-Out (0.62 -> 1.0)
      const wipeAngle = -0.42; // -24 degrees diagonal slice
      const cosA = Math.cos(wipeAngle);
      const sinA = Math.sin(wipeAngle);

      // Diagonal dimension
      const diag = Math.sqrt(w * w + h * h);
      const margin = 260; // Extra span for smooth entry and exit

      // Phase calculation
      let leadingEdgeDist = 0;
      let trailingEdgeDist = 0;

      if (progress < 0.5) {
        // Sweep in from top-left: leading edge covers the screen
        const pIn = easeInOut(progress / 0.5);
        leadingEdgeDist = -margin + pIn * (diag + margin * 2);
        trailingEdgeDist = -margin;
      } else {
        // Sweep out toward bottom-right: trailing edge reveals the new scene
        const pOut = easeInOut((progress - 0.5) / 0.5);
        leadingEdgeDist = diag + margin;
        trailingEdgeDist = -margin + pOut * (diag + margin * 2);
      }

      // ----------------------------------------------------
      // 1. COSMIC CURTAIN & NEBULA CORE FILL
      // ----------------------------------------------------
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(wipeAngle);

      const bandWidth = Math.max(0, leadingEdgeDist - trailingEdgeDist);
      const bandCenter = trailingEdgeDist + bandWidth / 2 - diag / 2;

      if (bandWidth > 0) {
        // Deep cosmic void gradient fill
        const bgGrad = ctx.createLinearGradient(
          bandCenter - bandWidth / 2,
          0,
          bandCenter + bandWidth / 2,
          0
        );

        const accent = currentEvent.accentColor;
        bgGrad.addColorStop(0, 'rgba(2, 6, 23, 0.0)');
        bgGrad.addColorStop(0.12, 'rgba(3, 7, 18, 0.78)');
        bgGrad.addColorStop(0.5, 'rgba(2, 6, 23, 0.94)');
        bgGrad.addColorStop(0.88, 'rgba(3, 7, 18, 0.82)');
        bgGrad.addColorStop(1, 'rgba(2, 6, 23, 0.0)');

        ctx.fillStyle = bgGrad;
        ctx.fillRect(bandCenter - bandWidth / 2, -diag, bandWidth, diag * 2);

        // Subtle glowing nebula aurora band along the center of the wipe
        const nebulaGrad = ctx.createLinearGradient(
          bandCenter - bandWidth / 2,
          0,
          bandCenter + bandWidth / 2,
          0
        );
        nebulaGrad.addColorStop(0.3, 'rgba(0, 0, 0, 0)');
        nebulaGrad.addColorStop(0.48, `${accent}18`);
        nebulaGrad.addColorStop(0.52, `${accent}25`);
        nebulaGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = nebulaGrad;
        ctx.fillRect(bandCenter - bandWidth / 2, -diag, bandWidth, diag * 2);
      }

      // ----------------------------------------------------
      // 2. LEADING EVENT HORIZON LASER / PLASMA BLADE
      // ----------------------------------------------------
      if (progress < 0.65) {
        const leadX = leadingEdgeDist - diag / 2;

        // Anamorphic lens glow beam
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        // Outer glow halo
        const haloGrad = ctx.createLinearGradient(leadX - 60, 0, leadX + 25, 0);
        haloGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        haloGrad.addColorStop(0.7, `${currentEvent.accentColor}30`);
        haloGrad.addColorStop(0.95, currentEvent.accentColor);
        haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = haloGrad;
        ctx.fillRect(leadX - 60, -diag, 85, diag * 2);

        // Laser core blade
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3.2;
        ctx.shadowColor = currentEvent.accentColor;
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.moveTo(leadX, -diag);
        ctx.lineTo(leadX, diag);
        ctx.stroke();

        // Prismatic Chromatic Dispersion Lines (Cyan & Rose)
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.2;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(leadX - 3.5, -diag);
        ctx.lineTo(leadX - 3.5, diag);
        ctx.stroke();

        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(leadX + 3.5, -diag);
        ctx.lineTo(leadX + 3.5, diag);
        ctx.stroke();

        ctx.restore();
      }

      // ----------------------------------------------------
      // 3. TRAILING EVENT HORIZON BLADE (During Wipe-Out)
      // ----------------------------------------------------
      if (progress >= 0.45) {
        const trailX = trailingEdgeDist - diag / 2;

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        // Trailing luminous energy razor
        const trailGrad = ctx.createLinearGradient(trailX - 20, 0, trailX + 50, 0);
        trailGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        trailGrad.addColorStop(0.3, currentEvent.accentColor);
        trailGrad.addColorStop(0.65, `${currentEvent.accentColor}25`);
        trailGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = trailGrad;
        ctx.fillRect(trailX - 20, -diag, 70, diag * 2);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.4;
        ctx.shadowColor = currentEvent.accentColor;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(trailX, -diag);
        ctx.lineTo(trailX, diag);
        ctx.stroke();

        ctx.restore();
      }

      ctx.restore(); // Restore from rotation

      // ----------------------------------------------------
      // 4. RELATIVISTIC HYPERSPACE STREAKS
      // ----------------------------------------------------
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      const warpIntensity =
        progress < 0.5
          ? Math.sin((progress / 0.5) * Math.PI)
          : Math.sin(((progress - 0.5) / 0.5) * Math.PI);

      starsRef.current.forEach((star) => {
        // Accelerate stars across screen along warp vector
        star.x += star.speed * (1.0 + warpIntensity * 2.5);
        if (star.x > w + star.len) {
          star.x = -star.len;
          star.y = Math.random() * h;
        }

        const streakLen = star.len * (1.0 + warpIntensity * 3.5);
        const streakAlpha = star.alpha * Math.max(0.2, warpIntensity);

        const grad = ctx.createLinearGradient(star.x - streakLen, star.y, star.x, star.y);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        grad.addColorStop(0.6, `${star.color}60`);
        grad.addColorStop(1, star.color);

        ctx.strokeStyle = grad;
        ctx.lineWidth = star.size * (1 + warpIntensity * 0.5);
        ctx.beginPath();
        ctx.moveTo(star.x - streakLen, star.y);
        ctx.lineTo(star.x, star.y);
        ctx.stroke();

        // Star core spark
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
      });

      // Spawn and render cosmic sparks along the blade
      if (Math.random() < 0.6) {
        const tPos = Math.random();
        const px = w * tPos;
        const py = h * (0.1 + Math.random() * 0.8);
        sparksRef.current.push({
          x: px,
          y: py,
          vx: (Math.random() - 0.5) * 6 + (cosA * 8),
          vy: (Math.random() - 0.5) * 6 + (sinA * 8),
          size: 1.5 + Math.random() * 3.5,
          color: Math.random() < 0.5 ? '#ffffff' : currentEvent.accentColor,
          alpha: 1.0,
          decay: 0.04 + Math.random() * 0.05,
        });
      }

      for (let i = sparksRef.current.length - 1; i >= 0; i--) {
        const s = sparksRef.current[i];
        s.x += s.vx;
        s.y += s.vy;
        s.alpha -= s.decay;

        if (s.alpha <= 0) {
          sparksRef.current.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = Math.max(0, s.alpha);
        ctx.fillStyle = s.color;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // ----------------------------------------------------
      // 5. HOLOGRAPHIC TACTICAL TELEMETRY STAMP
      // ----------------------------------------------------
      // Appears in the center during the peak of the transition (0.28 -> 0.78)
      if (progress > 0.22 && progress < 0.84) {
        const textProgress = (progress - 0.22) / (0.84 - 0.22);
        // Fade in rapidly, plateau, fade out
        let textAlpha = 1.0;
        if (textProgress < 0.25) {
          textAlpha = textProgress / 0.25;
        } else if (textProgress > 0.75) {
          textAlpha = 1.0 - (textProgress - 0.75) / 0.25;
        }
        textAlpha = Math.max(0, Math.min(1, textAlpha));

        ctx.save();
        ctx.globalAlpha = textAlpha;
        ctx.textAlign = 'center';

        const cx = w / 2;
        const cy = h / 2;

        // Subtle telemetry laser brackets
        const boxW = Math.min(640, w - 48);
        const boxH = 130;

        ctx.strokeStyle = `${currentEvent.accentColor}50`;
        ctx.lineWidth = 1;

        // Corner brackets
        const bLen = 18;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(cx - boxW / 2 + bLen, cy - boxH / 2);
        ctx.lineTo(cx - boxW / 2, cy - boxH / 2);
        ctx.lineTo(cx - boxW / 2, cy - boxH / 2 + bLen);
        ctx.stroke();

        // Top-right
        ctx.beginPath();
        ctx.moveTo(cx + boxW / 2 - bLen, cy - boxH / 2);
        ctx.lineTo(cx + boxW / 2, cy - boxH / 2);
        ctx.lineTo(cx + boxW / 2, cy - boxH / 2 + bLen);
        ctx.stroke();

        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(cx - boxW / 2 + bLen, cy + boxH / 2);
        ctx.lineTo(cx - boxW / 2, cy + boxH / 2);
        ctx.lineTo(cx - boxW / 2, cy + boxH / 2 - bLen);
        ctx.stroke();

        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(cx + boxW / 2 - bLen, cy + boxH / 2);
        ctx.lineTo(cx + boxW / 2, cy + boxH / 2);
        ctx.lineTo(cx + boxW / 2, cy + boxH / 2 - bLen);
        ctx.stroke();

        // Fine horizontal laser divider line
        const lineGrad = ctx.createLinearGradient(cx - boxW / 2, 0, cx + boxW / 2, 0);
        lineGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        lineGrad.addColorStop(0.2, `${currentEvent.accentColor}60`);
        lineGrad.addColorStop(0.5, currentEvent.accentColor);
        lineGrad.addColorStop(0.8, `${currentEvent.accentColor}60`);
        lineGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx - boxW / 2, cy + 2);
        ctx.lineTo(cx + boxW / 2, cy + 2);
        ctx.stroke();

        // Monospace Kicker Header
        ctx.font = '700 11px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
        ctx.fillStyle = currentEvent.accentColor;
        ctx.shadowColor = currentEvent.accentColor;
        ctx.shadowBlur = 8;
        const kickerText = currentEvent.isSectorChange
          ? '/// SECTOR TRANSIT · QUANTUM WARP ENGAGED ///'
          : currentEvent.isMegaBoss
          ? '/// CRITICAL OMEGA ALERT · APOCALYPSE INCURSION ///'
          : '/// COMBAT AIRSPACE RECONFIGURED · NEXT INVASION WAVE ///';
        ctx.fillText(kickerText, cx, cy - 32);

        // Main Title (Clean, bold, striking typography)
        ctx.font = '900 28px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = currentEvent.accentColor;
        ctx.shadowBlur = 18;

        const mainTitle = currentEvent.isSectorChange
          ? currentEvent.sectorName.toUpperCase()
          : currentEvent.isMegaBoss
          ? `WAVE ${currentEvent.wave}: APOCALYPSE TITAN`
          : `WAVE ${currentEvent.wave}`;
        ctx.fillText(mainTitle, cx, cy - 6);

        // Subtitle / Sector description
        ctx.font = '600 12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
        ctx.fillStyle = '#cbd5e1';
        ctx.shadowBlur = 4;
        const subText = currentEvent.isSectorChange
          ? currentEvent.sectorCodename
          : `${currentEvent.sectorName.toUpperCase()} · AIRSPACE SECURED`;
        ctx.fillText(subText, cx, cy + 24);

        // Coordinate telemetry footer
        ctx.font = '500 10px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
        ctx.fillStyle = '#64748b';
        ctx.shadowBlur = 0;
        const seedCoord = (currentEvent.wave * 37.49).toFixed(2);
        const teleText = `RELATIVISTIC SPEED: 0.94c · GRID: [λ-${seedCoord}, ψ-88.1] · DEFENSE MATRIX ARMED`;
        ctx.fillText(teleText, cx, cy + 42);

        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-20 block h-full w-full select-none"
    />
  );
};
