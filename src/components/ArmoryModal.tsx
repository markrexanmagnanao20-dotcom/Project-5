/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CommanderCosmetic, CommanderEquipped, CosmeticType, ShipId } from '../types/game';
import { MegaBossRecordStats } from '../services/storage';
import { X, Sparkles, Check, Lock, Award, Flame, Zap, Shield, RotateCcw } from 'lucide-react';
import { ThreeShipViewer } from './ThreeShipViewer';

interface ArmoryModalProps {
  cosmetics: CommanderCosmetic[];
  equipped: CommanderEquipped;
  megaStats: MegaBossRecordStats;
  onEquip: (type: CosmeticType, id: string | null) => void;
  onClose: () => void;
}

export const ArmoryModal: React.FC<ArmoryModalProps> = ({
  cosmetics,
  equipped,
  megaStats,
  onEquip,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'TRAIL' | 'WEAPON'>('ALL');
  const [previewShip, setPreviewShip] = useState<ShipId>('valkyrie');

  const filtered = cosmetics.filter((c) => {
    if (activeTab === 'ALL') return true;
    return c.type === activeTab;
  });

  const unlockedCount = cosmetics.filter((c) => c.unlocked).length;

  const equippedTrailColor = equipped.trailId
    ? cosmetics.find((c) => c.id === equipped.trailId)?.previewColor
    : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-4xl max-h-[90vh] rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/60 text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                COMMANDER'S REWARDS LOADOUT
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white font-mono">
                ARMORY & COSMETIC EFFECTS
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Commander Stats Ribbon */}
        <div className="grid grid-cols-3 gap-2 px-4 py-3 bg-slate-950/70 border-b border-slate-800 text-center text-xs">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-mono">MEGA TITANS SLAIN</span>
            <span className="font-mono font-bold text-amber-400 text-sm">
              {megaStats.kills}
            </span>
          </div>
          <div className="flex flex-col border-x border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-mono">BEST VICTORY HULL</span>
            <span className="font-mono font-bold text-cyan-400 text-sm">
              {megaStats.bestHealthPercent > 0 ? `${megaStats.bestHealthPercent}%` : '—'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-mono">COSMETICS UNLOCKED</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">
              {unlockedCount} / {cosmetics.length}
            </span>
          </div>
        </div>

        {/* 3D Three.js Interactive Hangar Bay */}
        <div className="px-4 sm:px-5 pt-3 pb-1">
          <div className="w-full h-40 sm:h-48 rounded-xl overflow-hidden border border-slate-800 shadow-inner relative">
            <ThreeShipViewer
              shipId={previewShip}
              trailColor={equippedTrailColor}
              interactive={true}
              className="h-full w-full"
            />
            {/* Quick ship selector in 3D dock */}
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-slate-950/85 p-1 rounded-lg border border-slate-800 text-[10px] font-mono z-10">
              {(['valkyrie', 'chronos', 'titan'] as ShipId[]).map((sid) => (
                <button
                  key={sid}
                  onClick={() => setPreviewShip(sid)}
                  className={`px-2 py-0.5 rounded capitalize transition-colors cursor-pointer ${
                    previewShip === sid
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {sid}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center justify-between px-4 sm:px-5 pt-3 pb-1 border-b border-slate-800 gap-2">
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Rewards
            </button>
            <button
              onClick={() => setActiveTab('TRAIL')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'TRAIL'
                  ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ship Trails</span>
            </button>
            <button
              onClick={() => setActiveTab('WEAPON')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'WEAPON'
                  ? 'bg-amber-950 border border-amber-500/50 text-amber-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Weapon Effects</span>
            </button>
          </div>

          {/* Reset to stock buttons */}
          <div className="flex items-center gap-2 text-xs">
            {equipped.trailId && (
              <button
                onClick={() => onEquip('TRAIL', null)}
                title="Reset to default ship thruster"
                className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-[11px]"
              >
                <RotateCcw className="w-3 h-3 text-cyan-400" />
                <span>Default Trail</span>
              </button>
            )}
            {equipped.weaponId && (
              <button
                onClick={() => onEquip('WEAPON', null)}
                title="Reset to default primary blaster"
                className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-[11px]"
              >
                <RotateCcw className="w-3 h-3 text-amber-400" />
                <span>Default Weapon</span>
              </button>
            )}
          </div>
        </div>

        {/* Cosmetics Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => {
            const isEquipped =
              (item.type === 'TRAIL' && equipped.trailId === item.id) ||
              (item.type === 'WEAPON' && equipped.weaponId === item.id);

            return (
              <div
                key={item.id}
                className={`relative rounded-xl border p-4 flex flex-col justify-between gap-3 transition-all ${
                  isEquipped
                    ? 'bg-slate-900 border-amber-400/90 shadow-lg shadow-amber-500/10'
                    : item.unlocked
                    ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                    : 'bg-slate-950/40 border-slate-900/80 opacity-65'
                }`}
              >
                {/* Header row */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider bg-slate-900 border border-slate-800 text-slate-300">
                        {item.type === 'TRAIL' ? 'THRUSTER TRAIL' : 'WEAPON PLASMA'}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-black tracking-wider uppercase border"
                        style={{
                          color: item.previewColor,
                          borderColor: `${item.previewColor}60`,
                          backgroundColor: `${item.previewColor}15`,
                        }}
                      >
                        {item.rarity}
                      </span>
                    </div>

                    {/* Color Swatch Circle */}
                    <div
                      className="h-4 w-4 rounded-full border border-white/40 shadow-sm"
                      style={{ backgroundColor: item.previewColor }}
                    />
                  </div>

                  <h3 className="text-base font-black text-white font-mono flex items-center gap-2">
                    <Sparkles className="w-4 h-4" style={{ color: item.previewColor }} />
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Requirement & Equip Status */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                    <Shield className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{item.healthRequirementLabel}</span>
                  </div>

                  {item.unlocked ? (
                    isEquipped ? (
                      <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-950/80 border border-amber-400/80 text-amber-300 font-bold font-mono text-xs">
                        <Check className="w-3.5 h-3.5" />
                        ACTIVE
                      </span>
                    ) : (
                      <button
                        onClick={() => onEquip(item.type, item.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold font-mono text-xs transition-colors cursor-pointer border border-slate-700"
                      >
                        EQUIP
                      </button>
                    )
                  ) : (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 font-mono text-[11px]">
                      <Lock className="w-3 h-3" />
                      LOCKED
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Banner */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Defeat Apocalypse-Class Mega Titans every 10 waves to earn and collect cosmetic rewards.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
