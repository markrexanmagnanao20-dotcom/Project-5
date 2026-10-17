/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EnemyType } from '../types/game';

export interface BestiaryEntry {
  id: EnemyType;
  codename: string;
  designation: string;
  category: 'RECON' | 'SWARM' | 'HAZARD' | 'CAPITAL' | 'SNIPER' | 'TITAN';
  threatLevel: 1 | 2 | 3 | 4 | 5;
  threatLabel: string;
  threatBadgeColor: string;
  accentColor: string;
  firstEncounteredWave: number;
  stats: {
    baseHealth: number;
    speedRating: number; // 1-10
    firepowerRating: number; // 1-10
    rangeRating: number; // 1-10
    threatRating: number; // 1-10
    scoreBounty: number;
    crystalYield: number;
  };
  armament: string[];
  tacticalBehavior: string;
  primaryWeakness: string;
  recommendedCounter: string;
  lore: string;
  dossierNotes: string[];
}

export const BESTIARY_ENTRIES: Record<EnemyType, BestiaryEntry> = {
  SCOUT: {
    id: 'SCOUT',
    codename: 'VX-4 "Viper"',
    designation: 'Autonomous Raider Interceptor',
    category: 'RECON',
    threatLevel: 2,
    threatLabel: 'CLASS II · RAPID INTERCEPTOR',
    threatBadgeColor: 'border-orange-500/40 text-orange-400 bg-orange-950/30',
    accentColor: '#f97316',
    firstEncounteredWave: 1,
    stats: {
      baseHealth: 20,
      speedRating: 7,
      firepowerRating: 4,
      rangeRating: 5,
      threatRating: 4,
      scoreBounty: 100,
      crystalYield: 12,
    },
    armament: [
      'Twin Pulse Lasers (Forward-Mount)',
      'Sub-Warp Vector Ion Afterburners',
      'Target Acquisition Sensor Suite',
    ],
    tacticalBehavior:
      'Pursues player vessels in wide parabolic attack vectors, maintaining standoff distance before initiating high-speed strafing runs with medium-velocity plasma bolts.',
    primaryWeakness:
      'Fragile unshielded cockpit canopy and vulnerable engine manifolds. Readily decimated by standard pulse fire or piercing rail bursts.',
    recommendedCounter:
      'Valkyrie twin plasma blasters or Titan railgun piercing rounds. Lead target lead-line during turnarounds.',
    lore:
      'First spotted along the fringes of the Kuiper perimeter, the VX-4 "Viper" is the standard reconnaissance craft of the rogue Corsair fleets. Manufactured in clandestine orbital drydocks using repurposed colonial patrol frames, these agile scavengers prioritize speed and hit-and-run tactics over heavy armor.',
    dossierNotes: [
      'Overheating issues observed in engine thruster cowlings when engaged in prolonged pursuit.',
      'Piloted by cybernetically augmented pirate conscripts or basic semi-sentient neural combat chips.',
      'Drops moderate Aether Shard quantities upon hull breach.',
    ],
  },

  SWARMER: {
    id: 'SWARMER',
    codename: 'K-9 "Locust"',
    designation: 'Sub-Warp Micro-Kamikaze Drone',
    category: 'SWARM',
    threatLevel: 2,
    threatLabel: 'CLASS II · BIO-MECHANICAL SWARM',
    threatBadgeColor: 'border-rose-500/40 text-rose-400 bg-rose-950/30',
    accentColor: '#ef4444',
    firstEncounteredWave: 1,
    stats: {
      baseHealth: 18,
      speedRating: 9,
      firepowerRating: 5,
      rangeRating: 2,
      threatRating: 5,
      scoreBounty: 120,
      crystalYield: 10,
    },
    armament: [
      'Reinforced Reactive Ramming Prow',
      'Volatile Micro-Matter Detonation Core',
      'High-G Magnetic Thruster Jets',
    ],
    tacticalBehavior:
      'Spawns in tight triangular apex formations. Coordinates through localized hive-link telemetrics to execute hyper-accelerated intercept vectors directly into target cockpits.',
    primaryWeakness:
      'Zero point-defense shielding and ultralight carbon-composite airframe. Prone to mass chain reactions when caught in EMP shockwaves or wide spread shot patterns.',
    recommendedCounter:
      'Valkyrie EMP Shockwave or Overcharge Spread Fire arrays. Never allow a cluster to box in your thrusters.',
    lore:
      'Originally designed as micro-mining excavation drones, thousands of "Locust" units were hijacked and reprogrammed during the Third Outer Rim Uprising. Stripped of tool attachments and loaded with unstable volatile payloads, they operate as expendable guided torpedoes.',
    dossierNotes: [
      'High turn rate makes evasive maneuvers difficult in narrow cosmic lanes.',
      'Detonation occurs instantly upon proximity contact with player shields or hull.',
      'Vulnerable to rapid weapon spray and orbital defense drones.',
    ],
  },

  ASTEROID: {
    id: 'ASTEROID',
    codename: 'C-72 "Chondrite"',
    designation: 'Aether-Infused Mineral Cluster',
    category: 'HAZARD',
    threatLevel: 1,
    threatLabel: 'CLASS I · DENSE KINETIC HAZARD',
    threatBadgeColor: 'border-slate-500/40 text-slate-300 bg-slate-900/50',
    accentColor: '#94a3b8',
    firstEncounteredWave: 1,
    stats: {
      baseHealth: 50,
      speedRating: 3,
      firepowerRating: 6,
      rangeRating: 1,
      threatRating: 3,
      scoreBounty: 240,
      crystalYield: 24,
    },
    armament: [
      'Hyper-Dense Silicate-Iron Crust',
      'Unstable Volatile Core Resonators',
      'Kinetic Shrapnel Ejection upon Fracture',
    ],
    tacticalBehavior:
      'Drifts inertly across cosmic gravitational currents. Upon taking catastrophic ballistic damage, large asteroids splinter into two smaller, high-velocity fragmented shards.',
    primaryWeakness:
      'Zero evasive propulsion or ranged countermeasures. Predictable ballistic trajectory makes target acquisition effortless.',
    recommendedCounter:
      'Shatter from long range before entering close-quarters dogfights. Graviton Harvester upgrade will vacuum up the resulting dense crystal yields.',
    lore:
      'Formed billions of years ago in the protoplanetary accretion disks of dying stars, these crystalline asteroids have absorbed centuries of ambient Aether radiation. While natural hazards rather than hostile combatants, their immense mass will crush ship plating upon direct collision.',
    dossierNotes: [
      'Splits into Tier 2 and Tier 3 fragments upon hull destruction.',
      'Provides the highest concentration of Aether Shard crystals per unit volume.',
      'Can be used strategically as physical cover against incoming enemy plasma fire.',
    ],
  },

  CRUISER: {
    id: 'CRUISER',
    codename: 'NX-80 "Goliath"',
    designation: 'Armored Siege Gunship',
    category: 'CAPITAL',
    threatLevel: 4,
    threatLabel: 'CLASS IV · HEAVY ARTILLERY DREAD',
    threatBadgeColor: 'border-purple-500/40 text-purple-400 bg-purple-950/30',
    accentColor: '#a855f7',
    firstEncounteredWave: 3,
    stats: {
      baseHealth: 80,
      speedRating: 4,
      firepowerRating: 8,
      rangeRating: 7,
      threatRating: 8,
      scoreBounty: 350,
      crystalYield: 35,
    },
    armament: [
      'Heavy Dual Plasma Battery Cannons',
      'Point-Defense Ablative Plating',
      'Twin High-Discharge Antimatter Thrusters',
    ],
    tacticalBehavior:
      'Orbits combat zones with calculated tactical precision, locking onto player movement before unleashing concentrated dual volleys of heavy violet plasma orbs.',
    primaryWeakness:
      'Sluggish rotation speed and large physical hitbox. Vulnerable to rear flank strafes and sustained piercing railgun fire.',
    recommendedCounter:
      'Titan Plasma Siege Barrage or Chronos Tachyon Time-Warp to flank behind their primary firing arc.',
    lore:
      'The NX-80 "Goliath" serves as the command anchor for hostile strike groups. Constructed with thick durasteel composite bulkheads capable of absorbing direct torpedo strikes, these gunships are deployed to blockade planetary jump gates and enforce hostile space superiority.',
    dossierNotes: [
      'Dual broadside plasma cannons fire simultaneous high-damage energy shells.',
      'Employs high-power engine nacelles with noticeable charging glow before firing.',
      'Defeating Cruisers grants significant score multipliers and abundant shard harvests.',
    ],
  },

  SNIPER: {
    id: 'SNIPER',
    codename: 'TR-7 "Phantom"',
    designation: 'Tachyon Long-Range Rail Craft',
    category: 'SNIPER',
    threatLevel: 4,
    threatLabel: 'CLASS IV · PRECISION RAIL MARKS-CRAFT',
    threatBadgeColor: 'border-emerald-500/40 text-emerald-400 bg-emerald-950/30',
    accentColor: '#34d399',
    firstEncounteredWave: 4,
    stats: {
      baseHealth: 35,
      speedRating: 5,
      firepowerRating: 9,
      rangeRating: 10,
      threatRating: 7,
      scoreBounty: 250,
      crystalYield: 25,
    },
    armament: [
      'High-Flux Electromagnetic Rail Lance',
      'Targeting Laser Collimator with Trajectory Beam',
      'Stealth Composite Sensor-Absorbing Skin',
    ],
    tacticalBehavior:
      'Positions on the perimeter edge of the tactical radar. Projects an emerald targeting laser indicating line of sight before discharging an extreme-velocity hyper-piercing slug.',
    primaryWeakness:
      'Extended weapon recharge cycle and fragile internal capacitors. Leaves itself completely defenseless for several seconds following discharge.',
    recommendedCounter:
      'Watch for the green targeting laser line and perform a high-speed dash perpendicular to the shot right before discharge.',
    lore:
      'Engineered by renegade sniper divisions, the TR-7 "Phantom" is designed for surgical assassination of fleet commanders. Its spinal-mounted rail lance accelerates ionized tungsten projectiles to near-relativistic speeds, enabling it to penetrate multi-layered forcefields effortlessly.',
    dossierNotes: [
      'Visible targeting beam locks in position 0.5s prior to slug discharge.',
      'Extremely dangerous during chaotic swarms when radar awareness is compromised.',
      'Destroy immediately upon detection to maintain clear combat maneuvering airspace.',
    ],
  },

  BOSS: {
    id: 'BOSS',
    codename: 'OMEGA-TITAN "Gorgon"',
    designation: 'Planetary Siegewalker Dreadnought',
    category: 'TITAN',
    threatLevel: 5,
    threatLabel: 'CLASS V · OMEGA CAPITAL DREADNOUGHT',
    threatBadgeColor: 'border-rose-600 text-rose-300 bg-rose-950/50 shadow-rose-950/60 shadow-lg',
    accentColor: '#e11d48',
    firstEncounteredWave: 5,
    stats: {
      baseHealth: 450,
      speedRating: 4,
      firepowerRating: 10,
      rangeRating: 9,
      threatRating: 10,
      scoreBounty: 2500,
      crystalYield: 150,
    },
    armament: [
      'Octagonal Tachyon Core Cannon (8-Way Radial Barrage)',
      'High-Density Magnetic Forcefield Generators',
      'Multi-Phase Micro-Missile Dispersion Pods',
      'Heavy Kinetic Ram Battering Horns',
    ],
    tacticalBehavior:
      'Dominates the combat sector with colossal spatial presence. Cycles between multi-directional spiral bullet hell patterns, aimed high-density plasma salvos, and sudden high-thrust ramming dashes.',
    primaryWeakness:
      'Pulsating central power core glows brightly during heavy attack phases. Sustained concentrated weapon fire on the core destabilizes internal flux generators.',
    recommendedCounter:
      'Save special abilities (EMP Shockwave, Siege Barrage, Time-Warp) specifically for the boss phase. Maintain orbital circling distance.',
    lore:
      'The OMEGA-TITAN "Gorgon" is a planetary-class superdreadnought, feared across every civilized star system. Powered by an enslaved singularity core and armored in dark antimatter-forged composite plates, a single Gorgon is capable of blockading an entire stellar colony. Its arrival is marked by ion storms and cosmic nebula flares.',
    dossierNotes: [
      'Possesses massive durability scaling with wave progression and sector difficulty.',
      'Unleashes catastrophic 360-degree radial barrage patterns requiring pinpoint evasion.',
      'Destruction yields immense score bonus and massive shower of radiant Aether crystals.',
    ],
  },
};
