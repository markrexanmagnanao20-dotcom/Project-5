/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameMode } from '../types/game';

export interface SectorConfig {
  id: number;
  name: string;
  codename: string;
  description: string;
  bgVoidTop: [number, number, number];
  bgVoidBottom: [number, number, number];
  nebulaPrimary: [number, number, number];
  nebulaSecondary: [number, number, number];
  nebulaCore: [number, number, number];
  accentHex: string;
  ambientDustHex: string;
  starSpectralColors: string[];
}

export const SECTOR_DEFINITIONS: SectorConfig[] = [
  {
    id: 1,
    name: 'Aquila Veil',
    codename: 'SECTOR-01 · IONIC SHALLOWS',
    description: 'Bioluminescent stellar nursery rich in radiant cerulean plasma filaments.',
    bgVoidTop: [2, 5, 14],
    bgVoidBottom: [4, 12, 28],
    nebulaPrimary: [14, 165, 233], // Electric Cyan/Sky
    nebulaSecondary: [59, 130, 246], // Deep Cobalt
    nebulaCore: [103, 232, 249], // Hyper Aquamarine
    accentHex: '#38bdf8',
    ambientDustHex: '#7dd3fc',
    starSpectralColors: ['#ffffff', '#e0f2fe', '#bae6fd', '#7dd3fc', '#fef3c7'],
  },
  {
    id: 2,
    name: 'Helios Flare',
    codename: 'SECTOR-02 · CORONA REACH',
    description: 'High-radiation stellar corridor illuminated by supercharged coronal mass ejections.',
    bgVoidTop: [12, 6, 3],
    bgVoidBottom: [26, 12, 4],
    nebulaPrimary: [245, 158, 11], // Solar Amber
    nebulaSecondary: [234, 88, 12], // Deep Solar Orange
    nebulaCore: [253, 224, 71], // Coronal Gold
    accentHex: '#fbbf24',
    ambientDustHex: '#fcd34d',
    starSpectralColors: ['#ffffff', '#fef3c7', '#fde68a', '#fed7aa', '#93c5fd'],
  },
  {
    id: 3,
    name: 'Void Phantasm',
    codename: 'SECTOR-03 · DIMENSIONAL RIFT',
    description: 'Anomalous subspace rift crackling with ultraviolet and tachyonic dark matter.',
    bgVoidTop: [8, 3, 18],
    bgVoidBottom: [22, 6, 38],
    nebulaPrimary: [168, 85, 247], // Amethyst Purple
    nebulaSecondary: [99, 102, 241], // Deep Indigo Rift
    nebulaCore: [236, 72, 153], // Neon Magenta Core
    accentHex: '#c084fc',
    ambientDustHex: '#e879f9',
    starSpectralColors: ['#ffffff', '#f5d0fe', '#e9d5ff', '#c4b5fd', '#a5f3fc'],
  },
  {
    id: 4,
    name: 'Cygnus Aurora',
    codename: 'SECTOR-04 · EMERALD ABYSS',
    description: 'Dense crystalline gas corridor ionized by magnetic pulsar resonance.',
    bgVoidTop: [2, 10, 8],
    bgVoidBottom: [4, 28, 22],
    nebulaPrimary: [16, 185, 129], // Emerald Nebula
    nebulaSecondary: [20, 184, 166], // Phosphor Teal
    nebulaCore: [110, 231, 183], // Luminescent Mint
    accentHex: '#34d399',
    ambientDustHex: '#6ee7b7',
    starSpectralColors: ['#ffffff', '#ccfbf1', '#a7f3d0', '#6ee7b7', '#fef08a'],
  },
  {
    id: 5,
    name: 'Hypernova Rift',
    codename: 'SECTOR-05 · CATACLYSM CORE',
    description: 'Ground zero of a collapsing supergiant star with violent plasma shockfronts.',
    bgVoidTop: [18, 3, 8],
    bgVoidBottom: [44, 6, 16],
    nebulaPrimary: [225, 29, 72], // Supernova Crimson
    nebulaSecondary: [249, 115, 22], // Thermal Blaze
    nebulaCore: [254, 240, 138], // Incandescent Stellar Core
    accentHex: '#f43f5e',
    ambientDustHex: '#fb7185',
    starSpectralColors: ['#ffffff', '#fecdd3', '#fed7aa', '#fef08a', '#67e8f9'],
  },
];

