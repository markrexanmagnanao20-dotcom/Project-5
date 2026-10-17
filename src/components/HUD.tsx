/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameMode, GameStats, PlayerState, VideoSettings, Enemy, BossWarningEvent } from '../types/game';
import { Pause, Volume2, VolumeX, Zap, Shield, Heart, Sparkles, Skull, AlertTriangle, Crown, Flame } from 'lucide-react';
import { SHIPS } from '../game/constants';
import { getSectorForWave } from '../game/cosmos';

interface HUDProps {
  player: PlayerState;
  stats: GameStats;
  isMuted: boolean;
  videoSettings: VideoSettings;
  activeUpgrades: Record<string, number>;
  gameMode?: GameMode;
  activeBoss?: Enemy;
  bossWarning?: BossWarningEvent | null;
  onToggleMute: () => void;
  onPause: () => void;
  onTriggerDash: () => void;
  onTriggerSpecial: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  player,
  stats,
  isMuted,
  activeUpgrades,
  gameMode = 'ENDLESS',
  activeBoss,
  bossWarning,
  onToggleMute,
  onPause,
  onTriggerDash,
  onTriggerSpecial,
}) => {
  const shipConfig = SHIPS[player.shipId] || SHIPS.valkyrie;
  const currentSector = getSectorForWave(stats.wave, gameMode);
  const healthPercent = Math.max(0, Math.min(100, (player.health / player.maxHealth) * 100));
  const shieldPercent = Math.max(0, Math.min(100, (player.shield / player.maxShield) * 100));
  const xpPercent = Math.max(0, Math.min(100, (player.xp / player.xpToNextLevel) * 100));
  const specialPercent = Math.max(0, Math.min(100, (player.specialMeter / player.maxSpecialMeter) * 100));
  const dashReady = player.dashCooldown <= 0;
  const specialReady = player.specialMeter >= player.maxSpecialMeter;

  // Format score
  const scoreDisplay = stats.score.toLocaleString();

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 select-none md:p-5">
      {/* SCREEN-SPANNING SEGMENTED BOSS HEALTH BAR (Appears during Boss Raid Encounters) */}
      {activeBoss && (
        <div className="w-full max-w-4xl mx-auto mb-3 pointer-events-auto transition-all animate-in fade-in duration-300">
          {/* Sub-phase Warning Animation Banner */}
          {bossWarning && (
            <div className="mb-2 py-1.5 px-4 rounded-xl bg-gradient-to-r from-red-600/90 via-amber-500/95 to-red-600/90 border border-amber-300 shadow-2xl shadow-red-500/40 text-white flex items-center justify-between text-xs font-black tracking-wider uppercase animate-pulse">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-200 animate-bounce" />
                <span className="font-mono text-amber-100 drop-shadow-md">
                  «« {bossWarning.title} »»
                </span>
              </div>
              <span className="hidden sm:inline font-mono text-[11px] text-amber-100 font-bold tracking-widest">
                {bossWarning.subtitle}
              </span>
            </div>
          )}

          {/* Boss Header Info Container */}
          <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-slate-950/90 border border-slate-700/80 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
              {/* Left: Classification Badge & Name */}
              <div className="flex items-center gap-2">
                {activeBoss.customData?.isMegaBoss ? (
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-linear-to-r from-amber-500/30 to-red-600/30 border border-amber-400 text-amber-300 font-black font-mono text-[10px] tracking-widest shadow-md shadow-amber-500/20 animate-pulse">
                    <Crown className="w-3.5 h-3.5 text-amber-300" />
                    MEGA TITAN CLASS V
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-red-950/80 border border-red-500/60 text-red-400 font-bold font-mono text-[10px] tracking-wider">
                    <Skull className="w-3 h-3 text-red-400" />
                    TITAN CLASS IV
                  </span>
                )}
                <span className="font-black font-mono text-white tracking-wider text-sm drop-shadow-sm">
                  {activeBoss.customData?.bossName || (activeBoss.customData?.isMegaBoss ? 'APOCALYPSE-CLASS MEGA TITAN' : 'OMEGA-TITAN "GORGON"')}
                </span>
              </div>

              {/* Right: Sub-Phase Tag & Hull Readout */}
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider bg-slate-900 border border-slate-700 text-cyan-300">
                  {activeBoss.customData?.phaseName || `SUB-PHASE ${activeBoss.customData?.bossPhase || 1}`}
                </span>
                <span className="font-mono text-xs font-bold text-slate-300">
                  {Math.ceil(activeBoss.health).toLocaleString()} / {Math.ceil(activeBoss.maxHealth).toLocaleString()} HP ({Math.round(Math.max(0, Math.min(100, (activeBoss.health / activeBoss.maxHealth) * 100)))}%)
                </span>
              </div>
            </div>

            {/* Screen-Spanning 3-Segmented Health Bar */}
            {(() => {
              const totalPct = Math.max(0, Math.min(100, (activeBoss.health / activeBoss.maxHealth) * 100));
              // Segment 1 (First 33.33% / Phase 3), Segment 2 (33.33-66.66% / Phase 2), Segment 3 (66.66-100% / Phase 1)
              const seg3 = Math.max(0, Math.min(100, ((totalPct - 66.66) / 33.34) * 100));
              const seg2 = Math.max(0, Math.min(100, ((totalPct - 33.33) / 33.33) * 100));
              const seg1 = Math.max(0, Math.min(100, (totalPct / 33.33) * 100));

              const isMega = activeBoss.customData?.isMegaBoss;

              return (
                <div className="grid grid-cols-3 gap-1.5 h-3.5 w-full bg-slate-900/90 p-0.5 rounded-lg border border-slate-800">
                  {/* Segment I (Phase 3 Core) */}
                  <div className="relative h-full overflow-hidden rounded bg-slate-950/80 border border-slate-800">
                    <div
                      className={`h-full transition-all duration-150 ${
                        isMega
                          ? 'bg-linear-to-r from-red-600 via-amber-500 to-red-500'
                          : 'bg-linear-to-r from-red-600 to-rose-500'
                      }`}
                      style={{ width: `${seg1}%` }}
                    />
                    {seg1 <= 0 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-red-950/40 text-[9px] font-mono text-red-500/70 font-bold tracking-widest">
                        CORE BREACHED
                      </div>
                    )}
                  </div>

                  {/* Segment II (Phase 2 Flux) */}
                  <div className="relative h-full overflow-hidden rounded bg-slate-950/80 border border-slate-800">
                    <div
                      className={`h-full transition-all duration-150 ${
                        isMega
                          ? 'bg-linear-to-r from-amber-500 to-yellow-400'
                          : 'bg-linear-to-r from-amber-500 to-orange-400'
                      }`}
                      style={{ width: `${seg2}%` }}
                    />
                    {seg2 <= 0 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-amber-950/40 text-[9px] font-mono text-amber-500/70 font-bold tracking-widest">
                        FLUX OFFLINE
                      </div>
                    )}
                  </div>

                  {/* Segment III (Phase 1 Outer Hull) */}
                  <div className="relative h-full overflow-hidden rounded bg-slate-950/80 border border-slate-800">
                    <div
                      className={`h-full transition-all duration-150 ${
                        isMega
                          ? 'bg-linear-to-r from-cyan-400 to-emerald-400'
                          : 'bg-linear-to-r from-sky-400 to-cyan-300'
                      }`}
                      style={{ width: `${seg3}%` }}
                    />
                    {seg3 <= 0 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-cyan-950/40 text-[9px] font-mono text-cyan-500/70 font-bold tracking-widest">
                        SHIELDS DEPLETED
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-4">
        {/* Left: Level & XP Bar */}
        <div className="flex flex-col gap-1.5 w-44 sm:w-60">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <Sparkles className="w-3.5 h-3.5" />
              LVL {player.level}
            </span>
            <span className="text-slate-400 text-[11px]">
              {Math.floor(player.xp)} / {player.xpToNextLevel} XP
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-900/80 border border-slate-700/60 backdrop-blur-xs">
            <div
              className="h-full bg-linear-to-r from-cyan-500 to-sky-300 transition-all duration-150"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>

        {/* Center: Wave & Score & Sector & Combo */}
        <div className="flex flex-col items-center">
          <div className="text-xl sm:text-2xl font-black tracking-wider text-white drop-shadow-md font-mono">
            {scoreDisplay}
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs font-medium text-slate-400">
            <span>WAVE {stats.wave}</span>
            <span className="text-slate-600">·</span>
            <span
              className="font-mono text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-900/80 border backdrop-blur-xs"
              style={{
                color: currentSector.accentHex,
                borderColor: `${currentSector.accentHex}40`,
              }}
            >
              {currentSector.name.toUpperCase()}
            </span>
            {stats.currentCombo > 1 && stats.comboTimer > 0 && (
              <>
                <span className="text-slate-600">·</span>
                <span className="flex items-center gap-1 font-mono font-bold text-amber-400">
                  <Flame className="w-3 h-3 text-amber-400 animate-pulse" />
                  {(stats.comboMultiplier || Math.min(5.0, 1 + (stats.currentCombo - 1) * 0.1)).toFixed(1)}x MULTIPLIER
                </span>
              </>
            )}
          </div>

          {/* Active Combo Multiplier Pill with 3-Second Window Countdown */}
          {stats.currentCombo > 1 && stats.comboTimer > 0 && (
            <div className="mt-1 flex flex-col items-center animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-950/90 border border-amber-500/70 shadow-lg shadow-amber-500/20 backdrop-blur-md">
                <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="font-mono text-[11px] font-black tracking-wider text-amber-300">
                  {stats.currentCombo} KILLS
                </span>
                <span className="text-slate-600 font-mono text-[10px]">·</span>
                <span className="font-mono text-xs font-black bg-linear-to-r from-amber-400 via-orange-400 to-rose-400 bg-clip-text text-transparent tracking-wide">
                  {(stats.comboMultiplier || Math.min(5.0, 1 + (stats.currentCombo - 1) * 0.1)).toFixed(1)}x SCORE
                </span>
              </div>
              {/* Draining 3-Second Window Indicator */}
              <div className="w-24 sm:w-28 h-1 mt-0.5 rounded-full bg-slate-900/90 overflow-hidden border border-amber-950/60">
                <div
                  className="h-full bg-linear-to-r from-amber-400 to-orange-500 transition-all duration-75"
                  style={{ width: `${Math.max(0, Math.min(100, (stats.comboTimer / 3.0) * 100))}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right: Quick Action Controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={onToggleMute}
            aria-label="Toggle sound"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors backdrop-blur-xs"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
          <button
            onClick={onPause}
            aria-label="Pause game"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors backdrop-blur-xs"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Middle: Floating notifications or Active Upgrades List */}
      <div className="flex items-center justify-start gap-1.5 flex-wrap max-w-md">
        {Object.entries(activeUpgrades).map(([key, level]) => (
          <div
            key={key}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900/85 border border-slate-800 text-[11px] font-medium text-slate-300 backdrop-blur-xs"
          >
            <span className="capitalize">{key.replace('_', ' ')}</span>
            <span className="text-cyan-400 font-bold">T{level}</span>
          </div>
        ))}
      </div>

      {/* Bottom Bar: Health, Shield, Dash & Ultimate */}
      <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-3">
        {/* Left: Hull & Shield Bars */}
        <div className="flex flex-col gap-2 w-56 sm:w-72 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 backdrop-blur-md">
          {/* Hull / Health Bar */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-rose-400 font-semibold text-[11px]">
                <Heart className="w-3.5 h-3.5 fill-rose-500/20" />
                HULL
              </span>
              <span className="text-slate-300 font-mono text-[11px]">
                {Math.ceil(player.health)} / {player.maxHealth}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-900 border border-rose-950/40">
              <div
                className={`h-full transition-all duration-150 ${
                  healthPercent < 25
                    ? 'bg-rose-600 animate-pulse'
                    : healthPercent < 50
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${healthPercent}%` }}
              />
            </div>
          </div>

          {/* Shield Bar */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-cyan-400 font-semibold text-[11px]">
                <Shield className="w-3.5 h-3.5 fill-cyan-500/20" />
                SHIELD
              </span>
              <span className="text-slate-300 font-mono text-[11px]">
                {Math.ceil(player.shield)} / {player.maxShield}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-900 border border-cyan-950/40">
              <div
                className="h-full bg-cyan-400 transition-all duration-150"
                style={{ width: `${shieldPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Quick Action Ability Triggers (Dash & Special) */}
        <div className="pointer-events-auto flex items-center gap-2.5">
          {/* Dash Button */}
          <button
            onClick={onTriggerDash}
            disabled={!dashReady}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              dashReady
                ? 'bg-sky-950/80 border-sky-500/50 text-sky-200 hover:bg-sky-900/80 cursor-pointer shadow-lg shadow-sky-950/40'
                : 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Zap className="w-4 h-4 text-sky-400" />
            <span>DASH</span>
            <span className="hidden sm:inline text-[10px] opacity-60">
              {dashReady ? '[Shift]' : `${player.dashCooldown.toFixed(1)}s`}
            </span>
          </button>

          {/* Ultimate / Special Button */}
          <button
            onClick={onTriggerSpecial}
            disabled={!specialReady}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              specialReady
                ? 'bg-linear-to-r from-amber-500 to-rose-500 border-amber-300 text-white cursor-pointer shadow-lg shadow-amber-500/30 animate-pulse'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{shipConfig.specialName}</span>
            <span className="hidden sm:inline text-[10px] opacity-75">
              {specialReady ? '[Space]' : `${Math.floor(specialPercent)}%`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
