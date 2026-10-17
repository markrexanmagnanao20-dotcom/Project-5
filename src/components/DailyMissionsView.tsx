/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DailyMission, DailyMissionsData, MissionCategory } from '../types/game';
import {
  Crosshair,
  Flame,
  Skull,
  Zap,
  Gem,
  Sparkles,
  Gauge,
  Trophy,
  Shield,
  Target,
  CheckCircle2,
  Clock,
  Gift,
  Wrench,
  ChevronRight,
} from 'lucide-react';
import { getTimeUntilMidnight } from '../data/missions';
import { sound } from '../services/soundEffects';

interface DailyMissionsViewProps {
  missionsData: DailyMissionsData;
  credits: number;
  onClaimMission: (missionId: string) => void;
  onClaimAllBonus: () => void;
  onOpenTechFoundry?: () => void;
  compact?: boolean;
}

const getCategoryColor = (category: MissionCategory) => {
  switch (category) {
    case 'COMBAT':
      return {
        badge: 'bg-rose-950/70 border-rose-500/50 text-rose-300',
        bar: 'bg-rose-500',
        glow: 'shadow-rose-500/30',
        iconBg: 'bg-rose-900/30 text-rose-400 border-rose-700/50',
      };
    case 'COLLECTION':
      return {
        badge: 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300',
        bar: 'bg-cyan-500',
        glow: 'shadow-cyan-500/30',
        iconBg: 'bg-cyan-900/30 text-cyan-400 border-cyan-700/50',
      };
    case 'MASTERY':
      return {
        badge: 'bg-amber-950/70 border-amber-500/50 text-amber-300',
        bar: 'bg-amber-500',
        glow: 'shadow-amber-500/30',
        iconBg: 'bg-amber-900/30 text-amber-400 border-amber-700/50',
      };
    case 'SURVIVAL':
      return {
        badge: 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300',
        bar: 'bg-emerald-500',
        glow: 'shadow-emerald-500/30',
        iconBg: 'bg-emerald-900/30 text-emerald-400 border-emerald-700/50',
      };
  }
};

const renderMissionIcon = (iconName: string) => {
  const props = { className: 'w-4 h-4' };
  switch (iconName) {
    case 'Crosshair':
      return <Crosshair {...props} />;
    case 'Flame':
      return <Flame {...props} />;
    case 'Skull':
      return <Skull {...props} />;
    case 'Zap':
      return <Zap {...props} />;
    case 'Gem':
      return <Gem {...props} />;
    case 'Sparkles':
      return <Sparkles {...props} />;
    case 'Gauge':
      return <Gauge {...props} />;
    case 'Trophy':
      return <Trophy {...props} />;
    case 'Shield':
      return <Shield {...props} />;
    case 'Target':
      return <Target {...props} />;
    default:
      return <Crosshair {...props} />;
  }
};