export function getSectorForWave(wave: number, mode: GameMode): SectorConfig {
  if (mode === 'BOSS_RUSH') {
    // In Boss Rush, rotate sectors every wave
    const idx = ((wave - 1) % SECTOR_DEFINITIONS.length);
    return SECTOR_DEFINITIONS[idx];
  }
  if (mode === 'OVERDRIVE') {
    // Overdrive runs in the hyper-intense sectors
    const idx = (Math.floor((wave - 1) / 2) % 3) + 2; // Sectors 3, 4, 5
    return SECTOR_DEFINITIONS[Math.min(idx, SECTOR_DEFINITIONS.length - 1)];
  }

  // Endless mode: every 2 waves shifts to the next sector
  const sectorIndex = Math.min(
    SECTOR_DEFINITIONS.length - 1,
    Math.floor((Math.max(1, wave) - 1) / 2)
  );
  return SECTOR_DEFINITIONS[sectorIndex];
}

interface FarStar {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  color: string;
}

interface MidStar {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  color: string;
  speedMultiplier: number;
}

interface ForeStar {
  x: number;
  y: number;
  radius: number;
  color: string;
  alpha: number;
}

interface PulsarStar {
  x: number;
  y: number;
  radius: number;
  flareRadius: number;
  color: string;
  pulsePhase: number;
  pulseSpeed: number;
}

interface StardustMote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  maxAlpha: number;
  life: number;
  maxLife: number;
}

