/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { CommanderCosmetic, CommanderRewardResult } from '../types/game';
import { Award, Check, Sparkles, Shield, Heart, Zap, Flame, Eye } from 'lucide-react';

interface CommanderRewardModalProps {
  reward: CommanderRewardResult;
  onEquip: (cosmetic: CommanderCosmetic) => void;
  onContinue: () => void;
  onOpenArmory: () => void;
}

export const CommanderRewardModal: React.FC<CommanderRewardModalProps> = ({
  reward,
  onEquip,
  onContinue,
  onOpenArmory,
}) => {
  const { cosmetic, isNewUnlock, playerHealthPercent, tier, bossName, creditsBonus } = reward;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animated visual preview of the cosmetic in the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;
    const particles: { x: number; y: number; vx: number; vy: number; color: string; size: number; alpha: number; decay: number; shape: string }[] = [];

    const render = () => {
      time += 0.03;
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Starfield dots
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      for (let i = 0; i < 20; i++) {
        const sx = ((i * 37) + time * 15) % canvas.width;
        const sy = (i * 23) % canvas.height;
        ctx.fillRect(sx, sy, 1.2, 1.2);
      }

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      if (cosmetic.type === 'TRAIL') {
        // Ship moving smoothly horizontally in center
        const shipX = centerX + 40;
        const shipY = centerY;

        // Emit particles from back of ship
        for (let i = 0; i < 2; i++) {
          let pColor = cosmetic.previewColor;
          let pShape = 'trail';
          let pSize = 3.5 + Math.random() * 2;

          if (cosmetic.id === 'trail_supernova') {
            pColor = Math.random() < 0.4 ? '#ffffff' : Math.random() < 0.7 ? '#fde047' : '#f59e0b';
            pShape = Math.random() < 0.35 ? 'spark' : 'trail';
          } else if (cosmetic.id === 'trail_void') {
            pColor = Math.random() < 0.5 ? '#c084fc' : '#a855f7';
          } else if (cosmetic.id === 'trail_berserker') {
            pColor = Math.random() < 0.5 ? '#ef4444' : '#f97316';
            pShape = Math.random() < 0.4 ? 'spark' : 'trail';
          } else if (cosmetic.id === 'trail_emerald_hyper') {
            pColor = Math.random() < 0.5 ? '#34d399' : '#10b981';
          }

          particles.push({
            x: shipX - 16,
            y: shipY + (Math.random() - 0.5) * 8,
            vx: -3.5 - Math.random() * 2,
            vy: (Math.random() - 0.5) * 1.5,
            color: pColor,
            size: pSize,
            alpha: 1,
            decay: 0.035,
            shape: pShape,
          });
        }

        // Draw Ship Silhouette
        ctx.save();
        ctx.translate(shipX, shipY);
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(16, 0);
        ctx.lineTo(-14, -12);
        ctx.lineTo(-8, 0);
        ctx.lineTo(-14, 12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Cockpit
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(4, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        // WEAPON EFFECT PREVIEW: Draw firing plasma projectiles across canvas
        if (Math.floor(time * 30) % 18 === 0) {
          particles.push({
            x: 40,
            y: centerY,
            vx: 6,
            vy: 0,
            color: cosmetic.previewColor,
            size: 6,
            alpha: 1,
            decay: 0.015,
            shape: 'bullet',
          });
        }
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0 || p.x < 0 || p.x > canvas.width) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;

        if (p.shape === 'bullet') {
          // Projectile beam
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.size * 2, p.size, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();

          // Trailing sparks
          if (Math.random() < 0.6) {
            particles.push({
              x: p.x - 8,
              y: p.y + (Math.random() - 0.5) * 4,
              vx: -1,
              vy: (Math.random() - 0.5) * 1.5,
              color: cosmetic.accentColor,
              size: 2.5,
              alpha: 0.8,
              decay: 0.06,
              shape: 'spark',
            });
          }
        } else if (p.shape === 'spark') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.7, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [cosmetic]);

  const tierDetails = {
    FLAWLESS: {
      label: 'FLAWLESS COMMANDER',
      color: 'text-amber-400',
      border: 'border-amber-400/80',
      bg: 'bg-amber-950/60',
      description: 'Supreme tactical precision! Defeated the Mega Titan while sustaining minimal damage (≥80% Hull).',
    },
    HARDENED: {
      label: 'BATTLE-HARDENED COMMANDER',
      color: 'text-purple-400',
      border: 'border-purple-400/80',
      bg: 'bg-purple-950/60',
      description: 'Relentless endurance! Endured severe orbital bombardment and retaliated with lethal force (40%–79% Hull).',
    },
    CRITICAL: {
      label: 'BERSERKER SURVIVOR',
      color: 'text-rose-400',
      border: 'border-rose-400/80',
      bg: 'bg-rose-950/60',
      description: 'Clutched from the brink of total destruction! Slew the Mega Titan under critical hull failure (<40% Hull).',
    },
  }[tier];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 sm:p-7 flex flex-col gap-5 overflow-hidden">
        {/* Glow ambient backing */}
        <div
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ backgroundColor: cosmetic.previewColor }}
        />

        {/* Header Ribbon */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-400/60 text-amber-300">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-amber-400">
                MEGA TITAN SLAIN · COMMANDER'S REWARD
              </span>
              <h2 className="text-xl font-black text-white tracking-wide font-mono">
                {bossName}
              </h2>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-amber-950/80 border border-amber-500/60 text-amber-300">
            +{creditsBonus} AC
          </span>
        </div>

        {/* Victory Hull Assessment Card */}
        <div className={`p-3.5 rounded-xl border ${tierDetails.border} ${tierDetails.bg} flex flex-col gap-2`}>
          <div className="flex items-center justify-between text-xs font-bold font-mono">
            <span className={`flex items-center gap-1.5 ${tierDetails.color}`}>
              <Shield className="w-4 h-4" />
              {tierDetails.label}
            </span>
            <span className="flex items-center gap-1.5 text-white">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
              {playerHealthPercent}% HULL INTEGRITY
            </span>
          </div>

          {/* Health Bar */}
          <div className="h-2 w-full rounded-full bg-slate-950 overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all ${
                playerHealthPercent >= 80
                  ? 'bg-amber-400'
                  : playerHealthPercent >= 40
                  ? 'bg-purple-400'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${playerHealthPercent}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
            {tierDetails.description}
          </p>
        </div>

        {/* Cosmetic Reward Card */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider bg-slate-900 border border-slate-700 text-slate-300">
                  {cosmetic.type === 'TRAIL' ? 'SHIP THRUSTER TRAIL' : 'WEAPON PLASMA EFFECT'}
                </span>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-black tracking-wider uppercase border"
                  style={{
                    color: cosmetic.previewColor,
                    borderColor: `${cosmetic.previewColor}60`,
                    backgroundColor: `${cosmetic.previewColor}15`,
                  }}
                >
                  {cosmetic.rarity}
                </span>
              </div>
              <h3 className="text-lg font-black text-white font-mono flex items-center gap-2">
                <Sparkles className="w-4 h-4" style={{ color: cosmetic.previewColor }} />
                {cosmetic.name}
              </h3>
            </div>

            {isNewUnlock ? (
              <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-black uppercase bg-emerald-950/80 border border-emerald-500/60 text-emerald-400 animate-pulse">
                NEW UNLOCKED
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase bg-slate-900 border border-slate-700 text-slate-400">
                ALREADY OWNED
              </span>
            )}
          </div>

          {/* Interactive Animated Preview Canvas */}
          <div className="relative rounded-lg overflow-hidden border border-slate-800/90 shadow-inner">
            <canvas
              ref={canvasRef}
              width={500}
              height={100}
              className="w-full h-24 object-cover"
            />
            <div className="absolute bottom-1 right-2 text-[10px] font-mono text-slate-500 font-bold">
              LIVE VISUAL SIMULATION
            </div>
          </div>

          <p className="text-xs text-slate-300 font-sans leading-relaxed">
            {cosmetic.description}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            onClick={onOpenArmory}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 hover:border-slate-600 bg-slate-800/80 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>View in Armory</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onContinue}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              Continue Run
            </button>
            <button
              onClick={() => onEquip(cosmetic)}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-linear-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 text-xs font-black tracking-wider uppercase shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Equip Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