export const DailyMissionsView: React.FC<DailyMissionsViewProps> = ({
  missionsData,
  credits,
  onClaimMission,
  onClaimAllBonus,
  onOpenTechFoundry,
  compact = false,
}) => {
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      setTimeUntilReset(getTimeUntilMidnight().formatted);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const { missions, allCompletedBonusClaimed, bonusReward } = missionsData;
  const allMissionsFinished = missions.length === 3 && missions.every((m) => m.completed);
  const claimableCount = missions.filter((m) => m.completed && !m.claimed).length;

  return (
    <div className="w-full rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 backdrop-blur-md shadow-xl flex flex-col gap-4">
      {/* Directives Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-950/70 border border-amber-500/50 text-amber-400">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black tracking-wider uppercase text-white font-mono">
                DAILY TACTICAL DIRECTIVES
              </h3>
              {claimableCount > 0 && (
                <span className="animate-pulse px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/60 text-emerald-400 text-[10px] font-bold font-mono">
                  {claimableCount} READY TO CLAIM
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Complete daily combat objectives for bonus Aether Credits
            </p>
          </div>
        </div>

        {/* Countdown & Credits Info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Reset in {timeUntilReset || '--:--:--'}</span>
          </div>

          {onOpenTechFoundry && (
            <button
              onClick={onOpenTechFoundry}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-950 border border-slate-700/80 hover:border-cyan-500/60 text-xs font-mono font-bold text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tech Foundry</span>
              <ChevronRight className="w-3 h-3 opacity-60" />
            </button>
          )}
        </div>
      </div>

      {/* 3 Daily Missions Grid */}
      <div className={`grid gap-3 ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
        {missions.map((mission) => {
          const styling = getCategoryColor(mission.category);
          const percent = Math.min(100, Math.round((mission.current / mission.target) * 100));
          const canClaim = mission.completed && !mission.claimed;

          return (
            <div
              key={mission.id}
              className={`relative flex flex-col justify-between p-3.5 rounded-xl border transition-all ${
                mission.claimed
                  ? 'bg-slate-950/40 border-slate-800/60 opacity-80'
                  : canClaim
                  ? 'bg-slate-950/80 border-emerald-500/50 shadow-lg shadow-emerald-950/30'
                  : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Category & Reward Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-md border ${styling.iconBg}`}
                    >
                      {renderMissionIcon(mission.icon)}
                    </div>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${styling.badge}`}
                    >
                      {mission.category}
                    </span>
                  </div>

                  <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-500/30">
                    <span className="text-amber-400">✦</span>
                    +{mission.rewardCredits} AC
                  </span>
                </div>

                {/* Title & Description */}
                <h4 className="text-xs font-bold text-white mb-1 tracking-wide">
                  {mission.title}
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                  {mission.description}
                </p>
              </div>

              {/* Progress & Action Bottom Bar */}
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                  <span className="text-slate-400">PROGRESS</span>
                  <span
                    className={
                      mission.completed ? 'text-emerald-400 font-bold' : 'text-slate-300'
                    }
                  >
                    {mission.current.toLocaleString()} / {mission.target.toLocaleString()} ({percent}%)
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      mission.completed ? 'bg-emerald-400' : styling.bar
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                {/* Action button: Claim or Status */}
                {canClaim ? (
                  <button
                    onClick={() => {
                      sound.playCreditReward();
                      onClaimMission(mission.id);
                    }}
                    className="w-full py-1.5 rounded-lg bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-mono font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 animate-pulse"
                  >
                    <Gift className="w-3.5 h-3.5 fill-slate-950" />
                    <span>CLAIM +{mission.rewardCredits} AC</span>
                  </button>
                ) : mission.claimed ? (
                  <div className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400/90 text-xs font-mono font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>DIRECTIVE COMPLETED</span>
                  </div>
                ) : (
                  <div className="py-1 text-center text-[10px] font-mono text-slate-500">
                    Sortie active · Objective in progress
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Completionist Grand Bonus Crate */}
      {allMissionsFinished && (
        <div className="mt-1 p-3.5 rounded-xl bg-linear-to-r from-amber-950/60 via-slate-900 to-amber-950/60 border border-amber-500/60 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg shadow-amber-950/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-400 text-amber-300">
              <Trophy className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <span className="text-xs font-black tracking-wider uppercase text-amber-300 font-mono block">
                DIRECTIVES MASTER CRATE UNLOCKED!
              </span>
              <p className="text-[11px] text-slate-300">
                All 3 daily tactical directives satisfied. Grand completion bonus available.
              </p>
            </div>
          </div>

          <div>
            {!allCompletedBonusClaimed ? (
              <button
                onClick={() => {
                  sound.playCreditReward();
                  onClaimAllBonus();
                }}
                className="px-4 py-2 rounded-xl bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs font-mono uppercase tracking-wider shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Gift className="w-4 h-4 fill-slate-950" />
                <span>CLAIM +{bonusReward} BONUS AC</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>GRAND BONUS CLAIMED (+{bonusReward} AC)</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
