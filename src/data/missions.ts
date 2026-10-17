/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DailyMission, DailyMissionsData, MissionCategory, MissionProgressType } from '../types/game';

export interface MissionTemplate {
  id: string;
  title: string;
  description: string;
  category: MissionCategory;
  progressType: MissionProgressType;
  target: number;
  rewardCredits: number;
  icon: string;
}

export const MISSION_TEMPLATES: MissionTemplate[] = [
  // --- COMBAT DIRECTIVES ---
  {
    id: 'combat_eradication',
    title: 'Vanguard Extermination',
    description: 'Vaporize 35 hostile vessels across active combat sorties.',
    category: 'COMBAT',
    progressType: 'KILLS',
    target: 35,
    rewardCredits: 300,
    icon: 'Crosshair',
  },
  {
    id: 'combat_heavy_swarm',
    title: 'Swarm Suppression',
    description: 'Obliterate 60 enemy units in fleet skirmishes.',
    category: 'COMBAT',
    progressType: 'KILLS',
    target: 60,
    rewardCredits: 450,
    icon: 'Flame',
  },
  {
    id: 'combat_elites',
    title: 'Apex Hunter',
    description: 'Destroy 3 heavy Cruisers, Emerald Snipers, or Titan Dreadnoughts.',
    category: 'COMBAT',
    progressType: 'ELITE_KILLS',
    target: 3,
    rewardCredits: 400,
    icon: 'Skull',
  },
  {
    id: 'combat_special_detonations',
    title: 'Tactical Overdrive',
    description: 'Unleash 3 Tactical Ultimate abilities in the heat of combat.',
    category: 'COMBAT',
    progressType: 'SPECIALS',
    target: 3,
    rewardCredits: 250,
    icon: 'Zap',
  },

  // --- COLLECTION DIRECTIVES ---
  {
    id: 'collect_aether_harvest',
    title: 'Aether Resonance',
    description: 'Harvest 45 glowing energy crystals from defeated hostiles.',
    category: 'COLLECTION',
    progressType: 'CRYSTALS',
    target: 45,
    rewardCredits: 250,
    icon: 'Gem',
  },
  {
    id: 'collect_crystal_surge',
    title: 'Deep Core Siphon',
    description: 'Extract 80 radiant energy crystals during sorties.',
    category: 'COLLECTION',
    progressType: 'CRYSTALS',
    target: 80,
    rewardCredits: 350,
    icon: 'Sparkles',
  },

  // --- MASTERY DIRECTIVES ---
  {
    id: 'mastery_combo_chain',
    title: 'Kinetic Momentum',
    description: 'Achieve an unbroken 10x combat combo chain.',
    category: 'MASTERY',
    progressType: 'MAX_COMBO',
    target: 10,
    rewardCredits: 300,
    icon: 'Zap',
  },
  {
    id: 'mastery_hyper_combo',
    title: 'Overcharge Cascade',
    description: 'Reach a blistering 15x combat combo multiplier.',
    category: 'MASTERY',
    progressType: 'MAX_COMBO',
    target: 15,
    rewardCredits: 450,
    icon: 'Flame',
  },
  {
    id: 'mastery_evasive_maneuvers',
    title: 'Slipstream Pilot',
    description: 'Execute 15 high-speed tactical dashes to evade incoming fire.',
    category: 'MASTERY',
    progressType: 'DASHES',
    target: 15,
    rewardCredits: 220,
    icon: 'Gauge',
  },
  {
    id: 'mastery_high_score',
    title: 'Sector Highmark',
    description: 'Score 12,000 or more points in a single combat run.',
    category: 'MASTERY',
    progressType: 'SCORE',
    target: 12000,
    rewardCredits: 350,
    icon: 'Trophy',
  },
  {
    id: 'mastery_arsenal_tuning',
    title: 'Modular Superiority',
    description: 'Acquire 5 module upgrades during active engagements.',
    category: 'MASTERY',
    progressType: 'UPGRADES',
    target: 5,
    rewardCredits: 250,
    icon: 'Shield',
  },

  // --- SURVIVAL DIRECTIVES ---
  {
    id: 'survival_deep_orbit',
    title: 'Deep Void Penetration',
    description: 'Survive hostile onslaught up to Wave 4 in any mode.',
    category: 'SURVIVAL',
    progressType: 'SURVIVE_WAVE',
    target: 4,
    rewardCredits: 320,
    icon: 'Shield',
  },
  {
    id: 'survival_stellar_horizon',
    title: 'Beyond the Veil',
    description: 'Reach Wave 6 through dangerous enemy warps.',
    category: 'SURVIVAL',
    progressType: 'SURVIVE_WAVE',
    target: 6,
    rewardCredits: 500,
    icon: 'Target',
  },
];

/**
 * Returns today's date formatted as YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Deterministic pseudo-random number generator for a date string
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Generates 3 diverse daily missions for the specified date string.
 * Ensures missions come from distinct categories or have diverse objectives.
 */
export function generateDailyMissionsForDate(dateStr: string): DailyMissionsData {
  const seed = hashString(dateStr);
  const pool = [...MISSION_TEMPLATES];

  // Simple seeded shuffle
  const shuffled: MissionTemplate[] = [];
  let s = seed;
  while (pool.length > 0) {
    s = (s * 9301 + 49297) % 233280;
    const index = Math.floor((s / 233280) * pool.length);
    shuffled.push(pool.splice(index, 1)[0]);
  }

  // Pick 3 missions with category diversity (prefer unique categories if possible)
  const selected: MissionTemplate[] = [];
  const categoriesSeen = new Set<MissionCategory>();

  // Pass 1: pick from distinct categories
  for (const template of shuffled) {
    if (selected.length >= 3) break;
    if (!categoriesSeen.has(template.category)) {
      selected.push(template);
      categoriesSeen.add(template.category);
    }
  }

  // Pass 2: fill remaining slots if < 3
  if (selected.length < 3) {
    for (const template of shuffled) {
      if (selected.length >= 3) break;
      if (!selected.some((m) => m.id === template.id)) {
        selected.push(template);
      }
    }
  }

  const missions: DailyMission[] = selected.map((template, idx) => ({
    id: `mission_${dateStr}_${template.id}_${idx}`,
    templateId: template.id,
    title: template.title,
    description: template.description,
    category: template.category,
    progressType: template.progressType,
    target: template.target,
    current: 0,
    rewardCredits: template.rewardCredits,
    completed: false,
    claimed: false,
    icon: template.icon,
  }));

  return {
    date: dateStr,
    missions,
    allCompletedBonusClaimed: false,
    bonusReward: 500, // +500 Credits completion bonus
  };
}

/**
 * Formats time until next local midnight
 */
export function getTimeUntilMidnight(): { hours: number; minutes: number; seconds: number; formatted: string } {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  const diffMs = Math.max(0, tomorrow.getTime() - now.getTime());

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  const formatted = `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;

  return { hours, minutes, seconds, formatted };
}
