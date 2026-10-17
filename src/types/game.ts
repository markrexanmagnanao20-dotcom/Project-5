/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'UPGRADE_SELECTION' | 'GAME_OVER';

export type GameMode = 'ENDLESS' | 'BOSS_RUSH' | 'OVERDRIVE';

export type ShipId = 'valkyrie' | 'titan' | 'chronos';

export interface ShipConfig {
  id: ShipId;
  name: string;
  role: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  stats: {
    speed: number;
    health: number;
    shield: number;
    fireRate: number;
    damage: number;
  };
  specialName: string;
  specialDescription: string;
  imagePath?: string;
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  shieldRechargeTimer: number;
  dashCooldown: number;
  maxDashCooldown: number;
  isDashing: boolean;
  dashDuration: number;
  specialMeter: number;
  maxSpecialMeter: number;
  fireCooldown: number;
  invulnerableTimer: number;
  shipId: ShipId;
  level: number;
  xp: number;
  xpToNextLevel: number;
  speed: number;
  damageMultiplier: number;
  fireRateMultiplier: number;
  spreadCount: number;
  hasPiercing: boolean;
  homingCount: number;
  homingTimer: number;
  droneCount: number;
  magnetRadius: number;
  empCooldown: number;
  timeFreezeTimer: number;
}

export type EnemyType = 'SCOUT' | 'SWARMER' | 'ASTEROID' | 'CRUISER' | 'SNIPER' | 'BOSS';

export interface Enemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  radius: number;
  health: number;
  maxHealth: number;
  scoreValue: number;
  xpValue: number;
  color: string;
  fireCooldown?: number;
  customData?: {
    asteroidVertices?: { x: number; y: number }[];
    asteroidTier?: number;
    bossPhase?: number;
    maxPhases?: number;
    phaseName?: string;
    bossAttackTimer?: number;
    subWeapons?: number;
    isMegaBoss?: boolean;
    bossName?: string;
  };
}

export interface BossWarningEvent {
  phase: number;
  maxPhases: number;
  timer: number;
  duration: number;
  title: string;
  subtitle: string;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  radius: number;
  color: string;
  isPlayer: boolean;
  piercing?: number;
  isHoming?: boolean;
  homingTargetId?: string;
  lifeTime: number;
  trailColor?: string;
  cosmeticEffectId?: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  shape?: 'circle' | 'spark' | 'ring' | 'shockwave' | 'trail';
  radius?: number;
  maxRadius?: number;
  shrink?: boolean;
}

export interface FloatText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
}

export interface XpShard {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  value: number;
  color: string;
  radius: number;
}

export interface Drone {
  orbitAngle: number;
  distance: number;
  fireCooldown: number;
}

export interface UpgradeOption {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  currentLevel: number;
  maxLevel: number;
}

export interface GameStats {
  score: number;
  highScore: number;
  wave: number;
  enemiesDefeated: number;
  crystalsCollected: number;
  shotsFired: number;
  shotsHit: number;
  maxCombo: number;
  currentCombo: number;
  comboTimer: number;
  comboMultiplier?: number;
  timeSurvived: number; // in seconds
  megaBossesDefeated: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

export interface AudioSettings {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  muted: boolean;
}

export interface VideoSettings {
  particleQuality: 'LOW' | 'MEDIUM' | 'HIGH';
  screenShake: boolean;
  showTouchControls: boolean;
  autoFire: boolean;
}

export type MissionCategory = 'COMBAT' | 'SURVIVAL' | 'COLLECTION' | 'MASTERY';

export type MissionProgressType =
  | 'KILLS'
  | 'CRYSTALS'
  | 'MAX_COMBO'
  | 'SURVIVE_WAVE'
  | 'ELITE_KILLS'
  | 'DASHES'
  | 'SPECIALS'
  | 'SCORE'
  | 'UPGRADES';

export interface DailyMission {
  id: string;
  templateId: string;
  title: string;
  description: string;
  category: MissionCategory;
  progressType: MissionProgressType;
  target: number;
  current: number;
  rewardCredits: number;
  completed: boolean;
  claimed: boolean;
  icon: string;
}

export interface DailyMissionsData {
  date: string; // YYYY-MM-DD format
  missions: DailyMission[];
  allCompletedBonusClaimed: boolean;
  bonusReward: number;
}

export interface TechUpgrade {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'HULL' | 'ENGINE' | 'WEAPON' | 'AVIONICS';
  cost: number;
  maxTier: number;
  currentTier: number;
  statBonusText: string;
}

export type CosmeticType = 'TRAIL' | 'WEAPON';
export type CosmeticTier = 'FLAWLESS' | 'HARDENED' | 'CRITICAL';
export type CosmeticRarity = 'LEGENDARY' | 'EPIC' | 'RARE';

export interface CommanderCosmetic {
  id: string;
  name: string;
  type: CosmeticType;
  tier: CosmeticTier;
  healthRequirementLabel: string;
  rarity: CosmeticRarity;
  description: string;
  previewColor: string;
  accentColor: string;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface CommanderEquipped {
  trailId: string | null;
  weaponId: string | null;
}

export interface CommanderRewardResult {
  cosmetic: CommanderCosmetic;
  isNewUnlock: boolean;
  playerHealthPercent: number;
  tier: CosmeticTier;
  bossName: string;
  creditsBonus: number;
}

export interface WaveTransitionEvent {
  id: string;
  wave: number;
  previousWave: number;
  isSectorChange: boolean;
  sectorName: string;
  sectorCodename: string;
  sectorDescription: string;
  accentColor: string;
  secondaryColor: string;
  isMegaBoss: boolean;
  isBoss: boolean;
  timestamp: number;
}

