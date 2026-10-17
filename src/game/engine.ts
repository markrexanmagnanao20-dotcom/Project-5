/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Achievement,
  DailyMission,
  Drone,
  Enemy,
  EnemyType,
  FloatText,
  GameMode,
  GameStats,
  Particle,
  PlayerState,
  Projectile,
  ShipId,
  UpgradeOption,
  VideoSettings,
  XpShard,
  BossWarningEvent,
  CommanderRewardResult,
  WaveTransitionEvent,
} from '../types/game';
import { ALL_UPGRADES, SHIPS } from './constants';
import { sound } from '../services/soundEffects';
import { getSectorForWave } from './cosmos';
import {
  getStoredTechUpgrades,
  recordEnemyEncounter,
  recordEnemyKill,
  updateDailyMissionProgress,
  awardCommanderReward,
  getEquippedCosmetics,
} from '../services/storage';
import { ScreenShakeManager } from './ScreenShakeManager';

export class GameEngine {
  public player!: PlayerState;
  public readonly screenShake: ScreenShakeManager = new ScreenShakeManager();
  public enemies: Enemy[] = [];
  public projectiles: Projectile[] = [];
  public particles: Particle[] = [];
  public shards: XpShard[] = [];
  public bossWarningEvent: BossWarningEvent | null = null;
  public equippedTrail: string | null = null;
  public equippedWeapon: string | null = null;
  public currentSectorId: number = 1;
  private onCommanderRewardCallback?: (reward: CommanderRewardResult) => void;
  private onWaveTransitionCallback?: (event: WaveTransitionEvent) => void;

  public setCommanderRewardCallback(cb: (reward: CommanderRewardResult) => void) {
    this.onCommanderRewardCallback = cb;
  }

  public setWaveTransitionCallback(cb: (event: WaveTransitionEvent) => void) {
    this.onWaveTransitionCallback = cb;
  }

  public updateCosmetics(trailId: string | null, weaponId: string | null) {
    this.equippedTrail = trailId;
    this.equippedWeapon = weaponId;
  }

  public getCurrentSector() {
    return getSectorForWave(this.stats.wave, this.gameMode);
  }

  public hasBossActive() {
    return this.enemies.some((e) => e.type === 'BOSS');
  }

  public get activeBoss(): Enemy | undefined {
    return this.enemies.find((e) => e.type === 'BOSS');
  }
  public floatTexts: FloatText[] = [];
  public drones: Drone[] = [];
  public stats!: GameStats;
  public width: number = 800;
  public height: number = 600;
  public aimAngle: number = 0;
  public isFiring: boolean = false;
  public activeUpgrades: Record<string, number> = {};
  public gameMode: GameMode = 'ENDLESS';

  private waveTimer: number = 0;
  private waveSpawnIndex: number = 0;
  private waveQueue: { type: EnemyType; delay: number }[] = [];
  private bossSpawnedThisWave: boolean = false;
  private idCounter: number = 0;
  private onLevelUpCallback?: (options: UpgradeOption[]) => void;
  private onGameOverCallback?: () => void;
  private onAchievementUnlockedCallback?: (ach: Achievement) => void;
  private onMissionCompleteCallback?: (mission: DailyMission) => void;
  private achievements: Achievement[] = [];
  private videoSettings: VideoSettings;

  constructor(
    width: number,
    height: number,
    achievements: Achievement[],
    videoSettings: VideoSettings
  ) {
    this.width = width;
    this.height = height;
    this.achievements = achievements;
    this.videoSettings = videoSettings;
    this.reset('valkyrie', 'ENDLESS');
  }

  public setCallbacks(
    onLevelUp: (options: UpgradeOption[]) => void,
    onGameOver: () => void,
    onAchievementUnlocked: (ach: Achievement) => void,
    onMissionComplete?: (mission: DailyMission) => void
  ) {
    this.onLevelUpCallback = onLevelUp;
    this.onGameOverCallback = onGameOver;
    this.onAchievementUnlockedCallback = onAchievementUnlocked;
    this.onMissionCompleteCallback = onMissionComplete;
  }

  public notifyMissions(newlyCompleted: DailyMission[]) {
    if (!newlyCompleted || newlyCompleted.length === 0) return;
    for (const m of newlyCompleted) {
      sound.playMissionComplete();
      this.spawnFloatText(
        this.width / 2,
        this.height * 0.28,
        `DIRECTIVE COMPLETE: ${m.title} (+${m.rewardCredits} AC)`,
        '#38bdf8'
      );
      if (this.onMissionCompleteCallback) {
        this.onMissionCompleteCallback(m);
      }
    }
  }

  public setVideoSettings(settings: VideoSettings) {
    this.videoSettings = settings;
    this.screenShake.setEnabled(settings.screenShake);
  }

  public resize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  public reset(shipId: ShipId, mode: GameMode = 'ENDLESS') {
    this.gameMode = mode;
    this.bossWarningEvent = null;
    this.screenShake.reset();
    const config = SHIPS[shipId] || SHIPS.valkyrie;

    this.player = {
      x: this.width / 2,
      y: this.height / 2,
      vx: 0,
      vy: 0,
      angle: 0,
      health: config.stats.health,
      maxHealth: config.stats.health,
      shield: config.stats.shield,
      maxShield: config.stats.shield,
      shieldRechargeTimer: 0,
      dashCooldown: 0,
      maxDashCooldown: 1.0,
      isDashing: false,
      dashDuration: 0,
      specialMeter: 0,
      maxSpecialMeter: 100,
      fireCooldown: 0,
      invulnerableTimer: 0,
      shipId: shipId,
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      speed: config.stats.speed,
      damageMultiplier: 1,
      fireRateMultiplier: 1,
      spreadCount: 1,
      hasPiercing: false,
      homingCount: 0,
      homingTimer: 0,
      droneCount: 0,
      magnetRadius: 100,
      empCooldown: 0,
      timeFreezeTimer: 0,
    };

    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.shards = [];
    this.floatTexts = [];
    this.drones = [];
    this.activeUpgrades = {};

    this.stats = {
      score: 0,
      highScore: 0,
      wave: 1,
      enemiesDefeated: 0,
      crystalsCollected: 0,
      shotsFired: 0,
      shotsHit: 0,
      maxCombo: 1,
      currentCombo: 1,
      comboTimer: 0,
      comboMultiplier: 1.0,
      timeSurvived: 0,
      megaBossesDefeated: 0,
    };

    // Load active commander cosmetics
    const equipped = getEquippedCosmetics();
    this.equippedTrail = equipped.trailId;
    this.equippedWeapon = equipped.weaponId;

    if (mode === 'OVERDRIVE') {
      this.player.fireRateMultiplier = 1.8;
      this.player.damageMultiplier = 1.25;
    }

    // Apply Armory / Tech Foundry permanent upgrades
    const tech = getStoredTechUpgrades();
    if (tech.hull_plating) {
      const bonus = tech.hull_plating * 15;
      this.player.maxHealth += bonus;
      this.player.health += bonus;
    }
    if (tech.tachyon_thrusters) {
      this.player.speed += tech.tachyon_thrusters * 0.4;
    }
    if (tech.crystal_magnet) {
      this.player.magnetRadius += tech.crystal_magnet * 30;
    }
    if (tech.overcharge_core) {
      this.player.specialMeter = Math.min(this.player.maxSpecialMeter, tech.overcharge_core * 15);
    }

    this.startWave(1);
  }

  public update(dt: number, moveVector: { x: number; y: number }, aimVector: { x: number; y: number } | null, fire: boolean): { shakeIntensity: number } {
    let requestedShake = 0;

    // Time elapsed in survival
    this.stats.timeSurvived += dt;

    // Aim calculation
    if (aimVector && (aimVector.x !== 0 || aimVector.y !== 0)) {
      this.aimAngle = Math.atan2(aimVector.y, aimVector.x);
    } else if (moveVector.x !== 0 || moveVector.y !== 0) {
      this.aimAngle = Math.atan2(moveVector.y, moveVector.x);
    }
    this.isFiring = fire || this.videoSettings.autoFire;

    // 1. Time Freeze check
    const effectiveDt = this.player.timeFreezeTimer > 0 ? dt * 0.35 : dt;
    if (this.player.timeFreezeTimer > 0) {
      this.player.timeFreezeTimer = Math.max(0, this.player.timeFreezeTimer - dt);
    }

    // 2. Player Movement & Physics
    this.updatePlayer(dt, moveVector);

    // 3. Player Firing & Weapons
    this.updateWeapons(dt);

    // 4. Update Orbital Drones
    this.updateDrones(dt);

    // 5. Update Projectiles
    this.updateProjectiles(effectiveDt);

    // 6. Update Enemies & Spawning
    this.updateWave(effectiveDt);
    const enemyShake = this.updateEnemies(effectiveDt);
    if (enemyShake > requestedShake) requestedShake = enemyShake;

    // 7. Collisions
    const collisionShake = this.handleCollisions();
    if (collisionShake > requestedShake) requestedShake = collisionShake;

    // 8. Update XP Shards & Magnet
    this.updateShards(dt);

    // 9. Update Combo Decay
    this.updateCombo(dt);

    // 10. Update Particles & Floating Text
    this.updateParticlesAndText(dt);

    // 11. Advance Screen Shake vibration physics
    const shakeOffsets = this.screenShake.update(effectiveDt);

    // 12. Advance Boss Sub-Phase Warning Timer
    if (this.bossWarningEvent) {
      this.bossWarningEvent.timer -= effectiveDt;
      if (this.bossWarningEvent.timer <= 0) {
        this.bossWarningEvent = null;
      }
    }

    // Check achievement progress
    this.checkAchievements();

    return { shakeIntensity: shakeOffsets.trauma };
  }

