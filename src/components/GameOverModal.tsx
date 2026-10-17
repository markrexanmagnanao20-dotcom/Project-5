import React from 'react';
import { DailyMissionsData, GameMode, GameStats } from '../types/game';
import { RotateCcw, Home, Trophy, Skull, Target, Gift, CheckCircle2, Award } from 'lucide-react';
import { getSectorForWave } from '../game/cosmos';
import { sound } from '../services/soundEffects';

interface GameOverModalProps {
  stats: GameStats;
  gameMode?: GameMode;
  isNewHighScore: boolean;
  dailyMissions?: DailyMissionsData;
  onClaimMission?: (missionId: string) => void;
  onRestart: () => void;
  onReturnToMenu: () => void;
  onOpenArmory?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  gameMode = 'ENDLESS',
  isNewHighScore,
  dailyMissions,
  onClaimMission,
  onRestart,
  onReturnToMenu,
  onOpenArmory,
}) => {
  const currentSector = getSectorForWave(stats.wave, gameMode);
  const accuracy =
    stats.shotsFired > 0
      ? Math.min(100, Math.round((stats.shotsHit / stats.shotsFired) * 100))
      : 0;

  const minutes = Math.floor(stats.timeSurvived / 60);
  const seconds = Math.floor(stats.timeSurvived % 60);
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center">
        {/* Skull Icon */}
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-500 mb-4 animate-bounce">
          <Skull className="w-7 h-7" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-black tracking-wider uppercase text-white font-mono mb-1">
          HULL BREACH DETECTED
        </h2>
        <p className="text-xs text-rose-400 font-semibold mb-6">
          Vessel telemetry lost in deep space
        </p>

        {/* Score Display */}
        <div className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 mb-6 flex flex-col items-center">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">
            FINAL SCORE
          </span>
          <span className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
            {stats.score.toLocaleString()}
          </span>

          {isNewHighScore && (
            <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <Trophy className="w-4 h-4" />
              <span>NEW RECORD ESTABLISHED</span>
            </div>
          )}
        </div>

        {/* Detailed Run Telemetry Grid */}
        <div className="grid grid-cols-2 gap-3 w-full mb-8 text-left">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">SECTOR / WAVE</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-base font-bold font-mono text-cyan-400">WAVE {stats.wave}</span>
            </div>
            <span
              className="text-[10px] font-mono font-semibold tracking-wider block mt-0.5 truncate"
              style={{ color: currentSector.accentHex }}
            >
              {currentSector.name}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">TARGETS DESTROYED</span>
            <span className="text-base font-bold font-mono text-emerald-400">{stats.enemiesDefeated}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">MEGA TITANS SLAIN</span>
            <span className="text-base font-bold font-mono text-amber-400">
              {stats.megaBossesDefeated || 0}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">MAX COMBO</span>
            <span className="text-base font-bold font-mono text-amber-400">{stats.maxCombo}x</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">SHARDS HARVESTED</span>
            <span className="text-base font-bold font-mono text-sky-400">{stats.crystalsCollected}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">FIRE ACCURACY</span>
            <span className="text-base font-bold font-mono text-slate-200">{accuracy}%</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">FLIGHT TIME</span>
            <span className="text-base font-bold font-mono text-slate-200">{timeFormatted}</span>
          </div>
        </div>

        {/* Daily Directives Progress Section */}
        {dailyMissions && dailyMissions.missions.length > 0 && (
          <div className="w-full p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 mb-6 text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                <Target className="w-3.5 h-3.5" />
                DAILY DIRECTIVES STATUS
              </span>
            </div>

            <div className="space-y-2">
              {dailyMissions.missions.map((m) => {
                const percent = Math.min(100, Math.round((m.current / m.target) * 100));
                const canClaim = m.completed && !m.claimed;

                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-3 text-xs p-2 rounded-lg bg-slate-900/60 border border-slate-800/80"
                  >
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-slate-200 truncate">{m.title}</span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {m.current}/{m.target}
                        </span>
                      </div>
                      <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            m.completed ? 'bg-emerald-400' : 'bg-cyan-400'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    <div className="shrink-0">
                      {canClaim && onClaimMission ? (
                        <button
                          onClick={() => {
                            sound.playCreditReward();
                            onClaimMission(m.id);
                          }}
                          className="px-2.5 py-1 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-mono font-bold uppercase transition-all shadow-xs cursor-pointer flex items-center gap-1 animate-pulse"
                        >
                          <Gift className="w-3 h-3" />
                          <span>+{m.rewardCredits}</span>
                        </button>
                      ) : m.claimed ? (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400/80">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Claimed</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-amber-300">
                          +{m.rewardCredits} AC
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full">
          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 stroke-[2.5]" />
            <span>Deploy Again</span>
          </button>
          {onOpenArmory && (
            <button
              onClick={onOpenArmory}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-amber-950/80 hover:bg-amber-900 border border-amber-500/60 text-amber-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>Armory</span>
            </button>
          )}
          <button
            onClick={onReturnToMenu}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Hangar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
