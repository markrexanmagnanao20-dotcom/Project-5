/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, RotateCcw, Home, Settings as SettingsIcon, Award } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onReturnToMenu: () => void;
  onOpenSettings: () => void;
  onOpenArmory?: () => void;
  sectorName?: string;
  sectorAccent?: string;
  wave?: number;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onReturnToMenu,
  onOpenSettings,
  onOpenArmory,
  sectorName,
  sectorAccent = '#38bdf8',
  wave,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl flex flex-col items-center text-center">
        <h2 className="text-xl font-black uppercase text-white font-mono tracking-wider mb-1">
          TACTICAL HOLD
        </h2>
        {sectorName && (
          <div className="flex items-center gap-1.5 mb-2">
            {wave !== undefined && (
              <span className="text-[11px] font-mono font-bold text-slate-400">
                WAVE {wave} ·
              </span>
            )}
            <span
              className="text-[11px] font-mono font-bold uppercase tracking-wider"
              style={{ color: sectorAccent }}
            >
              {sectorName}
            </span>
          </div>
        )}
        <p className="text-xs text-slate-400 mb-6">
          Engines idling, tactical sensors locked on standby
        </p>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={onResume}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Resume Sortie</span>
          </button>

          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart Mission</span>
          </button>

          {onOpenArmory && (
            <button
              onClick={onOpenArmory}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/50 text-amber-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>Commander Armory</span>
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            <SettingsIcon className="w-4 h-4" />
            <span>Settings</span>
          </button>

          <button
            onClick={onReturnToMenu}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-transparent hover:bg-slate-800/50 text-slate-400 hover:text-white font-medium text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Abort to Hangar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