  private updatePlayer(dt: number, moveVector: { x: number; y: number }) {
    const p = this.player;

    // Dash state
    if (p.isDashing) {
      p.dashDuration -= dt;
      if (p.dashDuration <= 0) {
        p.isDashing = false;
      }
    }
    if (p.dashCooldown > 0) {
      p.dashCooldown = Math.max(0, p.dashCooldown - dt);
    }

    // Shield Recharge
    if (p.shield < p.maxShield) {
      p.shieldRechargeTimer += dt;
      if (p.shieldRechargeTimer >= 3.0) {
        p.shield = Math.min(p.maxShield, p.shield + 18 * dt);
      }
    }

    // Invulnerability timer
    if (p.invulnerableTimer > 0) {
      p.invulnerableTimer = Math.max(0, p.invulnerableTimer - dt);
    }

    // Acceleration & Inertia
    const moveLen = Math.hypot(moveVector.x, moveVector.y);
    const accel = p.isDashing ? p.speed * 45 : p.speed * 20;

    if (moveLen > 0.05) {
      const nx = moveVector.x / moveLen;
      const ny = moveVector.y / moveLen;
      p.vx += nx * accel * dt;
      p.vy += ny * accel * dt;
    }

    // Drag / Friction
    const drag = p.isDashing ? 0.96 : 0.88;
    p.vx *= Math.pow(drag, dt * 60);
    p.vy *= Math.pow(drag, dt * 60);

    // Apply movement
    p.x += p.vx * dt * 60;
    p.y += p.vy * dt * 60;

    // Arena Clamping with soft bounce
    const pad = 24;
    if (p.x < pad) {
      p.x = pad;
      p.vx = -p.vx * 0.4;
    } else if (p.x > this.width - pad) {
      p.x = this.width - pad;
      p.vx = -p.vx * 0.4;
    }
    if (p.y < pad) {
      p.y = pad;
      p.vy = -p.vy * 0.4;
    } else if (p.y > this.height - pad) {
      p.y = this.height - pad;
      p.vy = -p.vy * 0.4;
    }

    // Fading particle trails behind player starship thrusters
    this.emitPlayerThrusterTrails(dt);
  }

  private emitPlayerThrusterTrails(dt: number) {
    const p = this.player;
    const speed = Math.hypot(p.vx, p.vy);
    const isMoving = speed > 0.4 || p.isDashing;

    const quality = this.videoSettings?.particleQuality || 'MEDIUM';
    const baseChance = quality === 'LOW' ? 0.55 : quality === 'MEDIUM' ? 0.85 : 1.0;

    // Define engine nozzle coordinates in local ship coordinate space
    let nozzles: { x: number; y: number; color: string; size: number }[] = [];

    if (p.shipId === 'titan') {
      // Dreadnought triple heavy fusion drives
      const amber = p.isDashing ? '#fde047' : '#f59e0b';
      const orange = p.isDashing ? '#fbbf24' : '#f97316';
      nozzles = [
        { x: -26, y: 0, color: amber, size: p.isDashing ? 4.8 : 3.4 },
        { x: -24, y: -14, color: orange, size: p.isDashing ? 3.6 : 2.6 },
        { x: -24, y: 14, color: orange, size: p.isDashing ? 3.6 : 2.6 },
      ];
    } else if (p.shipId === 'chronos') {
      // Quantum tachyon manifold twin ion exhausts
      const violet = p.isDashing ? '#f472b6' : '#c084fc';
      const purple = p.isDashing ? '#ffffff' : '#a855f7';
      nozzles = [
        { x: -22, y: -8, color: violet, size: p.isDashing ? 4.2 : 2.8 },
        { x: -22, y: 8, color: purple, size: p.isDashing ? 4.2 : 2.8 },
      ];
    } else {
      // Valkyrie interceptor twin plasma afterburners
      const cyan = p.isDashing ? '#a5f3fc' : '#00f0ff';
      const sky = p.isDashing ? '#ffffff' : '#38bdf8';
      nozzles = [
        { x: -25, y: -9, color: cyan, size: p.isDashing ? 4.4 : 3.0 },
        { x: -25, y: 9, color: sky, size: p.isDashing ? 4.4 : 3.0 },
      ];
    }

    const cos = Math.cos(this.aimAngle);
    const sin = Math.sin(this.aimAngle);

    for (const nozzle of nozzles) {
      // Coasting/idle engine glow emission
      if (!isMoving && Math.random() > 0.2) continue;
      // Active movement engine trail emission
      if (isMoving && Math.random() > baseChance) continue;

      // Transform nozzle from ship space to world coordinates
      const wx = p.x + nozzle.x * cos - nozzle.y * sin;
      const wy = p.y + nozzle.x * sin + nozzle.y * cos;

      // Exhaust ejects opposite to ship facing vector with gentle dispersion
      const backAngle = this.aimAngle + Math.PI + (Math.random() - 0.5) * 0.35;
      const ejectSpeed = (2.0 + Math.random() * 3.2 + speed * 0.35) * (p.isDashing ? 2.2 : 1.0);
      const evx = Math.cos(backAngle) * ejectSpeed + p.vx * 0.15;
      const evy = Math.sin(backAngle) * ejectSpeed + p.vy * 0.15;

      const duration = p.isDashing ? 0.38 : 0.24 + Math.random() * 0.08;
      let pSize = nozzle.size + (Math.random() - 0.5) * 0.8;
      let pColor = nozzle.color;
      let pShape: 'trail' | 'spark' | 'circle' = 'trail';

      // --- COMMANDER'S REWARD COSMETIC SHIP TRAILS ---
      if (this.equippedTrail === 'trail_supernova') {
        // Solar Supernova: radiant celestial gold & diamond starburst
        pColor = Math.random() < 0.4 ? '#ffffff' : Math.random() < 0.7 ? '#fde047' : '#f59e0b';
        pSize *= 1.25;
        if (Math.random() < 0.3) pShape = 'spark';
      } else if (this.equippedTrail === 'trail_void') {
        // Quantum Void Rift: deep ultraviolet & tachyonic magenta warp
        pColor = Math.random() < 0.45 ? '#c084fc' : Math.random() < 0.75 ? '#a855f7' : '#ec4899';
        pSize *= 1.15;
      } else if (this.equippedTrail === 'trail_berserker') {
        // Infernal Berserker: raging hellfire embers & dark cinder smoke
        pColor = Math.random() < 0.4 ? '#ef4444' : Math.random() < 0.75 ? '#f97316' : '#fbbf24';
        pSize *= 1.3;
        if (Math.random() < 0.35) pShape = 'spark';
      } else if (this.equippedTrail === 'trail_emerald_hyper') {
        // Aether Emerald: hypercharged luminous jade flow
        pColor = Math.random() < 0.4 ? '#6ee7b7' : Math.random() < 0.75 ? '#10b981' : '#047857';
        pSize *= 1.2;
      }

      this.createParticle(wx, wy, evx, evy, pColor, pSize, duration, pShape, true);
    }

    // High-speed aerodynamic wingtip contrails when dashing
    if (p.isDashing) {
      let wingtips: { x: number; y: number }[] = [];
      if (p.shipId === 'valkyrie') {
        wingtips = [{ x: -18, y: -28 }, { x: -18, y: 28 }];
      } else if (p.shipId === 'chronos') {
        wingtips = [{ x: 8, y: -26 }, { x: 8, y: 26 }];
      } else if (p.shipId === 'titan') {
        wingtips = [{ x: -14, y: -28 }, { x: -14, y: 28 }];
      }

      for (const tip of wingtips) {
        const tx = p.x + tip.x * cos - tip.y * sin;
        const ty = p.y + tip.x * sin + tip.y * cos;
        this.createParticle(
          tx,
          ty,
          -p.vx * 0.15 + (Math.random() - 0.5) * 0.5,
          -p.vy * 0.15 + (Math.random() - 0.5) * 0.5,
          p.shipId === 'titan' ? '#fbbf24' : p.shipId === 'chronos' ? '#c084fc' : '#38bdf8',
          2.2,
          0.3,
          'spark',
          true
        );
      }
    }
  }

