/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { EnemyType } from '../types/game';
import { BESTIARY_ENTRIES, BestiaryEntry } from '../data/bestiary';
import { BestiaryEncounterRecord, getStoredBestiary } from '../services/storage';
import {
  X,
  Shield,
  Zap,
  Skull,
  Crosshair,
  AlertTriangle,
  Lock,
  Eye,
  RotateCw,
  Compass,
  Target,
  Sparkles,
  Layers,
  ChevronRight,
  Info,
  Flame,
  Radio,
} from 'lucide-react';

interface BestiaryModalProps {
  onClose: () => void;
  bestiaryData?: Record<EnemyType, BestiaryEncounterRecord>;
}

export const BestiaryModal: React.FC<BestiaryModalProps> = ({ onClose, bestiaryData }) => {
  const [encounters, setEncounters] = useState<Record<EnemyType, BestiaryEncounterRecord>>(() => {
    return bestiaryData || getStoredBestiary();
  });

  const [selectedType, setSelectedType] = useState<EnemyType>('SCOUT');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'LIGHT' | 'HEAVY' | 'HAZARD_BOSS'>('ALL');
  const [showClassifiedPreview, setShowClassifiedPreview] = useState<boolean>(true);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [rotationAngle, setRotationAngle] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const allEntries = Object.values(BESTIARY_ENTRIES);
  const currentEntry = BESTIARY_ENTRIES[selectedType];
  const currentRecord = encounters[selectedType] || { encountered: false, kills: 0 };
  const isEncountered = currentRecord.encountered;

  // Total statistics
  const totalEncountered = allEntries.filter((e) => encounters[e.id]?.encountered).length;
  const totalKills = Object.values(encounters).reduce((acc, curr) => acc + (curr.kills || 0), 0);

  // Filter list
  const filteredEntries = allEntries.filter((entry) => {
    if (filterCategory === 'LIGHT') {
      return entry.category === 'RECON' || entry.category === 'SWARM';
    }
    if (filterCategory === 'HEAVY') {
      return entry.category === 'CAPITAL' || entry.category === 'SNIPER';
    }
    if (filterCategory === 'HAZARD_BOSS') {
      return entry.category === 'HAZARD' || entry.category === 'TITAN';
    }
    return true;
  });

  // Keep rotation updated
  useEffect(() => {
    let lastTime = performance.now();
    const update = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      if (isRotating) {
        setRotationAngle((prev) => (prev + dt * 0.9) % (Math.PI * 2));
      }
      animFrameRef.current = requestAnimationFrame(update);
    };
    animFrameRef.current = requestAnimationFrame(update);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRotating]);

  // Render holographic projection on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;

    ctx.clearRect(0, 0, width, height);

    // 1. Tactical Radar Hologram Grid Background
    ctx.save();
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
    ctx.lineWidth = 1;

    // Concentric range rings
    [40, 80, 115].forEach((radius) => {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(cx - 120, cy);
    ctx.lineTo(cx + 120, cy);
    ctx.moveTo(cx, cy - 120);
    ctx.lineTo(cx, cy + 120);
    ctx.stroke();

    // Radar scan beam
    const scanTime = performance.now() * 0.002;
    const scanAngle = scanTime % (Math.PI * 2);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, 115, scanAngle, scanAngle + 0.45);
    ctx.closePath();
    ctx.fillStyle = 'rgba(6, 182, 212, 0.05)';
    ctx.fill();

    // Corner targeting brackets
    const bracketSize = 14;
    const bPad = 12;
    ctx.strokeStyle = currentEntry.accentColor;
    ctx.lineWidth = 1.8;

    // Top-left
    ctx.beginPath();
    ctx.moveTo(bPad, bPad + bracketSize);
    ctx.lineTo(bPad, bPad);
    ctx.lineTo(bPad + bracketSize, bPad);
    ctx.stroke();

    // Top-right
    ctx.beginPath();
    ctx.moveTo(width - bPad - bracketSize, bPad);
    ctx.lineTo(width - bPad, bPad);
    ctx.lineTo(width - bPad, bPad + bracketSize);
    ctx.stroke();

    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(bPad, height - bPad - bracketSize);
    ctx.lineTo(bPad, height - bPad);
    ctx.lineTo(bPad + bracketSize, height - bPad);
    ctx.stroke();

    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(width - bPad - bracketSize, height - bPad);
    ctx.lineTo(width - bPad, height - bPad);
    ctx.lineTo(width - bPad, height - bPad - bracketSize);
    ctx.stroke();

    ctx.restore();

    // 2. Render Enemy Model
    ctx.save();
    ctx.translate(cx, cy);

    // If unencountered and classified preview disabled, render locked silhouette
    if (!isEncountered && !showClassifiedPreview) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.beginPath();
      ctx.arc(0, 0, 50, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.restore();
      return;
    }

    ctx.rotate(rotationAngle);

    const time = performance.now() * 0.001;
    const flicker = Math.sin(time * 18) * 3;

    if (currentEntry.id === 'SCOUT') {
      // Scale for bestiary viewport
      const r = 32;

      // Afterburner plume
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(-r * 0.7, -4);
      ctx.lineTo(-r * 0.7 - 22 - flicker, 0);
      ctx.lineTo(-r * 0.7, 4);
      ctx.closePath();
      ctx.fill();

      // Core plume
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.moveTo(-r * 0.7, -2);
      ctx.lineTo(-r * 0.7 - 12, 0);
      ctx.lineTo(-r * 0.7, 2);
      ctx.closePath();
      ctx.fill();

      // Main Hull
      ctx.fillStyle = '#1e1b4b';
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(r * 1.3, 0);
      ctx.lineTo(-r * 0.4, r);
      ctx.lineTo(-r, r * 0.6);
      ctx.lineTo(-r * 0.6, 0);
      ctx.lineTo(-r, -r * 0.6);
      ctx.lineTo(-r * 0.4, -r);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cockpit ruby visor
      ctx.fillStyle = '#f87171';
      ctx.beginPath();
      ctx.ellipse(4, 0, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wing weapon blasters
      ctx.fillStyle = '#fdba74';
      ctx.fillRect(-r * 0.2, r * 0.7, 16, 2.5);
      ctx.fillRect(-r * 0.2, -r * 0.7 - 2.5, 16, 2.5);
    } else if (currentEntry.id === 'SWARMER') {
      const r = 32;

      // Dart afterburner plume
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(-r * 0.4, -3);
      ctx.lineTo(-r * 0.4 - 18 - flicker, 0);
      ctx.lineTo(-r * 0.4, 3);
      ctx.closePath();
      ctx.fill();

      // Sharp arrowhead hull
      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#fca5a5';
      ctx.lineWidth = 2.4;

      ctx.beginPath();
      ctx.moveTo(r * 1.4, 0);
      ctx.lineTo(-r, r * 0.85);
      ctx.lineTo(-r * 0.4, 0);
      ctx.lineTo(-r, -r * 0.85);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Center glowing capacitor
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(r * 0.2, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (currentEntry.id === 'ASTEROID') {
      const r = 44;

      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      const numVerts = 9;
      for (let i = 0; i < numVerts; i++) {
        const theta = (i / numVerts) * Math.PI * 2;
        // Deterministic jagged shape
        const radVar = ((i * 37) % 7) * 2.5;
        const rad = r - 6 + radVar;
        const px = Math.cos(theta) * rad;
        const py = Math.sin(theta) * rad;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Internal craters & glowing aether veins
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(r * 0.25, -r * 0.25, r * 0.22, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(-r * 0.3, r * 0.2, r * 0.16, 0, Math.PI * 2);
      ctx.fill();

      // Glowing Aether crystal fissure
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-10, -15);
      ctx.lineTo(8, -2);
      ctx.lineTo(-4, 18);
      ctx.stroke();
    } else if (currentEntry.id === 'CRUISER') {
      const r = 36;

      // Twin purple plumes
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.moveTo(-r * 0.8, -10);
      ctx.lineTo(-r * 0.8 - 22 - flicker, -10);
      ctx.lineTo(-r * 0.8, -6);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-r * 0.8, 6);
      ctx.lineTo(-r * 0.8 - 22 - flicker, 10);
      ctx.lineTo(-r * 0.8, 10);
      ctx.closePath();
      ctx.fill();

      // Heavy armored body
      ctx.fillStyle = '#18181b';
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2.8;

      ctx.beginPath();
      ctx.moveTo(r * 1.4, 0);
      ctx.lineTo(r * 0.4, r);
      ctx.lineTo(-r, r * 1.1);
      ctx.lineTo(-r * 0.7, 0);
      ctx.lineTo(-r, -r * 1.1);
      ctx.lineTo(r * 0.4, -r);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Glowing power core
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();

      // Turret pods
      ctx.fillStyle = '#e879f9';
      ctx.fillRect(r * 0.2, r * 0.6, 12, 3);
      ctx.fillRect(r * 0.2, -r * 0.6 - 3, 12, 3);
    } else if (currentEntry.id === 'SNIPER') {
      const r = 28;

      // Emerald Targeting Laser Beam
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(r * 1.8, 0);
      ctx.lineTo(r * 5, 0);
      ctx.stroke();
      ctx.setLineDash([]);

      // Needle hull
      ctx.fillStyle = '#065f46';
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2.4;

      ctx.beginPath();
      ctx.moveTo(r * 1.8, 0);
      ctx.lineTo(-r, r * 0.65);
      ctx.lineTo(-r * 0.5, 0);
      ctx.lineTo(-r, -r * 0.65);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Rail barrel line
      ctx.strokeStyle = '#a7f3d0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.lineTo(r * 1.8, 0);
      ctx.stroke();

      // Optical sensor
      ctx.fillStyle = '#6ee7b7';
      ctx.beginPath();
      ctx.arc(-2, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (currentEntry.id === 'BOSS') {
      const r = 50;

      // Heavy 8-point dreadnought armor
      ctx.fillStyle = '#1e1b4b';
      ctx.strokeStyle = '#e11d48';
      ctx.lineWidth = 4;

      ctx.beginPath();
      for (let s = 0; s < 8; s++) {
        const theta = (s / 8) * Math.PI * 2;
        const rad = s % 2 === 0 ? r : r * 0.74;
        const px = Math.cos(theta) * rad;
        const py = Math.sin(theta) * rad;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Secondary reinforced plates
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
      ctx.stroke();

      // Pulsing Tachyon Singularity Core
      const corePulse = Math.sin(time * 6) * 4;
      ctx.fillStyle = '#fb7185';
      ctx.beginPath();
      ctx.arc(0, 0, 16 + corePulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // 3. Scanline overlay across preview
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    for (let y = 0; y < height; y += 4) {
      ctx.fillRect(0, y, width, 1.5);
    }
  }, [selectedType, rotationAngle, isEncountered, showClassifiedPreview, currentEntry]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Top classified terminal banner */}
        <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-900/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-400">
              <Crosshair className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider font-mono">
                  TACTICAL BESTIARY
                </h2>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950/60 text-cyan-400 border border-cyan-500/30">
                  SECTOR RECON ARCHIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Comprehensive combat analysis, threat ratings, and countermeasures for hostile fleet entities.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400">Encountered:</span>
              <span className="font-bold text-cyan-400">
                {totalEncountered} / {allEntries.length}
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">Kills:</span>
              <span className="font-bold text-amber-400">{totalKills.toLocaleString()}</span>
            </div>

            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Filters Bar */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-800/60 bg-slate-900/40 text-xs shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            {[
              { id: 'ALL', label: 'All Threats' },
              { id: 'LIGHT', label: 'Fighters & Swarms' },
              { id: 'HEAVY', label: 'Capitals & Snipers' },
              { id: 'HAZARD_BOSS', label: 'Anomalies & Titans' },
            ].map((cat) => {
              const active = filterCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategory(cat.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm shadow-cyan-500/20'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <button
              onClick={() => setShowClassifiedPreview(!showClassifiedPreview)}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Toggle simulator wireframe for classified units"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>{showClassifiedPreview ? 'Classified Wireframe: ON' : 'Redacted: ON'}</span>
            </button>
          </div>
        </div>

        {/* Main Content Layout: Left Selector, Right Detailed Dossier */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-800/80 overflow-hidden">
          {/* Left Column: Hostile List */}
          <div className="lg:col-span-4 p-4 overflow-y-auto space-y-2.5 bg-slate-950/60">
            <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase px-1 mb-2">
              CATALOGED HOSTILE FORCES ({filteredEntries.length})
            </div>

            {filteredEntries.map((entry) => {
              const isSelected = selectedType === entry.id;
              const rec = encounters[entry.id] || { encountered: false, kills: 0 };
              const encountered = rec.encountered;

              return (
                <button
                  key={entry.id}
                  onClick={() => setSelectedType(entry.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-400/80 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/30'
                      : 'bg-slate-900/40 border-slate-800/70 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Status / Threat Accent Dot */}
                    <div
                      className="h-10 w-10 shrink-0 rounded-lg flex items-center justify-center border font-mono font-bold text-xs"
                      style={{
                        backgroundColor: `${entry.accentColor}15`,
                        borderColor: `${entry.accentColor}40`,
                        color: entry.accentColor,
                      }}
                    >
                      {encountered ? (
                        entry.id === 'BOSS' ? (
                          <Skull className="w-5 h-5 text-rose-400" />
                        ) : entry.id === 'SNIPER' ? (
                          <Target className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Crosshair className="w-5 h-5" />
                        )
                      ) : (
                        <Lock className="w-4 h-4 text-slate-500" />
                      )}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">{entry.codename}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 truncate">{entry.designation}</span>

                      {/* Threat pill */}
                      <div className="flex items-center gap-1.5 mt-1">
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-semibold ${entry.threatBadgeColor}`}
                        >
                          THREAT ★{entry.threatLevel}
                        </span>
                        {encountered ? (
                          <span className="text-[10px] text-slate-500 font-mono">
                            {rec.kills > 0 ? `${rec.kills} vaporized` : 'Encountered'}
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-500/80 font-mono flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" />
                            Classified
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <ChevronRight
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isSelected ? 'text-cyan-400 translate-x-0.5' : 'text-slate-600'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Right Column: Tactical Dossier & Live Holographic Visualizer */}
          <div className="lg:col-span-8 p-5 overflow-y-auto space-y-6 bg-slate-950 flex flex-col">
            {/* Header info row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border"
                    style={{
                      borderColor: `${currentEntry.accentColor}60`,
                      color: currentEntry.accentColor,
                      backgroundColor: `${currentEntry.accentColor}15`,
                    }}
                  >
                    {currentEntry.threatLabel}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    First Detected: Wave {currentEntry.firstEncounteredWave}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white font-mono mt-1">
                  {currentEntry.codename}
                </h3>
                <p className="text-xs text-slate-400">{currentEntry.designation}</p>
              </div>

              {/* Threat Stars & Encounter badge */}
              <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-sm ${
                        star <= currentEntry.threatLevel ? 'text-amber-400' : 'text-slate-700'
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    isEncountered
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40'
                      : 'bg-amber-950/60 text-amber-400 border border-amber-500/40'
                  }`}
                >
                  {isEncountered ? `CONFIRMED KILLS: ${currentRecord.kills}` : 'CLASSIFIED DOSSIER'}
                </span>
              </div>
            </div>

            {/* Interactive Holographic Target Visualizer */}
            <div className="relative rounded-xl border border-slate-800/90 bg-slate-900/60 p-3 flex flex-col items-center justify-center overflow-hidden">
              <div className="absolute top-2.5 left-3 flex items-center gap-2 text-[10px] font-mono text-cyan-400">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>HOLOGRAPHIC SCANNER // 360° PROJECTION</span>
              </div>

              <div className="absolute top-2.5 right-3 flex items-center gap-2">
                <button
                  onClick={() => setIsRotating(!isRotating)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border transition-colors cursor-pointer ${
                    isRotating
                      ? 'bg-cyan-950/50 text-cyan-400 border-cyan-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                  title="Pause/Resume rotation"
                >
                  <RotateCw className={`w-3 h-3 ${isRotating ? 'animate-spin' : ''}`} />
                  <span>{isRotating ? 'ROTATING' : 'PAUSED'}</span>
                </button>
              </div>

              <div className="py-2">
                <canvas
                  ref={canvasRef}
                  width={280}
                  height={240}
                  className="rounded-lg shadow-inner bg-slate-950/40"
                />
              </div>

              <div className="w-full flex items-center justify-between text-[10px] font-mono text-slate-500 px-2 pt-1 border-t border-slate-800/60">
                <span>SECTOR FREQUENCY: 844.2 MHZ</span>
                <span>AZIMUTH: {Math.round((rotationAngle * 180) / Math.PI)}°</span>
                <span>ZOOM: 1.0X</span>
              </div>
            </div>

            {/* Tactical Combat Ratings */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>COMBAT SPECIFICATIONS & TELEMETRY</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Durability */}
                <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                  <div className="flex justify-between text-slate-400 mb-1.5">
                    <span>Hull Durability (HP)</span>
                    <span className="font-mono font-bold text-white">
                      {currentEntry.stats.baseHealth} HP
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-rose-500 transition-all duration-300"
                      style={{ width: `${Math.min(100, (currentEntry.stats.baseHealth / 450) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Sub-Warp Speed */}
                <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                  <div className="flex justify-between text-slate-400 mb-1.5">
                    <span>Sub-Warp Velocity</span>
                    <span className="font-mono font-bold text-cyan-400">
                      {currentEntry.stats.speedRating} / 10
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 transition-all duration-300"
                      style={{ width: `${currentEntry.stats.speedRating * 10}%` }}
                    />
                  </div>
                </div>

                {/* Firepower */}
                <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                  <div className="flex justify-between text-slate-400 mb-1.5">
                    <span>Firepower Lethality</span>
                    <span className="font-mono font-bold text-amber-400">
                      {currentEntry.stats.firepowerRating} / 10
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-amber-400 transition-all duration-300"
                      style={{ width: `${currentEntry.stats.firepowerRating * 10}%` }}
                    />
                  </div>
                </div>

                {/* Range */}
                <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                  <div className="flex justify-between text-slate-400 mb-1.5">
                    <span>Effective Range</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {currentEntry.stats.rangeRating} / 10
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 transition-all duration-300"
                      style={{ width: `${currentEntry.stats.rangeRating * 10}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Bounty & Shards */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/70 border border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-slate-300">Base Score Bounty:</span>
                  <span className="font-mono font-bold text-amber-400">
                    +{currentEntry.stats.scoreBounty} PTS
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-300">Aether Shard Yield:</span>
                  <span className="font-mono font-bold text-cyan-400">
                    +{currentEntry.stats.crystalYield} XP
                  </span>
                </div>
              </div>
            </div>

            {/* Armament & Tactical Countermeasures */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-rose-400" />
                <span>WEAPONRY & TACTICAL ANALYSIS</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/80">
                  <span className="text-slate-400 font-semibold block mb-1">Armament Loadout:</span>
                  <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                    {currentEntry.armament.map((item, idx) => (
                      <li key={idx} className="font-mono text-[11px]">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/80">
                  <span className="text-slate-400 font-semibold block mb-1">Combat Flight Pattern:</span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {currentEntry.tacticalBehavior}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/30">
                    <span className="text-rose-400 font-semibold block mb-1 text-[11px] flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Critical Vulnerability:
                    </span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {currentEntry.primaryWeakness}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-500/30">
                    <span className="text-cyan-400 font-semibold block mb-1 text-[11px] flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" />
                      Recommended Counter:
                    </span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {currentEntry.recommendedCounter}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Naval Intelligence & Deep Lore */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-amber-400" />
                <span>NAVAL INTELLIGENCE LORE</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-900/30 p-3 rounded-lg border border-slate-800/60">
                "{currentEntry.lore}"
              </p>

              {/* Dossier Bullet Notes */}
              <div className="pt-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Field Observations:
                </span>
                <div className="space-y-1">
                  {currentEntry.dossierNotes.map((note, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-[11px] text-slate-300 font-mono bg-slate-900/20 px-2.5 py-1.5 rounded"
                    >
                      <span className="text-cyan-400 font-bold">›</span>
                      <span>{note}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
