/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Achievement,
  AudioSettings,
  DailyMission,
  DailyMissionsData,
  EnemyType,
  GameMode,
  MissionProgressType,
  VideoSettings,
  CommanderCosmetic,
  CommanderEquipped,
  CommanderRewardResult,
  CosmeticTier,
} from '../types/game';
import { generateDailyMissionsForDate, getTodayDateString } from '../data/missions';

const HIGH_SCORE_KEY = 'aether_surge_high_scores';
const ACHIEVEMENTS_KEY = 'aether_surge_achievements';
const AUDIO_SETTINGS_KEY = 'aether_surge_audio_settings';
const VIDEO_SETTINGS_KEY = 'aether_surge_video_settings';
const BESTIARY_STORAGE_KEY = 'aether_surge_bestiary';
const CREDITS_STORAGE_KEY = 'aether_surge_credits';
const DAILY_MISSIONS_KEY = 'aether_surge_daily_missions';
const TECH_UPGRADES_KEY = 'aether_surge_tech_upgrades';

export interface BestiaryEncounterRecord {
  encountered: boolean;
  kills: number;
  firstEncounteredAt?: number;
}

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_kill',
    title: 'First Contact',
    description: 'Vaporize your first alien aggressor',
    icon: 'Crosshair',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'combo_10',
    title: 'Combo Surge',
    description: 'Reach a 10x combo multiplier',
    icon: 'Zap',
    unlocked: false,
    progress: 0,
    maxProgress: 10,
  },
  {
    id: 'wave_5',
    title: 'Void Survivor',
    description: 'Survive past Wave 5',
    icon: 'Shield',
    unlocked: false,
    progress: 0,
    maxProgress: 5,
  },
  {
    id: 'boss_slayer',
    title: 'Titan Crusher',
    description: 'Defeat a cosmic Dreadnought boss',
    icon: 'Skull',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'crystal_collector',
    title: 'Aether Harvester',
    description: 'Collect 100 energy crystals',
    icon: 'Gem',
    unlocked: false,
    progress: 0,
    maxProgress: 100,
  },
  {
    id: 'max_level',
    title: 'Overcharged Nexus',
    description: 'Reach player level 10 in a single run',
    icon: 'Sparkles',
    unlocked: false,
    progress: 0,
    maxProgress: 10,
  },
];