  public triggerDash(): boolean {
    const p = this.player;
    if (p.dashCooldown <= 0 && !p.isDashing) {
      p.isDashing = true;
      p.dashDuration = 0.22;
      p.dashCooldown = p.maxDashCooldown;
      p.invulnerableTimer = 0.28;

      // Dash burst velocity in current aim or movement direction
      const angle = this.aimAngle;
      p.vx += Math.cos(angle) * (p.speed * 2.2);
      p.vy += Math.sin(angle) * (p.speed * 2.2);

      sound.playDash();

      // Shockwave ring
      this.particles.push({
        x: p.x,
        y: p.y,
        vx: 0,
        vy: 0,
        size: 2,
        color: '#00f0ff',
        alpha: 0.8,
        decay: 3.5,
        shape: 'shockwave',
        radius: 12,
        maxRadius: 40,
      });

      const { newlyCompleted: dashCompleted } = updateDailyMissionProgress('DASHES', 1);
      this.notifyMissions(dashCompleted);

      return true;
    }
    return false;
  }

  public triggerSpecial(): boolean {
    const p = this.player;
    if (p.specialMeter < p.maxSpecialMeter) return false;

    p.specialMeter = 0;

    const { newlyCompleted: specialCompleted } = updateDailyMissionProgress('SPECIALS', 1);
    this.notifyMissions(specialCompleted);

    if (p.shipId === 'valkyrie') {
      // EMP Shockwave
      sound.playEMP();
      this.screenShake.triggerSpecialAbility('EMP');
      // Clear all enemy projectiles
      this.projectiles = this.projectiles.filter((proj) => proj.isPlayer);

      // Stun & damage all enemies on screen
      for (const e of this.enemies) {
        e.health -= 60 * p.damageMultiplier;
        e.vx += (e.x - p.x) * 0.15;
        e.vy += (e.y - p.y) * 0.15;
      }

      this.particles.push({
        x: p.x,
        y: p.y,
        vx: 0,
        vy: 0,
        size: 5,
        color: '#38bdf8',
        alpha: 1,
        decay: 1.8,
        shape: 'shockwave',
        radius: 10,
        maxRadius: Math.max(this.width, this.height) * 0.6,
      });
      this.spawnFloatText(p.x, p.y - 20, 'EMP DETONATED!', '#38bdf8');
      return true;
    } else if (p.shipId === 'titan') {
      // Plasma Siege Barrage: 24 projectiles in a circle
      sound.playLaser('heavy');
      this.screenShake.triggerSpecialAbility('SIEGE');
      const count = 24;
      for (let i = 0; i < count; i++) {
        const theta = (i / count) * Math.PI * 2;
        this.projectiles.push({
          id: `siege_${++this.idCounter}`,
          x: p.x,
          y: p.y,
          vx: Math.cos(theta) * 12,
          vy: Math.sin(theta) * 12,
          damage: 45 * p.damageMultiplier,
          radius: 6,
          color: '#fbbf24',
          isPlayer: true,
          piercing: 2,
          lifeTime: 2.5,
        });
      }
      this.spawnFloatText(p.x, p.y - 20, 'SIEGE BARRAGE!', '#fbbf24');
      return true;
    } else if (p.shipId === 'chronos') {
      // Time-warp
      sound.playEMP();
      this.screenShake.triggerSpecialAbility('TIME_WARP');
      p.timeFreezeTimer = 4.0;
      this.spawnFloatText(p.x, p.y - 20, 'TIME WARP ACTIVATED!', '#c084fc');
      return true;
    }

    return false;
  }

  private updateWeapons(dt: number) {
    const p = this.player;
    const baseFireRate = SHIPS[p.shipId]?.stats.fireRate || 8;
    const currentRate = baseFireRate * p.fireRateMultiplier;
    const fireInterval = 1 / currentRate;

    p.fireCooldown -= dt;

    if (this.isFiring && p.fireCooldown <= 0) {
      p.fireCooldown = fireInterval;
      this.firePrimaryWeapons();
    }

    // Micro-missile pods
    if (p.homingCount > 0) {
      p.homingTimer -= dt;
      if (p.homingTimer <= 0) {
        p.homingTimer = 1.6 / p.homingCount;
        this.fireHomingMissiles();
      }
    }
  }

  private firePrimaryWeapons() {
    const p = this.player;
    const cfg = SHIPS[p.shipId] || SHIPS.valkyrie;
    const baseDamage = cfg.stats.damage * p.damageMultiplier;
    const spread = p.spreadCount;
    const spreadAngleStep = 0.12;

    this.stats.shotsFired += spread;
    sound.playLaser(p.shipId === 'titan' ? 'heavy' : 'light');

    for (let i = 0; i < spread; i++) {
      const angleOffset = (i - (spread - 1) / 2) * spreadAngleStep;
      const finalAngle = this.aimAngle + angleOffset;
      const speed = p.shipId === 'titan' ? 14 : 17;

      // Cannon offset
      const noseDist = 20;
      const spawnX = p.x + Math.cos(this.aimAngle) * noseDist;
      const spawnY = p.y + Math.sin(this.aimAngle) * noseDist;

      // Cosmetic Weapon Effect overrides
      let projColor = cfg.primaryColor;
      let trailColor = cfg.accentColor;
      let muzzleColor = cfg.accentColor;
      let cosmeticEffectId: string | undefined = undefined;

      if (this.equippedWeapon === 'weapon_prismatic') {
        projColor = '#fef08a';
        trailColor = '#ffffff';
        muzzleColor = '#fde047';
        cosmeticEffectId = 'weapon_prismatic';
      } else if (this.equippedWeapon === 'weapon_tachyon') {
        projColor = '#c084fc';
        trailColor = '#38bdf8';
        muzzleColor = '#a855f7';
        cosmeticEffectId = 'weapon_tachyon';
      } else if (this.equippedWeapon === 'weapon_bloodfire') {
        projColor = '#ef4444';
        trailColor = '#f97316';
        muzzleColor = '#dc2626';
        cosmeticEffectId = 'weapon_bloodfire';
      } else if (this.equippedWeapon === 'weapon_chronos_phase') {
        projColor = '#06b6d4';
        trailColor = '#f43f5e';
        muzzleColor = '#38bdf8';
        cosmeticEffectId = 'weapon_chronos_phase';
      }

      this.projectiles.push({
        id: `p_${++this.idCounter}`,
        x: spawnX,
        y: spawnY,
        vx: Math.cos(finalAngle) * speed + p.vx * 0.2,
        vy: Math.sin(finalAngle) * speed + p.vy * 0.2,
        damage: baseDamage,
        radius: p.shipId === 'titan' ? 5.5 : 4,
        color: projColor,
        isPlayer: true,
        piercing: p.hasPiercing ? 2 : 0,
        lifeTime: 1.8,
        trailColor,
        cosmeticEffectId,
      });

      // Muzzle flash particle
      this.createParticle(spawnX, spawnY, Math.cos(finalAngle) * 3, Math.sin(finalAngle) * 3, muzzleColor, 3.5, 0.15, 'spark');
    }
  }

  private fireHomingMissiles() {
    const p = this.player;
    if (this.enemies.length === 0) return;

    // Target closest enemy
    let target = this.enemies[0];
    let minDist = Infinity;
    for (const e of this.enemies) {
      const dist = Math.hypot(e.x - p.x, e.y - p.y);
      if (dist < minDist) {
        minDist = dist;
        target = e;
      }
    }

    const angle = this.aimAngle + (Math.random() - 0.5) * 0.8;
    this.projectiles.push({
      id: `m_${++this.idCounter}`,
      x: p.x,
      y: p.y,
      vx: Math.cos(angle) * 8,
      vy: Math.sin(angle) * 8,
      damage: 32 * p.damageMultiplier,
      radius: 4,
      color: '#f97316',
      isPlayer: true,
      isHoming: true,
      homingTargetId: target.id,
      lifeTime: 3.5,
    });
  }

