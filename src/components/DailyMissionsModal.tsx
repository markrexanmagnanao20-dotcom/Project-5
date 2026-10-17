/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Target } from 'lucide-react';
import { DailyMissionsData } from '../types/game';
import { DailyMissionsView } from './DailyMissionsView';

interface DailyMissionsModalProps {
  missionsData: DailyMissionsData;
  credits: number;
  onClaimMission: (missionId: string) => void;
  onClaimAllBonus: () => void;
  onOpenTechFoundry?: () => void;
  onClose: () => void;
}

export const DailyMissionsModal: React.FC<DailyMissionsModalProps> = ({
  missionsData,
  credits,
  onClaimMission,
  onClaimAllBonus,
  onOpenTechFoundry,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-950/80 border border-amber-500/60 text-amber-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wider uppercase text-white font-mono">
                TACTICAL COMMAND DIRECTIVES
              </h2>
              <p className="text-xs text-slate-400">
                Daily operational directives assigned to active sortie pilots
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto">
          <DailyMissionsView
            missionsData={missionsData}
            credits={credits}
            onClaimMission={onClaimMission}
            onClaimAllBonus={onClaimAllBonus}
            onOpenTechFoundry={onOpenTechFoundry}
          />
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Objectives update automatically as you engage enemies during sorties.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
