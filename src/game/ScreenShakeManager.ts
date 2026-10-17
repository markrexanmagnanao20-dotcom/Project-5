/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ShakeOffsets {
  x: number;
  y: number;
  rotation: number;
  trauma: number;
}

export type ExplosionMagnitude = 'small' | 'medium' | 'large' | 'boss';

/**
 * ScreenShakeManager
 * Provides subtle, tactile, non-nauseating camera vibrations for combat feedback.
 * Uses a quadratic trauma decay model (trauma^2) with rapid damping (~0.3s)
 * and multi-harmonic translational oscillations.
 */
export class ScreenShakeManager {
  private trauma: number = 0;
  // Rapid decay rate: settles smoothly back to stable center in ~0.3s
  private traumaDecay: number = 3.2;
  private time: number = 0;

  // Subtle maximum displacements at trauma = 1.0 (clamped so camera never jerks violently)
  private maxOffsetX: number = 5.5;
  private maxOffsetY: number = 5.5;

  // Directional recoil kick (decays rapidly)
  private dirX: number = 0;
  private dirY: number = 0;
  private dirDecay: number = 16.0;

  // Vibration frequency in Hertz (tight, crisp rumble)
  private baseFrequency: number = 32;

  private enabled: boolean = true;

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.reset();
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public reset() {
    this.trauma = 0;
    this.dirX = 0;
    this.dirY = 0;
    this.time = 0;
  }

  /**
   * Adds trauma clamped to [0, 1].
   */
  public addTrauma(amount: number) {
    if (!this.enabled) return;
    this.trauma = Math.min(1.0, this.trauma + Math.max(0, amount));
  }

  /**
   * Trigger subtle camera vibration from explosions.
   */
  public triggerExplosion(
    magnitude: ExplosionMagnitude = 'small',
    position?: { x: number; y: number },
    viewportCenter?: { x: number; y: number }
  ) {
    if (!this.enabled) return;

    let traumaAmount = 0.08;
    switch (magnitude) {
      case 'small':
        traumaAmount = 0.08;
        break;
      case 'medium':
        traumaAmount = 0.16;
        break;
      case 'large':
        traumaAmount = 0.28;
        break;
      case 'boss':
        traumaAmount = 0.52;
        break;
    }

    if (position && viewportCenter) {
      const dx = viewportCenter.x - position.x;
      const dy = viewportCenter.y - position.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 1) {
        const kickStrength = traumaAmount * 3.5;
        this.dirX += (dx / dist) * kickStrength;
        this.dirY += (dy / dist) * kickStrength;
      }
    }

    this.addTrauma(traumaAmount);
  }

  /**
   * Trigger subtle micro-vibration when striking a boss.
   */
  public triggerBossHit(damage: number, bossMaxHealth: number = 2000, hitAngle?: number) {
    if (!this.enabled) return;

    const ratio = Math.min(1, damage / Math.max(100, bossMaxHealth * 0.05));
    const traumaAmount = 0.05 + ratio * 0.06;

    if (hitAngle !== undefined) {
      const kick = traumaAmount * 1.5;
      this.dirX += Math.cos(hitAngle) * kick;
      this.dirY += Math.sin(hitAngle) * kick;
    }

    this.addTrauma(traumaAmount);
  }

  /**
   * Trigger camera vibration and recoil when player takes damage or shield breaks.
   */
  public triggerPlayerDamage(damageAmount: number, isShieldBreak: boolean = false, hitAngle?: number) {
    if (!this.enabled) return;

    let traumaAmount = Math.min(0.45, 0.18 + (damageAmount / 60) * 0.16);
    if (isShieldBreak) {
      traumaAmount = Math.max(traumaAmount, 0.36);
    }

    if (hitAngle !== undefined) {
      const kick = traumaAmount * 3.0;
      this.dirX += Math.cos(hitAngle) * kick;
      this.dirY += Math.sin(hitAngle) * kick;
    }

    this.addTrauma(traumaAmount);
  }

  /**
   * Trigger tactical ability concussive feedback (EMP shockwave, Siege barrage, etc.)
   */
  public triggerSpecialAbility(abilityType: 'EMP' | 'SIEGE' | 'TIME_WARP' | 'OVERDRIVE') {
    if (!this.enabled) return;

    switch (abilityType) {
      case 'EMP':
        this.addTrauma(0.36);
        break;
      case 'SIEGE':
        this.addTrauma(0.26);
        break;
      case 'TIME_WARP':
        this.addTrauma(0.16);
        break;
      case 'OVERDRIVE':
        this.addTrauma(0.22);
        break;
    }
  }

  /**
   * Advance vibration simulation by delta time
   */
  public update(dt: number): ShakeOffsets {
    const safeDt = Math.min(0.1, Math.max(0, dt));
    this.time += safeDt;

    // Fast trauma decay back to rest
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - this.traumaDecay * safeDt);
    }

    // Directional kick decay
    this.dirX *= Math.max(0, 1 - this.dirDecay * safeDt);
    this.dirY *= Math.max(0, 1 - this.dirDecay * safeDt);

    return this.getOffsets();
  }

  /**
   * Calculate current displacement offsets using quadratic trauma curve
   */
  public getOffsets(): ShakeOffsets {
    if (!this.enabled || this.trauma <= 0.005) {
      return { x: 0, y: 0, rotation: 0, trauma: 0 };
    }

    // Quadratic trauma response: gentle at low trauma, crisp at high trauma
    const shake = this.trauma * this.trauma;

    // Multi-harmonic synthesized vibration (subtle, non-wobbly)
    const t = this.time * this.baseFrequency;

    const harmX = Math.sin(t * 1.0) * 0.65 + Math.sin(t * 2.37) * 0.25 + Math.cos(t * 4.19) * 0.1;
    const harmY = Math.cos(t * 1.13 + 1.2) * 0.65 + Math.sin(t * 2.71 + 2.4) * 0.25 + Math.sin(t * 3.83) * 0.1;

    const x = harmX * this.maxOffsetX * shake + this.dirX;
    const y = harmY * this.maxOffsetY * shake + this.dirY;

    return {
      x,
      y,
      rotation: 0, // Zero rotation prevents screen tilt, corner clipping, and motion sickness
      trauma: this.trauma,
    };
  }
}