  private updateDrones(dt: number) {
    const p = this.player;
    // Keep drones synchronized with droneCount upgrade
    while (this.drones.length < p.droneCount) {
      this.drones.push({
        orbitAngle: (this.drones.length * Math.PI * 2) / Math.max(1, p.droneCount),
        distance: 48,
        fireCooldown: Math.random() * 0.5,
      });
    }

    for (const drone of this.drones) {
      drone.orbitAngle += dt * 2.5;
      drone.fireCooldown -= dt;

      // Drone auto-fires at nearest enemy
      if (drone.fireCooldown <= 0 && this.enemies.length > 0) {
        drone.fireCooldown = 0.8;
        const dx = p.x + Math.cos(drone.orbitAngle) * drone.distance;
        const dy = p.y + Math.sin(drone.orbitAngle) * drone.distance;

        let nearest = this.enemies[0];
        let minDist = Infinity;
        for (const e of this.enemies) {
          const d = Math.hypot(e.x - dx, e.y - dy);
          if (d < minDist) {
            minDist = d;
            nearest = e;
          }
        }

        if (minDist < 350) {
          const aim = Math.atan2(nearest.y - dy, nearest.x - dx);
          this.projectiles.push({
            id: `drone_${++this.idCounter}`,
            x: dx,
            y: dy,
            vx: Math.cos(aim) * 12,
            vy: Math.sin(aim) * 12,
            damage: 16 * p.damageMultiplier,
            radius: 3,
            color: '#06b6d4',
            isPlayer: true,
            lifeTime: 1.5,
          });
          sound.playLaser('light');
        }
      }
    }
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];

      // Homing logic
      if (p.isHoming && p.homingTargetId) {
        const target = this.enemies.find((e) => e.id === p.homingTargetId);
        if (target) {
          const dx = target.x - p.x;
          const dy = target.y - p.y;
          const desiredAngle = Math.atan2(dy, dx);
          const currentAngle = Math.atan2(p.vy, p.vx);
          let diff = desiredAngle - currentAngle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;

          const turnSpeed = 6.0 * dt;
          const newAngle = currentAngle + Math.sign(diff) * Math.min(Math.abs(diff), turnSpeed);
          const speed = Math.hypot(p.vx, p.vy);
          p.vx = Math.cos(newAngle) * speed;
          p.vy = Math.sin(newAngle) * speed;
        }
      }

      const stepX = p.vx * dt * 60;
      const stepY = p.vy * dt * 60;
      p.x += stepX;
      p.y += stepY;
      p.lifeTime -= dt;

      // Fading particle trail behind high-velocity projectiles
      const speed = Math.hypot(p.vx, p.vy);
      if (speed >= 3.5) {
        const quality = this.videoSettings?.particleQuality || 'MEDIUM';
        const emitChance = quality === 'LOW' ? 0.45 : quality === 'MEDIUM' ? 0.8 : 1.0;

        if (Math.random() < emitChance) {
          // Interpolate behind bullet head along current frame trajectory
          const t = 0.25 + Math.random() * 0.55;
          const trailX = p.x - stepX * t;
          const trailY = p.y - stepY * t;

          if (p.isHoming) {
            // Rocket missile exhaust fire & smoke
            const emberColor = Math.random() < 0.65 ? '#f97316' : '#fbbf24';
            this.createParticle(
              trailX,
              trailY,
              -p.vx * 0.08 + (Math.random() - 0.5) * 0.6,
              -p.vy * 0.08 + (Math.random() - 0.5) * 0.6,
              emberColor,
              2.8 + Math.random() * 1.4,
              0.28,
              'trail',
              true
            );
          } else {
            // High-velocity plasma projectile luminous particle trail
            const color = p.trailColor || p.color || '#00f0ff';
            const size = Math.max(1.5, p.radius * 0.8 + (Math.random() - 0.5) * 0.6);
            this.createParticle(
              trailX,
              trailY,
              -p.vx * 0.06 + (Math.random() - 0.5) * 0.4,
              -p.vy * 0.06 + (Math.random() - 0.5) * 0.4,
              color,
              size,
              0.18 + Math.random() * 0.06,
              'trail',
              true
            );
          }
        }
      }

      // Despawn if lifetime ended or off-screen
      if (p.lifeTime <= 0 || p.x < -100 || p.x > this.width + 100 || p.y < -100 || p.y > this.height + 100) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  private startWave(waveNumber: number) {
    const prevWave = this.stats.wave || 1;
    this.stats.wave = waveNumber;
    this.waveSpawnIndex = 0;
    this.waveTimer = 0;
    this.bossSpawnedThisWave = false;
    this.waveQueue = [];

    const { newlyCompleted: waveCompleted } = updateDailyMissionProgress('SURVIVE_WAVE', waveNumber, true);
    this.notifyMissions(waveCompleted);

    const prevSectorConfig = getSectorForWave(prevWave, this.gameMode);
    const newSectorConfig = getSectorForWave(waveNumber, this.gameMode);
    const isSectorChange = waveNumber === 1 || prevSectorConfig.id !== newSectorConfig.id;
    this.currentSectorId = newSectorConfig.id;

    const isMegaBossWave = waveNumber > 0 && waveNumber % 10 === 0;
    const isNormalBossWave = (this.gameMode === 'BOSS_RUSH' && !isMegaBossWave) || (waveNumber % 5 === 0 && !isMegaBossWave);
    const isBossWave = isMegaBossWave || isNormalBossWave;

    // Trigger animated cosmic screen-wipe transition
    if (this.onWaveTransitionCallback) {
      this.onWaveTransitionCallback({
        id: `wipe_${waveNumber}_${Date.now()}`,
        wave: waveNumber,
        previousWave: prevWave,
        isSectorChange,
        sectorName: newSectorConfig.name,
        sectorCodename: newSectorConfig.codename,
        sectorDescription: newSectorConfig.description,
        accentColor: newSectorConfig.accentHex,
        secondaryColor: `rgb(${newSectorConfig.nebulaSecondary.join(',')})`,
        isMegaBoss: isMegaBossWave,
        isBoss: isBossWave,
        timestamp: Date.now(),
      });
    }
    sound.playCosmicWarp(isSectorChange);

    if (isMegaBossWave) {
      // Spawn MEGA BOSS + elite battlecruiser escort fleet
      this.waveQueue.push({ type: 'BOSS', delay: 1.0 });
      this.waveQueue.push({ type: 'CRUISER', delay: 2.2 });
      this.waveQueue.push({ type: 'CRUISER', delay: 3.2 });
      for (let i = 0; i < 6 + waveNumber; i++) {
        this.waveQueue.push({ type: 'SWARMER', delay: 2.5 + i * 0.4 });
      }
      const megaName = waveNumber >= 20 ? 'SINGULARITY HARBINGER "ASTRAEUS"' : 'APOCALYPSE-CLASS MEGA TITAN "NEXUS-OMEGA"';
      this.bossWarningEvent = {
        phase: 1,
        maxPhases: 3,
        timer: 4.5,
        duration: 4.5,
        title: 'CRITICAL OMEGA ALERT: MEGA BOSS DETECTED',
        subtitle: `${megaName} ENTERING COMBAT AIRSPACE · COMMANDER REWARDS ENGAGED`,
      };
      sound.playMegaBossAlarm();
      this.spawnFloatText(this.width / 2, this.height * 0.35, 'ALERT: MEGA TITAN DETECTED!', '#f59e0b');
    } else if (isNormalBossWave) {
      // Spawn Boss + escort fleet
      this.waveQueue.push({ type: 'BOSS', delay: 1.0 });
      for (let i = 0; i < 4 + waveNumber; i++) {
        this.waveQueue.push({ type: 'SWARMER', delay: 2.0 + i * 0.5 });
      }
      this.bossWarningEvent = {
        phase: 1,
        maxPhases: 3,
        timer: 3.5,
        duration: 3.5,
        title: 'WARNING: TITAN CLASS RAID DETECTED',
        subtitle: 'OMEGA-TITAN "GORGON" ENTERING COMBAT AIRSPACE',
      };
      sound.playBossPhaseWarning(1);
      this.spawnFloatText(this.width / 2, this.height * 0.35, 'WARNING: TITAN CLASS THREAT DETECTED!', '#ef4444');
    } else {
      // Normal / progressive wave
      const count = 8 + waveNumber * 4;
      for (let i = 0; i < count; i++) {
        let type: EnemyType = 'SCOUT';
        const rand = Math.random();

        if (rand < 0.3) {
          type = 'ASTEROID';
        } else if (rand < 0.6) {
          type = 'SWARMER';
        } else if (waveNumber >= 3 && rand < 0.8) {
          type = 'CRUISER';
        } else if (waveNumber >= 4 && rand < 0.95) {
          type = 'SNIPER';
        }

        this.waveQueue.push({
          type,
          delay: i * Math.max(0.25, 1.2 - waveNumber * 0.08),
        });
      }
    }
  }