interface NebulaCloudNode {
  normX: number;
  normY: number;
  baseRadiusX: number;
  baseRadiusY: number;
  rotation: number;
  rotSpeed: number;
  parallaxFactor: number;
  driftPhase: number;
  density: number;
  type: 'primary' | 'secondary' | 'core';
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpColor(c1: [number, number, number], c2: [number, number, number], t: number): [number, number, number] {
  return [
    Math.round(lerp(c1[0], c2[0], t)),
    Math.round(lerp(c1[1], c2[1], t)),
    Math.round(lerp(c1[2], c2[2], t)),
  ];
}

function rgbStr(c: [number, number, number], alpha: number = 1): string {
  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha.toFixed(3)})`;
}

export class ProceduralCosmos {
  private width: number = 800;
  private height: number = 600;

  // Star layers
  private farStars: FarStar[] = [];
  private midStars: MidStar[] = [];
  private foreStars: ForeStar[] = [];
  private pulsars: PulsarStar[] = [];
  private dustMotes: StardustMote[] = [];

  // Nebula nodes
  private nebulaNodes: NebulaCloudNode[] = [];

  // Current interpolated color states
  private currentSector: SectorConfig = SECTOR_DEFINITIONS[0];
  private targetSector: SectorConfig = SECTOR_DEFINITIONS[0];
  private curVoidTop: [number, number, number] = [...SECTOR_DEFINITIONS[0].bgVoidTop];
  private curVoidBottom: [number, number, number] = [...SECTOR_DEFINITIONS[0].bgVoidBottom];
  private curNebulaPrimary: [number, number, number] = [...SECTOR_DEFINITIONS[0].nebulaPrimary];
  private curNebulaSecondary: [number, number, number] = [...SECTOR_DEFINITIONS[0].nebulaSecondary];
  private curNebulaCore: [number, number, number] = [...SECTOR_DEFINITIONS[0].nebulaCore];

  // Dynamic wave intensity
  private intensity: number = 0.3;
  private targetIntensity: number = 0.3;
  private globalTime: number = 0;

  // Parallax camera displacement
  private camOffsetX: number = 0;
  private camOffsetY: number = 0;

  // Ion storm lightning effect (occurs during boss encounters or high intensity)
  private lightningTimer: number = 0;
  private lightningAlpha: number = 0;

  // Sector banner trigger helper
  private lastAnnouncedSectorId: number = 1;
  private sectorBannerTimer: number = 0;

  constructor(width: number, height: number) {
    this.width = Math.max(100, width);
    this.height = Math.max(100, height);
    this.initNebulaNodes();
    this.initStars();
  }

  public resize(width: number, height: number) {
    this.width = Math.max(100, width);
    this.height = Math.max(100, height);
    this.initStars();
  }

  private initNebulaNodes() {
    this.nebulaNodes = [
      // Major upper-left celestial formation
      {
        normX: 0.22,
        normY: 0.25,
        baseRadiusX: 380,
        baseRadiusY: 280,
        rotation: 0.4,
        rotSpeed: 0.008,
        parallaxFactor: 0.015,
        driftPhase: 0,
        density: 0.85,
        type: 'primary',
      },
      // Deep secondary filament extending diagonal
      {
        normX: 0.38,
        normY: 0.35,
        baseRadiusX: 320,
        baseRadiusY: 200,
        rotation: -0.6,
        rotSpeed: -0.012,
        parallaxFactor: 0.02,
        driftPhase: 1.5,
        density: 0.65,
        type: 'secondary',
      },
      // Brilliant core eye / star nursery
      {
        normX: 0.28,
        normY: 0.28,
        baseRadiusX: 180,
        baseRadiusY: 140,
        rotation: 0.8,
        rotSpeed: 0.015,
        parallaxFactor: 0.025,
        driftPhase: 2.1,
        density: 0.95,
        type: 'core',
      },
      // Lower-right secondary nebula wing
      {
        normX: 0.78,
        normY: 0.72,
        baseRadiusX: 420,
        baseRadiusY: 310,
        rotation: 1.2,
        rotSpeed: -0.006,
        parallaxFactor: 0.018,
        driftPhase: 3.4,
        density: 0.8,
        type: 'primary',
      },
      // Filament trail crossing lower mid
      {
        normX: 0.65,
        normY: 0.82,
        baseRadiusX: 340,
        baseRadiusY: 190,
        rotation: -0.3,
        rotSpeed: 0.01,
        parallaxFactor: 0.022,
        driftPhase: 4.2,
        density: 0.7,
        type: 'secondary',
      },
      // Upper-right subtle distant cloud
      {
        normX: 0.85,
        normY: 0.22,
        baseRadiusX: 280,
        baseRadiusY: 220,
        rotation: 0.2,
        rotSpeed: 0.005,
        parallaxFactor: 0.012,
        driftPhase: 5.1,
        density: 0.55,
        type: 'secondary',
      },
      // Central mystic aether veil
      {
        normX: 0.52,
        normY: 0.48,
        baseRadiusX: 250,
        baseRadiusY: 180,
        rotation: -0.7,
        rotSpeed: 0.009,
        parallaxFactor: 0.028,
        driftPhase: 0.8,
        density: 0.6,
        type: 'core',
      },
    ];
  }

  private initStars() {
    const w = this.width;
    const h = this.height;
    const colors = this.currentSector.starSpectralColors;

    // 1. Far Stars (Deep field, 90 count)
    this.farStars = [];
    for (let i = 0; i < 90; i++) {
      this.farStars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        radius: Math.random() * 0.5 + 0.4,
        baseAlpha: Math.random() * 0.35 + 0.25,
        twinkleSpeed: Math.random() * 2.5 + 1.0,
        twinklePhase: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    // 2. Mid Stars (Spectral field, 55 count)
    this.midStars = [];
    for (let i = 0; i < 55; i++) {
      this.midStars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        radius: Math.random() * 0.7 + 0.9,
        baseAlpha: Math.random() * 0.4 + 0.45,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedMultiplier: Math.random() * 0.4 + 0.8,
      });
    }

    // 3. Foreground Hyper-Stars (Fast parallax & streaks, 25 count)
    this.foreStars = [];
    for (let i = 0; i < 25; i++) {
      this.foreStars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        radius: Math.random() * 0.9 + 1.6,
        color: colors[Math.floor(Math.random() * 3)], // Whiter/brighter spectral
        alpha: Math.random() * 0.3 + 0.7,
      });
    }

    // 4. Pulsar Flare Landmarks (5 strategic beacons)
    this.pulsars = [];
    const pulsarLocs = [
      { x: w * 0.18, y: h * 0.22 },
      { x: w * 0.82, y: h * 0.28 },
      { x: w * 0.32, y: h * 0.78 },
      { x: w * 0.76, y: h * 0.74 },
      { x: w * 0.54, y: h * 0.42 },
    ];
    for (let i = 0; i < pulsarLocs.length; i++) {
      this.pulsars.push({
        x: pulsarLocs[i].x + (Math.random() - 0.5) * 80,
        y: pulsarLocs[i].y + (Math.random() - 0.5) * 80,
        radius: Math.random() * 1.2 + 2.4,
        flareRadius: Math.random() * 6 + 14,
        color: colors[i % colors.length],
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 2.0 + 1.5,
      });
    }

    // 5. Stardust Motes (28 drifting ionized dust sparks)
    this.dustMotes = [];
    for (let i = 0; i < 28; i++) {
      this.spawnDustMote(Math.random() * w, Math.random() * h);
    }
  }

  private spawnDustMote(x?: number, y?: number) {
    const w = this.width;
    const h = this.height;
    const maxLife = Math.random() * 4.0 + 3.0;
    this.dustMotes.push({
      x: x !== undefined ? x : Math.random() * w,
      y: y !== undefined ? y : Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4,
      vy: Math.random() * 0.3 + 0.1,
      radius: Math.random() * 1.5 + 0.7,
      alpha: 0,
      maxAlpha: Math.random() * 0.45 + 0.25,
      life: maxLife,
      maxLife,
    });
  }

  public update(
    dt: number,
    wave: number,
    mode: GameMode,
    isBossActive: boolean,
    combo: number,
    playerVx: number,
    playerVy: number,
    isDashing: boolean
  ) {
    this.globalTime += dt;

    // Determine target sector from wave and game mode
    this.targetSector = getSectorForWave(wave, mode);

    // Track sector changes for banner notification
    if (this.targetSector.id !== this.lastAnnouncedSectorId) {
      this.lastAnnouncedSectorId = this.targetSector.id;
      this.sectorBannerTimer = 4.0; // Show banner for 4 seconds
    }
    if (this.sectorBannerTimer > 0) {
      this.sectorBannerTimer -= dt;
    }

    // Calculate dynamic intensity
    // Base intensity scales with wave (from 0.25 up to 1.1)
    const baseWaveIntensity = Math.min(1.0, 0.25 + (wave - 1) * 0.08);
    // Boss battle adds tension and energetic flares
    const bossFactor = isBossActive ? 0.35 : 0;
    // High combo surges dynamic stellar luminescence
    const comboFactor = Math.min(0.25, (combo > 1 ? combo - 1 : 0) * 0.025);
    this.targetIntensity = Math.min(1.4, baseWaveIntensity + bossFactor + comboFactor);

    // Smoothly interpolate intensity
    this.intensity += (this.targetIntensity - this.intensity) * Math.min(1, dt * 2.0);

    // Smooth color interpolation toward target sector palette (1.5 sec transition)
    const colorLerpSpeed = Math.min(1, dt * 1.2);
    this.curVoidTop = lerpColor(this.curVoidTop, this.targetSector.bgVoidTop, colorLerpSpeed);
    this.curVoidBottom = lerpColor(this.curVoidBottom, this.targetSector.bgVoidBottom, colorLerpSpeed);
    this.curNebulaPrimary = lerpColor(this.curNebulaPrimary, this.targetSector.nebulaPrimary, colorLerpSpeed);
    this.curNebulaSecondary = lerpColor(this.curNebulaSecondary, this.targetSector.nebulaSecondary, colorLerpSpeed);
    this.curNebulaCore = lerpColor(this.curNebulaCore, this.targetSector.nebulaCore, colorLerpSpeed);
    this.currentSector = this.targetSector;

    // Camera parallax reaction to player velocity
    const safeVx = Number.isFinite(playerVx) ? playerVx : 0;
    const safeVy = Number.isFinite(playerVy) ? playerVy : 0;
    this.camOffsetX += (safeVx * 0.5 - this.camOffsetX) * Math.min(1, dt * 4.0);
    this.camOffsetY += (safeVy * 0.5 - this.camOffsetY) * Math.min(1, dt * 4.0);

    // Ion storm lightning logic during boss fight or high sector intensity
    if (isBossActive || this.intensity > 0.8) {
      this.lightningTimer -= dt;
      if (this.lightningTimer <= 0) {
        // Trigger subtle celestial flash
        this.lightningAlpha = isBossActive ? 0.22 : 0.12;
        this.lightningTimer = Math.random() * 4.5 + 2.5; // Next flash in 2.5-7s
      }
    }
    if (this.lightningAlpha > 0) {
      this.lightningAlpha = Math.max(0, this.lightningAlpha - dt * 1.8);
    }

    const w = this.width;
    const h = this.height;
    const timeScale = dt * 60;

    // Update Dust Motes
    for (let i = this.dustMotes.length - 1; i >= 0; i--) {
      const mote = this.dustMotes[i];
      mote.life -= dt;
      if (mote.life <= 0) {
        this.dustMotes.splice(i, 1);
        this.spawnDustMote();
        continue;
      }

      // Parallax & drift
      mote.x += (mote.vx - safeVx * 0.03) * timeScale;
      mote.y += (mote.vy - safeVy * 0.03) * timeScale;

      // Wrap
      if (mote.x < 0) mote.x = w;
      else if (mote.x > w) mote.x = 0;
      if (mote.y < 0) mote.y = h;
      else if (mote.y > h) mote.y = 0;

      // Fade in/out
      const progress = 1 - mote.life / mote.maxLife;
      if (progress < 0.2) {
        mote.alpha = (progress / 0.2) * mote.maxAlpha;
      } else if (progress > 0.8) {
        mote.alpha = ((1 - progress) / 0.2) * mote.maxAlpha;
      } else {
        mote.alpha = mote.maxAlpha;
      }
    }

    // Refill dust if needed
    while (this.dustMotes.length < 28) {
      this.spawnDustMote();
    }
  }

  public render(
    ctx: CanvasRenderingContext2D,
    playerX: number,
    playerY: number,
    playerVx: number,
    playerVy: number,
    isDashing: boolean
  ) {
    const w = this.width;
    const h = this.height;
    const safeVx = Number.isFinite(playerVx) ? playerVx : 0;
    const safeVy = Number.isFinite(playerVy) ? playerVy : 0;
    const speed = Math.hypot(safeVx, safeVy);

    // ----------------------------------------------------
    // 1. Deep Space Void Gradient (Sector Dynamic Shift)
    // ----------------------------------------------------
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, rgbStr(this.curVoidTop, 1.0));
    bgGrad.addColorStop(1, rgbStr(this.curVoidBottom, 1.0));
    ctx.fillStyle = bgGrad;
    ctx.fillRect(-20, -20, w + 40, h + 40);

    // ----------------------------------------------------
    // 2. Procedural Volumetric Nebula Clouds
    // ----------------------------------------------------
    ctx.save();
    // Use 'screen' composition for rich optical illumination
    ctx.globalCompositeOperation = 'screen';

    for (let i = 0; i < this.nebulaNodes.length; i++) {
      const node = this.nebulaNodes[i];

      // Parallax displacement based on node depth & ship position
      const pOffsetX = (playerX - w * 0.5) * node.parallaxFactor;
      const pOffsetY = (playerY - h * 0.5) * node.parallaxFactor;

      // Slow organic drift
      const driftX = Math.sin(this.globalTime * 0.25 + node.driftPhase) * 18;
      const driftY = Math.cos(this.globalTime * 0.2 + node.driftPhase) * 14;

      const cx = w * node.normX - pOffsetX + driftX;
      const cy = h * node.normY - pOffsetY + driftY;

      // Dynamic pulsation with wave intensity
      const pulse = 1 + Math.sin(this.globalTime * 0.8 + node.driftPhase) * (0.04 + this.intensity * 0.05);
      const rx = node.baseRadiusX * pulse;
      const ry = node.baseRadiusY * pulse;

      // Pick color based on cloud role
      let colorTuple = this.curNebulaPrimary;
      let alphaMultiplier = 0.22;
      if (node.type === 'secondary') {
        colorTuple = this.curNebulaSecondary;
        alphaMultiplier = 0.18;
      } else if (node.type === 'core') {
        colorTuple = this.curNebulaCore;
        alphaMultiplier = 0.28;
      }

      // Base opacity scales with sector intensity
      const finalAlpha = Math.min(0.48, alphaMultiplier * (0.8 + this.intensity * 0.45) * node.density);

      // Render layered elliptical glow
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(node.rotation + this.globalTime * node.rotSpeed);
      ctx.scale(1, ry / rx);

      const radGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
      radGrad.addColorStop(0, rgbStr(colorTuple, finalAlpha));
      radGrad.addColorStop(0.45, rgbStr(colorTuple, finalAlpha * 0.55));
      radGrad.addColorStop(0.75, rgbStr(colorTuple, finalAlpha * 0.18));
      radGrad.addColorStop(1, rgbStr(colorTuple, 0));

      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(0, 0, rx, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();

    // ----------------------------------------------------
    // 3. Ion Storm Lightning Discharge (During Boss / Surges)
    // ----------------------------------------------------
    if (this.lightningAlpha > 0.005) {
      ctx.save();
      ctx.fillStyle = rgbStr(this.curNebulaCore, this.lightningAlpha);
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    // ----------------------------------------------------
    // 4. Parallax Starfield - Layer 1: Far Deep Stars
    // ----------------------------------------------------
    ctx.save();
    for (let i = 0; i < this.farStars.length; i++) {
      const star = this.farStars[i];
      // Slow micro-drift + subtle parallax
      star.y += 0.08 - safeVy * 0.008;
      star.x -= safeVx * 0.008;

      if (star.y > h) star.y = 0;
      else if (star.y < 0) star.y = h;
      if (star.x > w) star.x = 0;
      else if (star.x < 0) star.x = w;

      const twinkle = Math.sin(this.globalTime * star.twinkleSpeed + star.twinklePhase);
      const alpha = Math.max(0.1, star.baseAlpha + twinkle * 0.15);

      ctx.globalAlpha = alpha;
      ctx.fillStyle = star.color;
      ctx.fillRect(star.x, star.y, star.radius, star.radius);
    }

    // ----------------------------------------------------
    // 5. Parallax Starfield - Layer 2: Mid Spectral Stars
    // ----------------------------------------------------
    for (let i = 0; i < this.midStars.length; i++) {
      const star = this.midStars[i];
      star.y += 0.22 * star.speedMultiplier - safeVy * 0.025;
      star.x -= safeVx * 0.025;

      if (star.y > h) star.y = 0;
      else if (star.y < 0) star.y = h;
      if (star.x > w) star.x = 0;
      else if (star.x < 0) star.x = w;

      ctx.globalAlpha = star.baseAlpha;
      ctx.fillStyle = star.color;
      ctx.fillRect(star.x, star.y, star.radius, star.radius);
    }

    // ----------------------------------------------------
    // 6. Parallax Starfield - Layer 3: Pulsar Flare Landmarks
    // ----------------------------------------------------
    for (let i = 0; i < this.pulsars.length; i++) {
      const p = this.pulsars[i];
      const px = p.x - (playerX - w * 0.5) * 0.03;
      const py = p.y - (playerY - h * 0.5) * 0.03;

      const pulse = Math.sin(this.globalTime * p.pulseSpeed + p.pulsePhase);
      const flareScale = 1 + pulse * (0.25 + this.intensity * 0.15);
      const flareLen = p.flareRadius * flareScale;

      ctx.save();
      ctx.translate(px, py);

      // Soft corona halo
      ctx.globalAlpha = 0.25 + pulse * 0.1;
      ctx.fillStyle = this.currentSector.accentHex;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius * 2.8 * flareScale, 0, Math.PI * 2);
      ctx.fill();

      // 4-Point Diffraction Spike Flare (Hubble / JWST Star Aesthetic)
      ctx.globalAlpha = 0.7 + pulse * 0.25;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-flareLen, 0);
      ctx.lineTo(flareLen, 0);
      ctx.moveTo(0, -flareLen);
      ctx.lineTo(0, flareLen);
      ctx.stroke();

      // Bright Core
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // ----------------------------------------------------
    // 7. Parallax Starfield - Layer 4: Foreground Hyper-Stars
    // (With Velocity Streaking / Hyperspace Blur)
    // ----------------------------------------------------
    const streakFactor = isDashing ? 3.8 : 1.8;
    const isStreaking = speed > 1.2 || isDashing;

    for (let i = 0; i < this.foreStars.length; i++) {
      const star = this.foreStars[i];
      star.y += 0.45 - safeVy * 0.06;
      star.x -= safeVx * 0.06;

      if (star.y > h) star.y = 0;
      else if (star.y < 0) star.y = h;
      if (star.x > w) star.x = 0;
      else if (star.x < 0) star.x = w;

      ctx.globalAlpha = star.alpha;
      ctx.fillStyle = star.color;

      if (isStreaking) {
        // Draw crisp motion blur streak along velocity vector
        const streakX = safeVx * streakFactor;
        const streakY = safeVy * streakFactor;
        ctx.strokeStyle = star.color;
        ctx.lineWidth = star.radius;
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(star.x - streakX, star.y - streakY);
        ctx.stroke();
      } else {
        ctx.fillRect(star.x, star.y, star.radius, star.radius);
      }
    }

    // ----------------------------------------------------
    // 8. Cosmic Stardust Motes (Ionized Ambient Floating Sparks)
    // ----------------------------------------------------
    for (let i = 0; i < this.dustMotes.length; i++) {
      const mote = this.dustMotes[i];
      if (mote.alpha <= 0.01) continue;

      ctx.globalAlpha = mote.alpha;
      ctx.fillStyle = this.currentSector.ambientDustHex;
      ctx.beginPath();
      ctx.arc(mote.x, mote.y, mote.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // ----------------------------------------------------
    // 9. Sector Transition Announcement Banner
    // ----------------------------------------------------
    if (this.sectorBannerTimer > 0) {
      this.renderSectorBanner(ctx, w, h);
    }
  }

  private renderSectorBanner(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const elapsed = 4.0 - this.sectorBannerTimer;
    let alpha = 1.0;
    if (elapsed < 0.6) {
      alpha = elapsed / 0.6; // Fade in
    } else if (this.sectorBannerTimer < 0.8) {
      alpha = this.sectorBannerTimer / 0.8; // Fade out
    }

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

    const bannerY = h * 0.22;
    const bannerH = 58;

    // Subtle dark backdrop ribbon with glowing borderlines
    const grad = ctx.createLinearGradient(0, bannerY, 0, bannerY + bannerH);
    grad.addColorStop(0, 'rgba(2, 6, 23, 0.85)');
    grad.addColorStop(1, 'rgba(15, 23, 42, 0.7)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, bannerY, w, bannerH);

    // Glowing cyan/sector-accent accent lines top & bottom
    ctx.strokeStyle = this.currentSector.accentHex;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, bannerY);
    ctx.lineTo(w, bannerY);
    ctx.moveTo(0, bannerY + bannerH);
    ctx.lineTo(w, bannerY + bannerH);
    ctx.stroke();

    // Text details
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Sector Codename
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = this.currentSector.accentHex;
    ctx.fillText(`ENTERING ${this.currentSector.codename}`, w / 2, bannerY + 18);

    // Sector Name & Theme
    ctx.font = '900 18px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.currentSector.name.toUpperCase(), w / 2, bannerY + 38);

    ctx.restore();
  }

  public getCurrentSector(): SectorConfig {
    return this.currentSector;
  }

  public getIntensity(): number {
    return this.intensity;
  }
}