export const getHighScores = (): Record<GameMode, number> => {
  try {
    const raw = localStorage.getItem(HIGH_SCORE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return { ENDLESS: 0, BOSS_RUSH: 0, OVERDRIVE: 0 };
};

export const saveHighScore = (mode: GameMode, score: number): boolean => {
  try {
    const scores = getHighScores();
    if (score > (scores[mode] || 0)) {
      scores[mode] = score;
      localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(scores));
      return true; // new high score!
    }
  } catch {
    // ignore
  }
  return false;
};

export const getStoredAchievements = (): Achievement[] => {
  try {
    const raw = localStorage.getItem(ACHIEVEMENTS_KEY);
    if (raw) {
      const parsed: Achievement[] = JSON.parse(raw);
      // Merge in case new achievements were added
      return INITIAL_ACHIEVEMENTS.map((initial) => {
        const found = parsed.find((p) => p.id === initial.id);
        return found ? { ...initial, ...found } : initial;
      });
    }
  } catch {
    // fallback
  }
  return INITIAL_ACHIEVEMENTS;
};

export const saveAchievements = (achievements: Achievement[]) => {
  try {
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
  } catch {
    // ignore
  }
};

export const getAudioSettings = (): AudioSettings => {
  try {
    const raw = localStorage.getItem(AUDIO_SETTINGS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return {
    masterVolume: 0.7,
    sfxVolume: 0.8,
    musicVolume: 0.35,
    muted: false,
  };
};

export const saveAudioSettings = (settings: AudioSettings) => {
  try {
    localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
};

export const getVideoSettings = (): VideoSettings => {
  try {
    const raw = localStorage.getItem(VIDEO_SETTINGS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return {
    particleQuality: 'HIGH',
    screenShake: true,
    showTouchControls: false,
    autoFire: false,
  };
};

export const saveVideoSettings = (settings: VideoSettings) => {
  try {
    localStorage.setItem(VIDEO_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
};

const DEFAULT_BESTIARY: Record<EnemyType, BestiaryEncounterRecord> = {
  SCOUT: { encountered: true, kills: 0, firstEncounteredAt: Date.now() },
  SWARMER: { encountered: true, kills: 0, firstEncounteredAt: Date.now() },
  ASTEROID: { encountered: true, kills: 0, firstEncounteredAt: Date.now() },
  CRUISER: { encountered: false, kills: 0 },
  SNIPER: { encountered: false, kills: 0 },
  BOSS: { encountered: false, kills: 0 },
};

export const getStoredBestiary = (): Record<EnemyType, BestiaryEncounterRecord> => {
  try {
    const raw = localStorage.getItem(BESTIARY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_BESTIARY,
        ...parsed,
      };
    }

    // Smart seed based on previous play records
    const scores = getHighScores();
    const hasPlayed = scores.ENDLESS > 0 || scores.BOSS_RUSH > 0 || scores.OVERDRIVE > 0;
    const seed = { ...DEFAULT_BESTIARY };

    if (hasPlayed) {
      seed.SCOUT.encountered = true;
      seed.SWARMER.encountered = true;
      seed.ASTEROID.encountered = true;
      if (scores.ENDLESS >= 1500 || scores.OVERDRIVE >= 1500) {
        seed.CRUISER.encountered = true;
      }
      if (scores.ENDLESS >= 3000 || scores.OVERDRIVE >= 3000) {
        seed.SNIPER.encountered = true;
      }
      if (scores.BOSS_RUSH > 0 || scores.ENDLESS >= 5000) {
        seed.BOSS.encountered = true;
      }
    }

    return seed;
  } catch {
    return DEFAULT_BESTIARY;
  }
};

export const saveBestiaryData = (data: Record<EnemyType, BestiaryEncounterRecord>) => {
  try {
    localStorage.setItem(BESTIARY_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
};

export const recordEnemyEncounter = (type: EnemyType): Record<EnemyType, BestiaryEncounterRecord> => {
  try {
    const data = getStoredBestiary();
    if (!data[type] || !data[type].encountered) {
      data[type] = {
        encountered: true,
        kills: data[type]?.kills || 0,
        firstEncounteredAt: data[type]?.firstEncounteredAt || Date.now(),
      };
      saveBestiaryData(data);
    }
    return data;
  } catch {
    return DEFAULT_BESTIARY;
  }
};

export const recordEnemyKill = (type: EnemyType): Record<EnemyType, BestiaryEncounterRecord> => {
  try {
    const data = getStoredBestiary();
    const current = data[type] || { encountered: true, kills: 0 };
    data[type] = {
      encountered: true,
      kills: (current.kills || 0) + 1,
      firstEncounteredAt: current.firstEncounteredAt || Date.now(),
    };
    saveBestiaryData(data);
    return data;
  } catch {
    return DEFAULT_BESTIARY;
  }
};

// ==========================================
// AETHER CREDITS (CURRENCY) PERSISTENCE
// ==========================================

const DEFAULT_STARTER_CREDITS = 250;

export const getStoredCredits = (): number => {
  try {
    const raw = localStorage.getItem(CREDITS_STORAGE_KEY);
    if (raw !== null) {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed) && parsed >= 0) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return DEFAULT_STARTER_CREDITS;
};

export const saveCredits = (credits: number) => {
  try {
    localStorage.setItem(CREDITS_STORAGE_KEY, Math.max(0, Math.floor(credits)).toString());
  } catch {
    // ignore
  }
};

export const addCredits = (amount: number): number => {
  const current = getStoredCredits();
  const next = current + Math.max(0, Math.floor(amount));
  saveCredits(next);
  return next;
};

export const spendCredits = (amount: number): boolean => {
  const current = getStoredCredits();
  if (current >= amount) {
    saveCredits(current - amount);
    return true;
  }
  return false;
};

// ==========================================
// DAILY MISSIONS PERSISTENCE & TRACKING
// ==========================================

export const getStoredDailyMissions = (): DailyMissionsData => {
  const today = getTodayDateString();
  try {
    const raw = localStorage.getItem(DAILY_MISSIONS_KEY);
    if (raw) {
      const data: DailyMissionsData = JSON.parse(raw);
      if (data && data.date === today && Array.isArray(data.missions) && data.missions.length === 3) {
        return data;
      }
    }
  } catch {
    // regenerate on error
  }

  // Generate today's missions and persist
  const freshData = generateDailyMissionsForDate(today);
  saveDailyMissions(freshData);
  return freshData;
};

export const saveDailyMissions = (data: DailyMissionsData) => {
  try {
    localStorage.setItem(DAILY_MISSIONS_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
};

/**
 * Updates daily mission progress based on game events.
 * Returns any newly completed missions for fanfare/notifications.
 */
export const updateDailyMissionProgress = (
  progressType: MissionProgressType,
  deltaOrValue: number,
  isAbsolute = false
): { updatedMissions: DailyMission[]; newlyCompleted: DailyMission[] } => {
  const data = getStoredDailyMissions();
  let hasChanges = false;
  const newlyCompleted: DailyMission[] = [];

  data.missions.forEach((mission) => {
    if (mission.progressType === progressType) {
      const prevCurrent = mission.current;
      const prevCompleted = mission.completed;

      if (isAbsolute) {
        mission.current = Math.max(mission.current, Math.min(mission.target, Math.floor(deltaOrValue)));
      } else {
        mission.current = Math.min(mission.target, mission.current + Math.floor(deltaOrValue));
      }

      if (mission.current >= mission.target && !mission.completed) {
        mission.completed = true;
        newlyCompleted.push({ ...mission });
      }

      if (mission.current !== prevCurrent || mission.completed !== prevCompleted) {
        hasChanges = true;
      }
    }
  });

  if (hasChanges) {
    saveDailyMissions(data);
  }

  return { updatedMissions: data.missions, newlyCompleted };
};

/**
 * Claims reward for an individual completed daily mission.
 */
export const claimDailyMission = (
  missionId: string
): { success: boolean; reward: number; newCredits: number } => {
  const data = getStoredDailyMissions();
  const mission = data.missions.find((m) => m.id === missionId);

  if (mission && mission.completed && !mission.claimed) {
    mission.claimed = true;
    saveDailyMissions(data);
    const newCredits = addCredits(mission.rewardCredits);
    return { success: true, reward: mission.rewardCredits, newCredits };
  }

  return { success: false, reward: 0, newCredits: getStoredCredits() };
};

/**
 * Claims grand completionist bonus when all 3 daily directives are completed.
 */
export const claimAllDailyMissionsBonus = (): {
  success: boolean;
  reward: number;
  newCredits: number;
} => {
  const data = getStoredDailyMissions();
  const allFinished = data.missions.length === 3 && data.missions.every((m) => m.completed);

  if (allFinished && !data.allCompletedBonusClaimed) {
    data.allCompletedBonusClaimed = true;
    saveDailyMissions(data);
    const newCredits = addCredits(data.bonusReward);
    return { success: true, reward: data.bonusReward, newCredits };
  }

  return { success: false, reward: 0, newCredits: getStoredCredits() };
};

// ==========================================
// TECH FOUNDRY (PERMANENT ARMORY CALIBRATION)
// ==========================================

export const getStoredTechUpgrades = (): Record<string, number> => {
  try {
    const raw = localStorage.getItem(TECH_UPGRADES_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return {
    hull_plating: 0,
    tachyon_thrusters: 0,
    crystal_magnet: 0,
    overcharge_core: 0,
  };
};

export const saveTechUpgrades = (upgrades: Record<string, number>) => {
  try {
    localStorage.setItem(TECH_UPGRADES_KEY, JSON.stringify(upgrades));
  } catch {
    // ignore
  }
};

export const buyTechUpgrade = (upgradeId: string, cost: number, maxTier = 5): boolean => {
  const currentUpgrades = getStoredTechUpgrades();
  const currentTier = currentUpgrades[upgradeId] || 0;
  if (currentTier >= maxTier) return false;

  if (spendCredits(cost)) {
    currentUpgrades[upgradeId] = currentTier + 1;
    saveTechUpgrades(currentUpgrades);
    return true;
  }
  return false;
};

// ==========================================
// COMMANDER'S REWARDS & ARSENAL COSMETICS
// ==========================================

const COMMANDER_COSMETICS_KEY = 'aether_surge_commander_cosmetics';
const COMMANDER_EQUIPPED_KEY = 'aether_surge_commander_equipped';
const COMMANDER_MEGA_STATS_KEY = 'aether_surge_commander_mega_stats';

export const INITIAL_COMMANDER_COSMETICS: CommanderCosmetic[] = [
  // --- FLIGHT SHIP TRAILS ---
  {
    id: 'trail_supernova',
    name: 'Solar Supernova',
    type: 'TRAIL',
    tier: 'FLAWLESS',
    healthRequirementLabel: 'Mega Boss Defeat with ≥80% Hull',
    rarity: 'LEGENDARY',
    description: 'Blinding white-gold stellar plasma trail discharging radiant solar flares and diamond starburst sparks.',
    previewColor: '#fbbf24',
    accentColor: '#ffffff',
    unlocked: false,
  },
  {
    id: 'trail_void',
    name: 'Quantum Void Rift',
    type: 'TRAIL',
    tier: 'HARDENED',
    healthRequirementLabel: 'Mega Boss Defeat with 40%–79% Hull',
    rarity: 'EPIC',
    description: 'Tachyonic ultraviolet dimensional rift trailing amethyst antimatter vortices and shifting cosmic stardust.',
    previewColor: '#a855f7',
    accentColor: '#ec4899',
    unlocked: false,
  },
  {
    id: 'trail_berserker',
    name: 'Infernal Berserker',
    type: 'TRAIL',
    tier: 'CRITICAL',
    healthRequirementLabel: 'Mega Boss Defeat with <40% Hull',
    rarity: 'RARE',
    description: 'Volatile hellfire exhaust surging with crackling fiery cinder embers, molten shrapnel, and dark plume smoke.',
    previewColor: '#ef4444',
    accentColor: '#f97316',
    unlocked: false,
  },
  {
    id: 'trail_emerald_hyper',
    name: 'Aether Emerald Surge',
    type: 'TRAIL',
    tier: 'HARDENED',
    healthRequirementLabel: 'Mega Boss Defeat with 40%–79% Hull',
    rarity: 'EPIC',
    description: 'Hyper-luminescent jade energy flow that radiates crystalline shockwave halos and neon plasma contrails.',
    previewColor: '#10b981',
    accentColor: '#6ee7b7',
    unlocked: false,
  },

  // --- WEAPON EFFECTS ---
  {
    id: 'weapon_prismatic',
    name: 'Prismatic Radiant Lance',
    type: 'WEAPON',
    tier: 'FLAWLESS',
    healthRequirementLabel: 'Mega Boss Defeat with ≥80% Hull',
    rarity: 'LEGENDARY',
    description: 'High-density auric golden-white hyper-plasma beams with shimmering solar coronas and celestial spark bursts.',
    previewColor: '#fde047',
    accentColor: '#ffffff',
    unlocked: false,
  },
  {
    id: 'weapon_tachyon',
    name: 'Tachyon Singularity',
    type: 'WEAPON',
    tier: 'HARDENED',
    healthRequirementLabel: 'Mega Boss Defeat with 40%–79% Hull',
    rarity: 'EPIC',
    description: 'Dual-frequency resonant violet-cyan plasma bolts that generate micro-gravitational warp rings in flight.',
    previewColor: '#c084fc',
    accentColor: '#38bdf8',
    unlocked: false,
  },
  {
    id: 'weapon_bloodfire',
    name: 'Crimson Bloodfire',
    type: 'WEAPON',
    tier: 'CRITICAL',
    healthRequirementLabel: 'Mega Boss Defeat with <40% Hull',
    rarity: 'RARE',
    description: 'Jagged searing blood-crimson antimatter shells discharging crackling scarlet lightning arcs and explosive heatwaves.',
    previewColor: '#dc2626',
    accentColor: '#f59e0b',
    unlocked: false,
  },
  {
    id: 'weapon_chronos_phase',
    name: 'Chronos Phase Projector',
    type: 'WEAPON',
    tier: 'FLAWLESS',
    healthRequirementLabel: 'Mega Boss Defeat with ≥80% Hull',
    rarity: 'LEGENDARY',
    description: 'Quantum temporal displacement bolts radiating chromatic cyan-rose distortion trails that slice through spacetime.',
    previewColor: '#06b6d4',
    accentColor: '#f43f5e',
    unlocked: false,
  },
];

export const getStoredCosmetics = (): CommanderCosmetic[] => {
  try {
    const raw = localStorage.getItem(COMMANDER_COSMETICS_KEY);
    if (raw) {
      const parsed: CommanderCosmetic[] = JSON.parse(raw);
      // Merge with initial catalog to ensure any newly added cosmetics are included
      return INITIAL_COMMANDER_COSMETICS.map((initial) => {
        const found = parsed.find((p) => p.id === initial.id);
        return found ? { ...initial, ...found } : initial;
      });
    }
  } catch {
    // fallback
  }
  return INITIAL_COMMANDER_COSMETICS;
};

export const saveStoredCosmetics = (cosmetics: CommanderCosmetic[]) => {
  try {
    localStorage.setItem(COMMANDER_COSMETICS_KEY, JSON.stringify(cosmetics));
  } catch {
    // ignore
  }
};

export const getEquippedCosmetics = (): CommanderEquipped => {
  try {
    const raw = localStorage.getItem(COMMANDER_EQUIPPED_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return { trailId: null, weaponId: null };
};

export const saveEquippedCosmetics = (equipped: CommanderEquipped) => {
  try {
    localStorage.setItem(COMMANDER_EQUIPPED_KEY, JSON.stringify(equipped));
  } catch {
    // ignore
  }
};

export const unlockCommanderCosmetic = (id: string): CommanderCosmetic | null => {
  const list = getStoredCosmetics();
  const target = list.find((c) => c.id === id);
  if (target) {
    target.unlocked = true;
    target.unlockedAt = Date.now();
    saveStoredCosmetics(list);
    return target;
  }
  return null;
};

export interface MegaBossRecordStats {
  kills: number;
  bestHealthPercent: number;
  lastDefeatedAt?: number;
}

export const getMegaBossStats = (): MegaBossRecordStats => {
  try {
    const raw = localStorage.getItem(COMMANDER_MEGA_STATS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return { kills: 0, bestHealthPercent: 0 };
};

export const recordMegaBossKill = (healthPercent: number): MegaBossRecordStats => {
  try {
    const stats = getMegaBossStats();
    stats.kills += 1;
    stats.bestHealthPercent = Math.max(stats.bestHealthPercent, Math.round(healthPercent));
    stats.lastDefeatedAt = Date.now();
    localStorage.setItem(COMMANDER_MEGA_STATS_KEY, JSON.stringify(stats));
    return stats;
  } catch {
    return { kills: 1, bestHealthPercent: Math.round(healthPercent) };
  }
};

export const awardCommanderReward = (
  healthPercent: number,
  bossName: string = 'MEGA TITAN "NEXUS-OMEGA"'
): CommanderRewardResult => {
  const roundedHp = Math.max(1, Math.min(100, Math.round(healthPercent)));
  recordMegaBossKill(roundedHp);

  // Determine performance tier based on remaining health
  let tier: CosmeticTier = 'HARDENED';
  if (roundedHp >= 80) {
    tier = 'FLAWLESS';
  } else if (roundedHp < 40) {
    tier = 'CRITICAL';
  }

  const cosmetics = getStoredCosmetics();

  // Find cosmetics matching this tier
  const tierCandidates = cosmetics.filter((c) => c.tier === tier);
  const unearnedInTier = tierCandidates.filter((c) => !c.unlocked);

  let selectedCosmetic: CommanderCosmetic;
  let isNewUnlock = false;

  if (unearnedInTier.length > 0) {
    // Prefer unearned cosmetic in this tier
    selectedCosmetic = unearnedInTier[0];
    selectedCosmetic.unlocked = true;
    selectedCosmetic.unlockedAt = Date.now();
    isNewUnlock = true;
  } else {
    // If all in this tier are unlocked, check other unearned cosmetics across any tier
    const anyUnearned = cosmetics.filter((c) => !c.unlocked);
    if (anyUnearned.length > 0) {
      selectedCosmetic = anyUnearned[0];
      selectedCosmetic.unlocked = true;
      selectedCosmetic.unlockedAt = Date.now();
      isNewUnlock = true;
    } else {
      // All unlocked! Return signature cosmetic for this tier
      selectedCosmetic = tierCandidates[0] || cosmetics[0];
      isNewUnlock = false;
    }
  }

  // Save changes
  saveStoredCosmetics(cosmetics);

  // Award Aether Credits bounty for slaying the Mega Boss!
  const creditsBonus = isNewUnlock ? 800 : 1500;
  addCredits(creditsBonus);

  return {
    cosmetic: selectedCosmetic,
    isNewUnlock,
    playerHealthPercent: roundedHp,
    tier,
    bossName,
    creditsBonus,
  };
};