  private updateWave(dt: number) {
    this.waveTimer += dt;

    // Spawn queued enemies based on delay
    while (
      this.waveSpawnIndex < this.waveQueue.length &&
      this.waveQueue[this.waveSpawnIndex].delay <= this.waveTimer
    ) {
      this.spawnEnemy(this.waveQueue[this.waveSpawnIndex].type);
      this.waveSpawnIndex++;
    }

    // Check if wave complete
    if (this.waveSpawnIndex >= this.waveQueue.length && this.enemies.length === 0) {
      this.startWave(this.stats.wave + 1);
    }
  }

  private spawnEnemy(type: EnemyType, spawnPos?: { x: number; y: number }, asteroidTier: number = 3) {
    let x = 0;
    let y = 0;

    if (spawnPos) {
      x = spawnPos.x;
      y = spawnPos.y;
    } else {
      // Spawn on edges outside screen
      const side = Math.floor(Math.random() * 4);
      const pad = 40;
      if (side === 0) {
        x = Math.random() * this.width;
        y = -pad;
      } else if (side === 1) {
        x = this.width + pad;
        y = Math.random() * this.height;
      } else if (side === 2) {
        x = Math.random() * this.width;
        y = this.height + pad;
      } else {
        x = -pad;
        y = Math.random() * this.height;
      }
    }

    const waveFactor = 1 + (this.stats.wave - 1) * 0.15;
    const enemy: Enemy = {
      id: `e_${++this.idCounter}`,
      type,
      x,
      y,
      vx: 0,
      vy: 0,
      angle: 0,
      radius: 14,
      health: 20 * waveFactor,
      maxHealth: 20 * waveFactor,
      scoreValue: 100,
      xpValue: 12,
      color: '#f97316',
      fireCooldown: 1.5,
    };

    if (type === 'ASTEROID') {
      const radius = asteroidTier === 3 ? 32 : asteroidTier === 2 ? 20 : 12;
      enemy.radius = radius;
      enemy.health = (asteroidTier === 3 ? 50 : asteroidTier === 2 ? 25 : 12) * waveFactor;
      enemy.maxHealth = enemy.health;
      enemy.scoreValue = 80 * asteroidTier;
      enemy.xpValue = 8 * asteroidTier;

      // Random drift angle
      const driftAngle = Math.random() * Math.PI * 2;
      const driftSpeed = (Math.random() * 1.5 + 0.8) / (asteroidTier * 0.6);
      enemy.vx = Math.cos(driftAngle) * driftSpeed;
      enemy.vy = Math.sin(driftAngle) * driftSpeed;

      // Procedural polygon vertices
      const verts: { x: number; y: number }[] = [];
      const numVerts = 8;
      for (let i = 0; i < numVerts; i++) {
        const theta = (i / numVerts) * Math.PI * 2;
        const r = radius * (0.8 + Math.random() * 0.4);
        verts.push({ x: Math.cos(theta) * r, y: Math.sin(theta) * r });
      }

      enemy.customData = {
        asteroidVertices: verts,
        asteroidTier,
      };
    } else if (type === 'SWARMER') {
      enemy.radius = 11;
      enemy.health = 18 * waveFactor;
      enemy.maxHealth = enemy.health;
      enemy.scoreValue = 120;
      enemy.xpValue = 10;
    } else if (type === 'CRUISER') {
      enemy.radius = 24;
      enemy.health = 80 * waveFactor;
      enemy.maxHealth = enemy.health;
      enemy.scoreValue = 350;
      enemy.xpValue = 35;
      enemy.fireCooldown = 2.0;
    } else if (type === 'SNIPER') {
      enemy.radius = 16;
      enemy.health = 35 * waveFactor;
      enemy.maxHealth = enemy.health;
      enemy.scoreValue = 250;
      enemy.xpValue = 25;
      enemy.fireCooldown = 3.2;
    } else if (type === 'BOSS') {
      const isMega = this.stats.wave > 0 && this.stats.wave % 10 === 0;
      if (isMega) {
        enemy.radius = 75;
        enemy.health = 1350 * waveFactor;
        enemy.maxHealth = enemy.health;
        enemy.scoreValue = 10000;
        enemy.xpValue = 500;
        enemy.fireCooldown = 0.8;
        const megaName =
          this.stats.wave >= 20
            ? 'SINGULARITY HARBINGER "ASTRAEUS"'
            : 'APOCALYPSE-CLASS MEGA TITAN "NEXUS-OMEGA"';
        enemy.customData = {
          isMegaBoss: true,
          bossName: megaName,
          bossPhase: 1,
          maxPhases: 3,
          phaseName: 'PHASE 1: QUAD-PLASMA APOCALYPSE',
          bossAttackTimer: 0,
        };
      } else {
        enemy.radius = 55;
        enemy.health = 450 * waveFactor;
        enemy.maxHealth = enemy.health;
        enemy.scoreValue = 2500;
        enemy.xpValue = 150;
        enemy.fireCooldown = 1.0;
        enemy.customData = {
          isMegaBoss: false,
          bossName: 'OMEGA-TITAN "GORGON"',
          bossPhase: 1,
          maxPhases: 3,
          phaseName: 'PHASE 1: TACHYON BARRAGE',
          bossAttackTimer: 0,
        };
      }
      this.bossSpawnedThisWave = true;
    }

    this.enemies.push(enemy);
    recordEnemyEncounter(type);
  }

