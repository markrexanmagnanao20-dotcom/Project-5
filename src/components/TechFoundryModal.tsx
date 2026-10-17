/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Wrench, Shield, Gauge, Magnet, Zap, Check } from 'lucide-react';
import { sound } from '../services/soundEffects';

interface TechFoundryModalProps {
  credits: number;
  techUpgrades: Record<string, number>;
  onBuyUpgrade: (upgradeId: string, cost: number) => void;
  onClose: () => void;
}

interface TechItem {
  id: string;
  name: string;
  category: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  maxTier: number;
  icon: React.ReactNode;
  statBonus: (tier: number) => string;
}

const TECH_CATALOG: TechItem[] = [
  {
    id: 'hull_plating',
    name: 'Reinforced Nanite Plating',
    category: 'DEFENSE MATRIX',
    description: 'Permanently increases hull integrity across all deployed combat vessels.',
    baseCost: 200,
    costMultiplier: 1.5,
    maxTier: 5,
    icon: <Shield className="w-5 h-5 text-emerald-400" />,
    statBonus: (tier) => `+${tier * 15} Hull HP`,
  },
  {
    id: 'tachyon_thrusters',
    name: 'Tachyon Inertial Dampeners',
    category: 'PROPULSION',
    description: 'Enhances sub-light thruster output and combat agility for tighter evasive maneuvers.',
    baseCost: 250,
    costMultiplier: 1.6,
    maxTier: 5,
    icon: <Gauge className="w-5 h-5 text-cyan-400" />,
    statBonus: (tier) => `+${(tier * 0.4).toFixed(1)} Flight Speed`,
  },
  {
    id: 'crystal_magnet',
    name: 'Graviton Siphon Lattice',
    category: 'COLLECTION CORE',
    description: 'Expands natural gravity well to draw distant energy crystals into your vessel.',
    baseCost: 180,
    costMultiplier: 1.4,
    maxTier: 5,
    icon: <Magnet className="w-5 h-5 text-violet-400" />,
    statBonus: (tier) => `+${tier * 30} Attraction Radius`,
  },
  {
    id: 'overcharge_core',
    name: 'Tactical Overcharge Capacitor',
    category: 'WEAPON MATRIX',
    description: 'Pre-charges your tactical ultimate power generator at the start of every sortie.',
    baseCost: 300,
    costMultiplier: 1.7,
    maxTier: 5,
    icon: <Zap className="w-5 h-5 text-amber-400" />,
    statBonus: (tier) => `+${tier * 15}% Starting Special Charge`,
  },
];

export const TechFoundryModal: React.FC<TechFoundryModalProps> = ({
  credits,
  techUpgrades,
  onBuyUpgrade,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-950/80 border border-cyan-500/60 text-cyan-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wider uppercase text-white font-mono">
                FLEET TECH FOUNDRY
              </h2>
              <p className="text-xs text-slate-400">
                Calibrate permanent vessel upgrades using harvested Aether Credits
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold shadow-inner">
              <span className="text-amber-400">✦</span>
              <span>{credits.toLocaleString()} AC</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Upgrade Cards List */}
        <div className="p-6 overflow-y-auto space-y-4">
          {TECH_CATALOG.map((tech) => {
            const currentTier = techUpgrades[tech.id] || 0;
            const isMaxed = currentTier >= tech.maxTier;
            const cost = Math.round(tech.baseCost * Math.pow(tech.costMultiplier, currentTier));
            const canAfford = credits >= cost && !isMaxed;

            return (
              <div
                key={tech.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700/80 transition-all gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 border border-slate-800">
                    {tech.icon}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-white">{tech.name}</span>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-900 text-cyan-400 border border-cyan-900/50">
                        {tech.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-2 leading-relaxed">
                      {tech.description}
                    </p>

                    {/* Tier Progress Dots */}
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        {Array.from({ length: tech.maxTier }).map((_, idx) => (
                          <div
                            key={idx}
                            className={`h-1.5 w-5 rounded-full transition-all ${
                              idx < currentTier
                                ? 'bg-cyan-400 shadow-xs shadow-cyan-400/50'
                                : 'bg-slate-800'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] font-mono text-cyan-300 font-bold ml-1">
                        {currentTier > 0 ? tech.statBonus(currentTier) : 'Uncalibrated'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Buy Button */}
                <div className="flex sm:flex-col items-center justify-between sm:justify-center sm:items-end shrink-0 gap-2">
                  {isMaxed ? (
                    <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-400 text-xs font-bold font-mono">
                      <Check className="w-4 h-4" />
                      <span>MAX TIER</span>
                    </div>
                  ) : (
                    <button
                      disabled={!canAfford}
                      onClick={() => {
                        sound.playCreditReward();
                        onBuyUpgrade(tech.id, cost);
                      }}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                        canAfford
                          ? 'bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95'
                          : 'bg-slate-800/80 text-slate-500 cursor-not-allowed border border-slate-700/50'
                      }`}
                    >
                      <span>Upgrade Tier {currentTier + 1}</span>
                      <span className="opacity-90">({cost} AC)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Upgrades apply automatically to every combat ship deployed in sorties.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