  private updateEnemies(dt: number): number {
    const p = this.player;
    let maxShake = 0;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      const dx = p.x - e.x;
      const dy = p.y - e.y;
      const dist = Math.hypot(dx, dy);

      if (e.type === 'ASTEROID') {
        // Asteroid drifting & gentle rotation
        e.angle += 0.015;
        e.x += e.vx * dt * 60;
        e.y += e.vy * dt * 60;

        // Wrap around arena borders
        if (e.x < -50) e.x = this.width + 50;
        if (e.x > this.width + 50) e.x = -50;
        if (e.y < -50) e.y = this.height + 50;
        if (e.y > this.height + 50) e.y = -50;
      } else if (e.type === 'SWARMER') {
        // Fast direct pursuit
        e.angle = Math.atan2(dy, dx);
        const speed = 4.8;
        e.vx = Math.cos(e.angle) * speed;
        e.vy = Math.sin(e.angle) * speed;
        e.x += e.vx * dt * 60;
        e.y += e.vy * dt * 60;
      } else if (e.type === 'SCOUT') {
        // Flanking pursuit
        e.angle = Math.atan2(dy, dx);
        const speed = 3.4;
        e.vx = Math.cos(e.angle) * speed;
        e.vy = Math.sin(e.angle) * speed;
        e.x += e.vx * dt * 60;
        e.y += e.vy * dt * 60;

        // Occasional light blaster shot
        if (e.fireCooldown !== undefined) {
          e.fireCooldown -= dt;
          if (e.fireCooldown <= 0 && dist < 400) {
            e.fireCooldown = 2.4 + Math.random() * 0.8;
            this.projectiles.push({
              id: `ep_${++this.idCounter}`,
              x: e.x,
              y: e.y,
              vx: Math.cos(e.angle) * 7,
              vy: Math.sin(e.angle) * 7,
              damage: 12,
              radius: 4,
              color: '#ef4444',
              isPlayer: false,
              lifeTime: 2.5,
            });
            sound.playLaser('enemy');
          }
        }
      } else if (e.type === 'CRUISER') {
        // Stays at mid range (200-300px) and fires spread burst
        e.angle = Math.atan2(dy, dx);
        const desiredDist = 260;
        let speed = 0;
        if (dist > desiredDist + 30) speed = 2.0;
        else if (dist < desiredDist - 30) speed = -1.5;

        e.vx = Math.cos(e.angle) * speed;
        e.vy = Math.sin(e.angle) * speed;
        e.x += e.vx * dt * 60;
        e.y += e.vy * dt * 60;

        if (e.fireCooldown !== undefined) {
          e.fireCooldown -= dt;
          if (e.fireCooldown <= 0) {
            e.fireCooldown = 2.5;
            // 3-way spread
            for (let s = -1; s <= 1; s++) {
              const shotAngle = e.angle + s * 0.25;
              this.projectiles.push({
                id: `ep_${++this.idCounter}`,
                x: e.x,
                y: e.y,
                vx: Math.cos(shotAngle) * 6,
                vy: Math.sin(shotAngle) * 6,
                damage: 15,
                radius: 4.5,
                color: '#c084fc',
                isPlayer: false,
                lifeTime: 2.8,
              });
            }
            sound.playLaser('heavy');
          }
        }
      } else if (e.type === 'SNIPER') {
        // Keeps long distance, charges sniper shot
        e.angle = Math.atan2(dy, dx);
        const desiredDist = 380;
        let speed = 0;
        if (dist > desiredDist + 40) speed = 1.8;
        else if (dist < desiredDist - 40) speed = -1.8;

        e.vx = Math.cos(e.angle) * speed;
        e.vy = Math.sin(e.angle) * speed;
        e.x += e.vx * dt * 60;
        e.y += e.vy * dt * 60;

        if (e.fireCooldown !== undefined) {
          e.fireCooldown -= dt;
          if (e.fireCooldown <= 0) {
            e.fireCooldown = 3.0;
            this.projectiles.push({
              id: `ep_${++this.idCounter}`,
              x: e.x,
              y: e.y,
              vx: Math.cos(e.angle) * 14,
              vy: Math.sin(e.angle) * 14,
              damage: 24,
              radius: 3.5,
              color: '#34d399',
              isPlayer: false,
              lifeTime: 2.2,
            });
            sound.playLaser('sniper');
          }
        }
      } else if (e.type === 'BOSS') {
        const phase = e.customData?.bossPhase || 1;
        // Boss AI logic & rotation
        e.angle += phase === 3 ? 0.025 : phase === 2 ? 0.016 : 0.01;

        // Maneuvering: hovering with dynamic horizontal strafing in Phase 2 & 3
        const targetX =
          phase >= 2
            ? this.width / 2 + Math.sin(this.stats.timeSurvived * 1.5) * (phase === 3 ? 160 : 90)
            : this.width / 2;
        const targetY =
          phase === 3
            ? this.height * 0.28 + Math.cos(this.stats.timeSurvived * 2) * 35
            : this.height * 0.3;

        e.x += (targetX - e.x) * (phase === 3 ? 0.03 : 0.018);
        e.y += (targetY - e.y) * 0.018;

        if (e.fireCooldown !== undefined) {
          e.fireCooldown -= dt;
          if (e.fireCooldown <= 0) {
            e.fireCooldown = phase === 3 ? 0.65 : phase === 2 ? 0.9 : 1.2;
            // Radial & spiral bullet spray
            const bullets = phase === 3 ? 18 : phase === 2 ? 14 : 10;
            const offset = (this.stats.timeSurvived * (phase === 3 ? 4.5 : 3.0)) % (Math.PI * 2);

            for (let b = 0; b < bullets; b++) {
              const theta = (b / bullets) * Math.PI * 2 + offset;
              const bulletSpeed = phase === 3 ? 6.2 : phase === 2 ? 5.4 : 4.8;
              this.projectiles.push({
                id: `boss_p_${++this.idCounter}`,
                x: e.x,
                y: e.y,
                vx: Math.cos(theta) * bulletSpeed,
                vy: Math.sin(theta) * bulletSpeed,
                damage: phase === 3 ? 24 : phase === 2 ? 20 : 18,
                radius: phase === 3 ? 6 : 5,
                color: phase === 3 ? (b % 2 === 0 ? '#ef4444' : '#fbbf24') : '#f43f5e',
                isPlayer: false,
                lifeTime: 3.5,
              });
            }

            // In Phase 2 and 3, launch aimed high-velocity tachyon bursts directly toward player
            if (phase >= 2) {
              const angleToPlayer = Math.atan2(p.y - e.y, p.x - e.x);
              const extraSpreads = phase === 3 ? [-0.2, 0, 0.2] : [-0.15, 0.15];
              extraSpreads.forEach((spread) => {
                const shotAngle = angleToPlayer + spread;
                this.projectiles.push({
                  id: `boss_aimed_${++this.idCounter}`,
                  x: e.x,
                  y: e.y,
                  vx: Math.cos(shotAngle) * (phase === 3 ? 8.5 : 7.0),
                  vy: Math.sin(shotAngle) * (phase === 3 ? 8.5 : 7.0),
                  damage: 22,
                  radius: 5.5,
                  color: '#fb7185',
                  isPlayer: false,
                  lifeTime: 2.8,
                });
              });
            }

            sound.playLaser('heavy');
          }
        }
      }
    }

    return maxShake;
  }

  private handleCollisions(): number {
    const p = this.player;
    let shake = 0;

    // 1. Player Projectiles vs Enemies
    for (let pi = this.projectiles.length - 1; pi >= 0; pi--) {
      const proj = this.projectiles[pi];
      if (!proj.isPlayer) continue;

      for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
        const e = this.enemies[ei];
        const dx = e.x - proj.x;
        const dy = e.y - proj.y;
        const maxR = e.radius + proj.radius;

        // Fast bounding box reject
        if (Math.abs(dx) > maxR || Math.abs(dy) > maxR) continue;

        if (dx * dx + dy * dy < maxR * maxR) {
          // HIT!
          this.stats.shotsHit++;
          e.health -= proj.damage;

          // Piercing logic
          if (proj.piercing && proj.piercing > 0) {
            proj.piercing--;
          } else {
            this.projectiles.splice(pi, 1);
          }

          // Trigger subtle camera vibration when striking a Boss leviathan
          if (e.type === 'BOSS') {
            const hitAngle = Math.atan2(proj.vy, proj.vx);
            this.screenShake.triggerBossHit(proj.damage, e.maxHealth, hitAngle);
            this.checkBossPhaseTransition(e);
          }

          // Impact sparks & floating damage text
          this.createParticle(proj.x, proj.y, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, proj.color, 3, 0.2);
          this.spawnFloatText(e.x, e.y - 12, `${Math.round(proj.damage)}`, '#ffffff');

          // Check if enemy died
          if (e.health <= 0) {
            this.destroyEnemy(ei);
            shake = Math.max(shake, e.type === 'BOSS' ? 0.8 : 0.25);
          }
          break;
        }
      }
    }

    // 2. Enemy Projectiles vs Player
    for (let pi = this.projectiles.length - 1; pi >= 0; pi--) {
      const proj = this.projectiles[pi];
      if (proj.isPlayer) continue;

      const dx = p.x - proj.x;
      const dy = p.y - proj.y;
      const maxR = 18 + proj.radius;

      if (Math.abs(dx) > maxR || Math.abs(dy) > maxR) continue;

      if (dx * dx + dy * dy < maxR * maxR && p.invulnerableTimer <= 0) {
        this.projectiles.splice(pi, 1);
        const hitAngle = Math.atan2(proj.vy, proj.vx);
        this.damagePlayer(proj.damage, hitAngle);
        shake = Math.max(shake, 0.4);
      }
    }

    // 3. Enemy Direct Body Rams vs Player
    for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
      const e = this.enemies[ei];
      const dist = Math.hypot(p.x - e.x, p.y - e.y);

      if (dist < 18 + e.radius && p.invulnerableTimer <= 0) {
        // Direct ram damage
        const ramDamage = e.type === 'BOSS' ? 50 : 25;
        const angle = Math.atan2(p.y - e.y, p.x - e.x);
        this.damagePlayer(ramDamage, angle);
        if (e.type === 'BOSS') {
          this.screenShake.triggerBossHit(ramDamage, e.maxHealth, angle);
        }
        shake = Math.max(shake, 0.5);

        // Push enemy back
        const pushAngle = Math.atan2(e.y - p.y, e.x - p.x);
        e.vx += Math.cos(pushAngle) * 8;
        e.vy += Math.sin(pushAngle) * 8;
      }
    }

    return shake;
  }

  public checkBossPhaseTransition(boss: Enemy) {
    if (boss.type !== 'BOSS' || boss.health <= 0) return;
    const ratio = Math.max(0, boss.health / boss.maxHealth);
    const currentPhase = boss.customData?.bossPhase || 1;
    let targetPhase = 1;

    if (ratio <= 0.333) {
      targetPhase = 3;
    } else if (ratio <= 0.666) {
      targetPhase = 2;
    }

    if (targetPhase > currentPhase) {
      this.triggerBossPhaseTransition(boss, targetPhase);
    }
  }

  private triggerBossPhaseTransition(boss: Enemy, newPhase: number) {
    if (!boss.customData) {
      boss.customData = {};
    }
    boss.customData.bossPhase = newPhase;
    const isMega = !!boss.customData.isMegaBoss;

    if (isMega) {
      boss.customData.phaseName =
        newPhase === 3 ? 'PHASE 3: APOCALYPSE SINGULARITY OVERDRIVE' : 'PHASE 2: TACHYON FLUX CASCADE';
    } else {
      boss.customData.phaseName =
        newPhase === 3 ? 'PHASE 3: HYPER-OVERDRIVE' : 'PHASE 2: FLUX INVERSION';
    }

    const isPhase3 = newPhase === 3;
    this.bossWarningEvent = {
      phase: newPhase,
      maxPhases: 3,
      timer: isMega ? 4.5 : 3.5,
      duration: isMega ? 4.5 : 3.5,
      title: isMega
        ? isPhase3
          ? 'CRITICAL ALERT: MEGA TITAN SINGULARITY COLLAPSE'
          : 'WARNING: MEGA TITAN SUB-PHASE II ENGAGED'
        : isPhase3
        ? 'CRITICAL ALERT: SUB-PHASE III HYPER-OVERDRIVE'
        : 'WARNING: SUB-PHASE II ENGAGED',
      subtitle: isMega
        ? isPhase3
          ? 'ANTIMATTER CONTAINMENT BREACHED · LETHAL RADIAL DISCHARGE'
          : 'HEAVY QUAD-TURRETS OVERCLOCKED · ESCORT FLEET REINFORCING'
        : isPhase3
        ? 'SINGULARITY CORE DESTABILIZED · ALL LIMITERS OFFLINE'
        : 'TITAN FLUX GENERATOR OVERCHARGED · ACCELERATED BARRAGE',
    };

    // Concussive camera vibration & shockwave
    this.screenShake.triggerBossHit(isMega ? (isPhase3 ? 120 : 80) : isPhase3 ? 80 : 55, boss.maxHealth);

    // Audio alarm
    if (isMega) {
      sound.playMegaBossAlarm();
    } else {
      sound.playBossPhaseWarning(newPhase);
    }

    // Float combat warning
    this.spawnFloatText(
      boss.x,
      boss.y - (isMega ? 95 : 75),
      isMega
        ? isPhase3
          ? 'CRITICAL: MEGA TITAN APOCALYPSE!'
          : 'WARNING: MEGA TITAN SUB-PHASE II!'
        : isPhase3
        ? 'CRITICAL: SUB-PHASE III OVERDRIVE!'
        : 'WARNING: SUB-PHASE II ENGAGED!',
      isPhase3 ? '#ef4444' : '#f59e0b'
    );

    // Energy burst explosion particles around boss
    const burstCount = isMega ? (isPhase3 ? 55 : 36) : isPhase3 ? 36 : 24;
    for (let i = 0; i < burstCount; i++) {
      const theta = (i / burstCount) * Math.PI * 2;
      const speed = 4 + Math.random() * (isMega ? 9 : 6);
      this.createParticle(
        boss.x,
        boss.y,
        Math.cos(theta) * speed,
        Math.sin(theta) * speed,
        isMega ? (i % 2 === 0 ? '#f59e0b' : '#ef4444') : isPhase3 ? '#ef4444' : '#fbbf24',
        Math.random() * 5 + 3,
        Math.random() * 0.6 + 0.6,
        'shockwave'
      );
    }
  }

  private destroyEnemy(enemyIndex: number) {
    const e = this.enemies[enemyIndex];
    if (e.type === 'BOSS') {
      this.bossWarningEvent = null;
      if (e.customData?.isMegaBoss) {
        this.stats.megaBossesDefeated++;
        this.spawnFloatText(e.x, e.y - 45, 'MEGA TITAN OBLITERATED!', '#fbbf24');
        sound.playCommanderReward();

        // Calculate player remaining health percentage and award Commander's Reward
        const healthPercent = Math.max(
          1,
          Math.min(100, Math.round((this.player.health / this.player.maxHealth) * 100))
        );
        const reward = awardCommanderReward(
          healthPercent,
          e.customData.bossName || 'MEGA TITAN "NEXUS-OMEGA"'
        );

        if (this.onCommanderRewardCallback) {
          this.onCommanderRewardCallback(reward);
        }
      } else {
        this.spawnFloatText(e.x, e.y - 25, 'TITAN NEUTRALIZED!', '#38bdf8');
      }
    }
    recordEnemyKill(e.type);
    this.enemies.splice(enemyIndex, 1);
    this.stats.enemiesDefeated++;

    // Combo progression within 3-second window
    this.stats.currentCombo++;
    this.stats.comboTimer = 3.0; // 3.0 seconds window to continue combo streak
    if (this.stats.currentCombo > this.stats.maxCombo) {
      this.stats.maxCombo = this.stats.currentCombo;
    }

    // Score with combo multiplier
    const comboMultiplier = Math.min(5.0, 1 + (this.stats.currentCombo - 1) * 0.1);
    this.stats.comboMultiplier = comboMultiplier;
    const scoreEarned = Math.round(e.scoreValue * comboMultiplier);
    this.stats.score += scoreEarned;

    // Trigger visual combo multiplier float feedback
    if (this.stats.currentCombo >= 4 && (this.stats.currentCombo % 3 === 0 || e.type === 'CRUISER' || e.type === 'SNIPER' || e.type === 'BOSS')) {
      this.spawnFloatText(
        e.x,
        e.y - 18,
        `${comboMultiplier.toFixed(1)}x COMBO!`,
        comboMultiplier >= 3.0 ? '#ef4444' : comboMultiplier >= 2.0 ? '#f97316' : '#fbbf24'
      );
    }

    // Daily Directives mission tracking
    const { newlyCompleted: killCompleted } = updateDailyMissionProgress('KILLS', 1);
    this.notifyMissions(killCompleted);

    if (e.type === 'CRUISER' || e.type === 'SNIPER' || e.type === 'BOSS') {
      const { newlyCompleted: eliteCompleted } = updateDailyMissionProgress('ELITE_KILLS', 1);
      this.notifyMissions(eliteCompleted);
    }

    const { newlyCompleted: comboCompleted } = updateDailyMissionProgress('MAX_COMBO', this.stats.currentCombo, true);
    this.notifyMissions(comboCompleted);

    const { newlyCompleted: scoreCompleted } = updateDailyMissionProgress('SCORE', this.stats.score, true);
    this.notifyMissions(scoreCompleted);

    // Special meter gain
    this.player.specialMeter = Math.min(
      this.player.maxSpecialMeter,
      this.player.specialMeter + (e.type === 'BOSS' ? 40 : 6)
    );

    // Sound effect
    sound.playExplosion(e.type === 'BOSS' ? 'boss' : e.type === 'CRUISER' ? 'large' : 'small');

    // Trigger subtle camera vibration and recoil from explosion
    const explosionMag = e.type === 'BOSS' ? 'boss' : e.type === 'CRUISER' ? 'medium' : 'small';
    this.screenShake.triggerExplosion(
      explosionMag,
      { x: e.x, y: e.y },
      { x: this.width / 2, y: this.height / 2 }
    );

    // Explosion particles
    const particleCount = this.videoSettings.particleQuality === 'LOW' ? 8 : this.videoSettings.particleQuality === 'MEDIUM' ? 16 : 28;
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 2;
      this.createParticle(
        e.x,
        e.y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        e.color,
        Math.random() * 4 + 2,
        Math.random() * 0.4 + 0.3
      );
    }

    // Asteroid splitting logic
    if (e.type === 'ASTEROID' && e.customData?.asteroidTier && e.customData.asteroidTier > 1) {
      this.screenShake.triggerExplosion('small', { x: e.x, y: e.y }, { x: this.width / 2, y: this.height / 2 });
      const nextTier = e.customData.asteroidTier - 1;
      this.spawnEnemy('ASTEROID', { x: e.x + 8, y: e.y + 8 }, nextTier);
      this.spawnEnemy('ASTEROID', { x: e.x - 8, y: e.y - 8 }, nextTier);
    }

    // Spawn XP Shards
    const isMega = e.type === 'BOSS' && !!e.customData?.isMegaBoss;
    const shardCount = isMega ? 35 : e.type === 'BOSS' ? 14 : e.type === 'CRUISER' ? 4 : 2;
    for (let s = 0; s < shardCount; s++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * (isMega ? 35 : 14);
      this.shards.push({
        id: `s_${++this.idCounter}`,
        x: e.x + Math.cos(angle) * dist,
        y: e.y + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * (isMega ? 4 : 2),
        vy: (Math.random() - 0.5) * (isMega ? 4 : 2),
        value: Math.round(e.xpValue / shardCount),
        color: isMega ? '#fbbf24' : e.type === 'BOSS' ? '#f59e0b' : '#38bdf8',
        radius: isMega ? 7 : e.type === 'BOSS' ? 6 : 4,
      });
    }
  }

  private damagePlayer(amount: number, hitAngle?: number) {
    const p = this.player;
    sound.playPlayerHit();
    p.shieldRechargeTimer = 0;
    p.invulnerableTimer = 0.4;

    const hadShield = p.shield > 0;
    let isShieldBreak = false;

    if (p.shield > 0) {
      if (p.shield >= amount) {
        p.shield -= amount;
        amount = 0;
      } else {
        amount -= p.shield;
        p.shield = 0;
        isShieldBreak = true;
      }
    }

    if (amount > 0) {
      p.health -= amount;
      this.spawnFloatText(p.x, p.y - 20, `-${Math.round(amount)}`, '#ef4444');
    }

    // Trigger subtle camera vibrations and recoil during player damage or shield breaks
    this.screenShake.triggerPlayerDamage(amount, hadShield && isShieldBreak, hitAngle);

    // Reactive Electro-Pulse upgrade check
    if (this.activeUpgrades['emp_discharge'] && this.activeUpgrades['emp_discharge'] > 0) {
      for (const e of this.enemies) {
        const d = Math.hypot(e.x - p.x, e.y - p.y);
        if (d < 160) {
          e.health -= 25 * this.activeUpgrades['emp_discharge'];
          e.vx += (e.x - p.x) * 0.2;
          e.vy += (e.y - p.y) * 0.2;
        }
      }
      this.particles.push({
        x: p.x,
        y: p.y,
        vx: 0,
        vy: 0,
        size: 3,
        color: '#a855f7',
        alpha: 0.9,
        decay: 2.5,
        shape: 'shockwave',
        radius: 10,
        maxRadius: 160,
      });
    }

    // Game Over check
    if (p.health <= 0) {
      p.health = 0;
      sound.playGameOver();
      if (this.onGameOverCallback) {
        this.onGameOverCallback();
      }
    }
  }

  private updateShards(dt: number) {
    const p = this.player;

    for (let i = this.shards.length - 1; i >= 0; i--) {
      const s = this.shards[i];
      const dx = p.x - s.x;
      const dy = p.y - s.y;
      const dist = Math.hypot(dx, dy);

      // Magnet pull
      if (dist < p.magnetRadius) {
        const pullSpeed = 12 + (1 - dist / p.magnetRadius) * 20;
        s.vx += (dx / dist) * pullSpeed * dt * 60;
        s.vy += (dy / dist) * pullSpeed * dt * 60;
      }

      s.vx *= 0.92;
      s.vy *= 0.92;
      s.x += s.vx * dt * 60;
      s.y += s.vy * dt * 60;

      // Pickup collision
      if (dist < 22) {
        this.shards.splice(i, 1);
        this.stats.crystalsCollected++;
        sound.playCrystalPickup(this.stats.currentCombo);
        this.addXp(s.value);

        const { newlyCompleted: crystalCompleted } = updateDailyMissionProgress('CRYSTALS', 1);
        this.notifyMissions(crystalCompleted);
      }
    }
  }

  private addXp(amount: number) {
    const p = this.player;
    p.xp += amount;

    if (p.xp >= p.xpToNextLevel) {
      p.xp -= p.xpToNextLevel;
      p.level++;
      p.xpToNextLevel = Math.round(p.xpToNextLevel * 1.35 + 25);
      sound.playLevelUp();

      // Trigger Upgrade Selection
      if (this.onLevelUpCallback) {
        const options = this.getRandomUpgradeOptions();
        this.onLevelUpCallback(options);
      }
    }
  }

  public getRandomUpgradeOptions(): UpgradeOption[] {
    const available = ALL_UPGRADES.filter((u) => {
      const current = this.activeUpgrades[u.id] || 0;
      return current < u.maxLevel;
    });

    // Shuffle and pick 3
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 3);

    return selected.map((u) => ({
      ...u,
      currentLevel: this.activeUpgrades[u.id] || 0,
    }));
  }

  public applyUpgrade(upgradeId: string) {
    const current = this.activeUpgrades[upgradeId] || 0;
    this.activeUpgrades[upgradeId] = current + 1;
    const p = this.player;

    switch (upgradeId) {
      case 'spread_fire':
        p.spreadCount++;
        break;
      case 'fire_rate':
        p.fireRateMultiplier += 0.22;
        break;
      case 'homing_swarm':
        p.homingCount++;
        break;
      case 'orbital_drone':
        p.droneCount++;
        break;
      case 'piercing_rounds':
        p.hasPiercing = true;
        break;
      case 'grav_magnet':
        p.magnetRadius += 60;
        break;
      case 'nanite_repair':
        p.maxHealth += 25;
        p.health = Math.min(p.maxHealth, p.health + p.maxHealth * 0.35);
        break;
      case 'shield_booster':
        p.maxShield += 30;
        p.shield = p.maxShield;
        break;
      case 'emp_discharge':
        // handled in damagePlayer
        break;
      case 'damage_overdrive':
        p.damageMultiplier += 0.3;
        break;
    }

    const { newlyCompleted: upgradeCompleted } = updateDailyMissionProgress('UPGRADES', 1);
    this.notifyMissions(upgradeCompleted);
  }

  private updateCombo(dt: number) {
    if (this.stats.comboTimer > 0) {
      this.stats.comboTimer -= dt;
      if (this.stats.comboTimer <= 0) {
        // Combo timeout reset
        this.stats.currentCombo = 1;
        this.stats.comboMultiplier = 1.0;
        this.stats.comboTimer = 0;
      }
    }
  }

  private updateParticlesAndText(dt: number) {
    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      p.alpha -= p.decay * dt;

      if (p.shrink && p.size > 0.4) {
        p.size = Math.max(0.3, p.size - p.decay * dt * (p.size * 1.3));
      }

      if (p.shape === 'shockwave' && p.radius && p.maxRadius) {
        p.radius += (p.maxRadius - p.radius) * 12 * dt;
      }

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Floating text
    for (let i = this.floatTexts.length - 1; i >= 0; i--) {
      const ft = this.floatTexts[i];
      ft.y += ft.vy * dt * 60;
      ft.alpha -= 1.2 * dt;
      if (ft.alpha <= 0) {
        this.floatTexts.splice(i, 1);
      }
    }
  }

  private getMaxParticles(): number {
    const quality = this.videoSettings?.particleQuality || 'MEDIUM';
    switch (quality) {
      case 'LOW':
        return 180;
      case 'MEDIUM':
        return 420;
      case 'HIGH':
        return 800;
      default:
        return 420;
    }
  }

  private createParticle(
    x: number,
    y: number,
    vx: number,
    vy: number,
    color: string,
    size: number,
    duration: number = 0.3,
    shape: 'circle' | 'spark' | 'ring' | 'shockwave' | 'trail' = 'circle',
    shrink: boolean = false
  ) {
    const maxParticles = this.getMaxParticles();
    if (this.particles.length >= maxParticles) {
      this.particles.shift();
    }
    this.particles.push({
      x,
      y,
      vx,
      vy,
      size,
      color,
      alpha: 1,
      decay: 1 / Math.max(0.04, duration),
      shape,
      shrink,
    });
  }

  private spawnFloatText(x: number, y: number, text: string, color: string = '#ffffff') {
    if (this.floatTexts.length > 12) {
      this.floatTexts.shift();
    }
    this.floatTexts.push({
      id: `ft_${++this.idCounter}`,
      x,
      y,
      text,
      color,
      alpha: 1,
      vy: -1.2,
    });
  }

  private checkAchievements() {
    for (const ach of this.achievements) {
      if (ach.unlocked) continue;

      let shouldUnlock = false;

      if (ach.id === 'first_kill' && this.stats.enemiesDefeated >= 1) {
        shouldUnlock = true;
      } else if (ach.id === 'combo_10' && this.stats.currentCombo >= 10) {
        shouldUnlock = true;
      } else if (ach.id === 'wave_5' && this.stats.wave >= 5) {
        shouldUnlock = true;
      } else if (ach.id === 'boss_slayer' && this.bossSpawnedThisWave && this.enemies.filter((e) => e.type === 'BOSS').length === 0 && this.stats.wave > 5) {
        shouldUnlock = true;
      } else if (ach.id === 'crystal_collector' && this.stats.crystalsCollected >= 100) {
        shouldUnlock = true;
      } else if (ach.id === 'max_level' && this.player.level >= 10) {
        shouldUnlock = true;
      }

      if (shouldUnlock) {
        ach.unlocked = true;
        if (this.onAchievementUnlockedCallback) {
          this.onAchievementUnlockedCallback(ach);
        }
      }
    }
  }
}
