/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Achievement,
  AudioSettings,
  DailyMission,
  DailyMissionsData,
  GameMode,
  GameState,
  ShipId,
  UpgradeOption,
  VideoSettings,
  CommanderCosmetic,
  CommanderEquipped,
  CommanderRewardResult,
  CosmeticType,
} from './types/game';
import { GameEngine } from './game/engine';
import { sound } from './services/soundEffects';
import {
  getAudioSettings,
  getStoredAchievements,
  getHighScores,
  getVideoSettings,
  saveAudioSettings,
  saveAchievements,
  saveHighScore,
  saveVideoSettings,
  getStoredBestiary,
  getStoredCredits,
  getStoredDailyMissions,
  claimDailyMission,
  claimAllDailyMissionsBonus,
  getStoredTechUpgrades,
  buyTechUpgrade,
  getStoredCosmetics,
  getEquippedCosmetics,
  saveEquippedCosmetics,
  getMegaBossStats,
} from './services/storage';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { VirtualJoystick } from './components/VirtualJoystick';
import { UpgradeModal } from './components/UpgradeModal';
import { StartMenu } from './components/StartMenu';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { SettingsModal } from './components/SettingsModal';
import { AchievementsModal } from './components/AchievementsModal';
import { BestiaryModal } from './components/BestiaryModal';
import { DailyMissionsModal } from './components/DailyMissionsModal';
import { TechFoundryModal } from './components/TechFoundryModal';
import { CommanderRewardModal } from './components/CommanderRewardModal';
import { ArmoryModal } from './components/ArmoryModal';
import { CosmicWipeOverlay } from './components/CosmicWipeOverlay';
import { WaveTransitionEvent } from './types/game';
import { Trophy, Target } from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(getAudioSettings);
  const [videoSettings, setVideoSettings] = useState<VideoSettings>(getVideoSettings);
  const [highScores, setHighScores] = useState<Record<GameMode, number>>(getHighScores);
  const [achievements, setAchievements] = useState<Achievement[]>(getStoredAchievements);
  const [bestiaryData, setBestiaryData] = useState(getStoredBestiary);
  const [credits, setCredits] = useState<number>(getStoredCredits);
  const [dailyMissions, setDailyMissions] = useState<DailyMissionsData>(getStoredDailyMissions);
  const [techUpgrades, setTechUpgrades] = useState<Record<string, number>>(getStoredTechUpgrades);
  const [showDailyMissionsModal, setShowDailyMissionsModal] = useState<boolean>(false);
  const [showTechFoundryModal, setShowTechFoundryModal] = useState<boolean>(false);
  const [missionToast, setMissionToast] = useState<DailyMission | null>(null);
  const [upgradeOptions, setUpgradeOptions] = useState<UpgradeOption[]>([]);
  const [isNewHighScore, setIsNewHighScore] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showAchievements, setShowAchievements] = useState<boolean>(false);
  const [showBestiary, setShowBestiary] = useState<boolean>(false);
  const [achievementToast, setAchievementToast] = useState<Achievement | null>(null);
  const [commanderReward, setCommanderReward] = useState<CommanderRewardResult | null>(null);
  const [showArmoryModal, setShowArmoryModal] = useState<boolean>(false);
  const [equippedCosmetics, setEquippedCosmetics] = useState<CommanderEquipped>(getEquippedCosmetics);
  const [cosmetics, setCosmetics] = useState<CommanderCosmetic[]>(getStoredCosmetics);
  const [megaBossStats, setMegaBossStats] = useState(getMegaBossStats);
  const [waveTransition, setWaveTransition] = useState<WaveTransitionEvent | null>(null);
  const [, setHudTick] = useState<number>(0);
  const handleHudTick = useCallback(() => {
    setHudTick((t) => (t + 1) % 10000);
  }, []);

  const handleWaveTransition = useCallback((event: WaveTransitionEvent) => {
    setWaveTransition(event);
  }, []);

  // Input states
  const [moveVector, setMoveVector] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFiringFromTouch, setIsFiringFromTouch] = useState<boolean>(false);
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);

  // Detect touch device on mount
  useEffect(() => {
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(hasTouch);
  }, []);

  // Sync sound settings with Web Audio engine
  useEffect(() => {
    sound.setVolumes(
      audioSettings.masterVolume,
      audioSettings.sfxVolume,
      audioSettings.musicVolume,
      audioSettings.muted
    );
  }, [audioSettings]);

  // Game Engine instance
  const engineRef = useRef<GameEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new GameEngine(
      window.innerWidth || 800,
      window.innerHeight || 600,
      achievements,
      videoSettings
    );
  }
  const engine = engineRef.current;

  // Level Up callback
  const handleLevelUp = useCallback((options: UpgradeOption[]) => {
    setUpgradeOptions(options);
    setGameState('UPGRADE_SELECTION');
  }, []);

  // Game Over callback
  const handleGameOver = useCallback(() => {
    if (!engine) return;
    const isNew = saveHighScore(engine.gameMode, engine.stats.score);
    setIsNewHighScore(isNew);
    setHighScores(getHighScores());
    setDailyMissions(getStoredDailyMissions());
    setCredits(getStoredCredits());
    setGameState('GAME_OVER');
  }, [engine]);

  // Achievement unlock toast
  const handleAchievementUnlocked = useCallback((ach: Achievement) => {
    setAchievements((prev) => {
      const updated = prev.map((a) => (a.id === ach.id ? { ...a, unlocked: true } : a));
      saveAchievements(updated);
      return updated;
    });

    setAchievementToast(ach);
    setTimeout(() => {
      setAchievementToast(null);
    }, 4000);
  }, []);

  // Daily Mission completed during combat callback
  const handleMissionComplete = useCallback((mission: DailyMission) => {
    setDailyMissions(getStoredDailyMissions());
    setMissionToast(mission);
    setTimeout(() => {
      setMissionToast(null);
    }, 4500);
  }, []);

  const handleClaimMission = useCallback((missionId: string) => {
    const res = claimDailyMission(missionId);
    if (res.success) {
      setCredits(res.newCredits);
      setDailyMissions(getStoredDailyMissions());
    }
  }, []);

  const handleClaimAllBonus = useCallback(() => {
    const res = claimAllDailyMissionsBonus();
    if (res.success) {
      setCredits(res.newCredits);
      setDailyMissions(getStoredDailyMissions());
    }
  }, []);

  const handleBuyTechUpgrade = useCallback((upgradeId: string, cost: number) => {
    const success = buyTechUpgrade(upgradeId, cost);
    if (success) {
      setCredits(getStoredCredits());
      setTechUpgrades(getStoredTechUpgrades());
    }
  }, []);

  // Commander's Reward callback when defeating a Mega Boss
  const handleCommanderReward = useCallback((reward: CommanderRewardResult) => {
    setCommanderReward(reward);
    setCredits(getStoredCredits());
    setCosmetics(getStoredCosmetics());
    setMegaBossStats(getMegaBossStats());
  }, []);

  const handleEquipCosmetic = useCallback(
    (type: CosmeticType, id: string | null) => {
      const current = getEquippedCosmetics();
      const updated: CommanderEquipped = {
        ...current,
        [type === 'TRAIL' ? 'trailId' : 'weaponId']: id,
      };
      saveEquippedCosmetics(updated);
      setEquippedCosmetics(updated);
      engine.updateCosmetics(updated.trailId, updated.weaponId);
    },
    [engine]
  );

  const handleEquipFromReward = useCallback(
    (item: CommanderCosmetic) => {
      handleEquipCosmetic(item.type, item.id);
      setCommanderReward(null);
    },
    [handleEquipCosmetic]
  );

  // Register engine callbacks
  useEffect(() => {
    engine.setCallbacks(
      handleLevelUp,
      handleGameOver,
      handleAchievementUnlocked,
      handleMissionComplete
    );
    engine.setCommanderRewardCallback(handleCommanderReward);
    engine.setWaveTransitionCallback(handleWaveTransition);
    engine.setVideoSettings(videoSettings);
  }, [
    engine,
    handleLevelUp,
    handleGameOver,
    handleAchievementUnlocked,
    handleMissionComplete,
    handleCommanderReward,
    handleWaveTransition,
    videoSettings,
  ]);

  // Start a new game
  const handleStartGame = (shipId: ShipId, mode: GameMode) => {
    engine.reset(shipId, mode);
    setGameState('PLAYING');
    try {
      sound.startMusic();
    } catch {
      // ignore
    }
  };

  // Select an upgrade
  const handleSelectUpgrade = (upgradeId: string) => {
    engine.applyUpgrade(upgradeId);
    setGameState('PLAYING');
  };

  // Dash and Special actions
  const handleDash = useCallback(() => {
    engine.triggerDash();
  }, [engine]);

  const handleSpecial = useCallback(() => {
    engine.triggerSpecial();
  }, [engine]);

  // Pause / Resume
  const handlePause = () => {
    if (gameState === 'PLAYING') {
      setGameState('PAUSED');
      try {
        sound.stopMusic();
      } catch {
        // ignore
      }
    }
  };

  const handleResume = () => {
    if (gameState === 'PAUSED') {
      setGameState('PLAYING');
      try {
        sound.startMusic();
      } catch {
        // ignore
      }
    }
  };

  const handleRestart = () => {
    engine.reset(engine.player.shipId, engine.gameMode);
    setGameState('PLAYING');
    try {
      sound.startMusic();
    } catch {
      // ignore
    }
  };

  const handleReturnToMenu = () => {
    setGameState('MENU');
    setDailyMissions(getStoredDailyMissions());
    setCredits(getStoredCredits());
    try {
      sound.stopMusic();
    } catch {
      // ignore
    }
  };

  const handleToggleMute = () => {
    const updated = { ...audioSettings, muted: !audioSettings.muted };
    setAudioSettings(updated);
    saveAudioSettings(updated);
  };

  const handleUpdateAudio = (updated: AudioSettings) => {
    setAudioSettings(updated);
    saveAudioSettings(updated);
  };

  const handleUpdateVideo = (updated: VideoSettings) => {
    setVideoSettings(updated);
    saveVideoSettings(updated);
    engine.setVideoSettings(updated);
  };

  const showTouchControls = videoSettings.showTouchControls || isTouchDevice;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950 font-sans antialiased select-none">
      {/* 1. Main Menu */}
      {gameState === 'MENU' && (
        <StartMenu
          onStartGame={handleStartGame}
          highScores={highScores}
          onOpenAchievements={() => setShowAchievements(true)}
          onOpenSettings={() => setShowSettings(true)}
          onOpenBestiary={() => {
            setBestiaryData(getStoredBestiary());
            setShowBestiary(true);
          }}
          credits={credits}
          dailyMissions={dailyMissions}
          onClaimMission={handleClaimMission}
          onClaimAllBonus={handleClaimAllBonus}
          onOpenDailyMissions={() => {
            setDailyMissions(getStoredDailyMissions());
            setShowDailyMissionsModal(true);
          }}
          onOpenTechFoundry={() => {
            setCredits(getStoredCredits());
            setTechUpgrades(getStoredTechUpgrades());
            setShowTechFoundryModal(true);
          }}
          onOpenArmory={() => {
            setCosmetics(getStoredCosmetics());
            setEquippedCosmetics(getEquippedCosmetics());
            setMegaBossStats(getMegaBossStats());
            setShowArmoryModal(true);
          }}
        />
      )}

      {/* 2. Gameplay Surface */}
      {gameState !== 'MENU' && (
        <div className="relative h-full w-full">
          <GameCanvas
            engine={engine}
            videoSettings={videoSettings}
            moveVector={moveVector}
            isFiringFromTouch={isFiringFromTouch}
            isPaused={gameState !== 'PLAYING'}
            onDash={handleDash}
            onSpecial={handleSpecial}
            onPause={handlePause}
            onHudTick={handleHudTick}
          />

          {/* Animated Cosmic Screen-Wipe Transition Canvas Overlay */}
          <CosmicWipeOverlay event={waveTransition} />

          {/* Interactive HUD */}
          <HUD
            player={engine.player}
            stats={engine.stats}
            isMuted={audioSettings.muted}
            videoSettings={videoSettings}
            activeUpgrades={engine.activeUpgrades}
            gameMode={engine.gameMode}
            activeBoss={engine.activeBoss}
            bossWarning={engine.bossWarningEvent}
            onToggleMute={handleToggleMute}
            onPause={handlePause}
            onTriggerDash={handleDash}
            onTriggerSpecial={handleSpecial}
          />

          {/* Virtual Joystick for Mobile or Forced Touch Controls */}
          {showTouchControls && gameState === 'PLAYING' && (
            <VirtualJoystick
              onMove={setMoveVector}
              onFireChange={setIsFiringFromTouch}
              onDash={handleDash}
              onSpecial={handleSpecial}
              isAutoFire={videoSettings.autoFire}
              onToggleAutoFire={() =>
                handleUpdateVideo({ ...videoSettings, autoFire: !videoSettings.autoFire })
              }
              specialReady={engine.player.specialMeter >= engine.player.maxSpecialMeter}
              dashReady={engine.player.dashCooldown <= 0}
            />
          )}
        </div>
      )}

      {/* 3. Level-Up Upgrade Selection Overlay */}
      {gameState === 'UPGRADE_SELECTION' && (
        <UpgradeModal options={upgradeOptions} onSelect={handleSelectUpgrade} />
      )}

      {/* 4. Pause Menu */}
      {gameState === 'PAUSED' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
          onReturnToMenu={handleReturnToMenu}
          onOpenSettings={() => setShowSettings(true)}
          onOpenArmory={() => {
            setCosmetics(getStoredCosmetics());
            setEquippedCosmetics(getEquippedCosmetics());
            setMegaBossStats(getMegaBossStats());
            setShowArmoryModal(true);
          }}
          sectorName={engine.getCurrentSector().name}
          sectorAccent={engine.getCurrentSector().accentHex}
          wave={engine.stats.wave}
        />
      )}

      {/* 5. Game Over Debriefing Modal */}
      {gameState === 'GAME_OVER' && (
        <GameOverModal
          stats={engine.stats}
          gameMode={engine.gameMode}
          isNewHighScore={isNewHighScore}
          dailyMissions={dailyMissions}
          onClaimMission={handleClaimMission}
          onRestart={handleRestart}
          onReturnToMenu={handleReturnToMenu}
          onOpenArmory={() => {
            setCosmetics(getStoredCosmetics());
            setEquippedCosmetics(getEquippedCosmetics());
            setMegaBossStats(getMegaBossStats());
            setShowArmoryModal(true);
          }}
        />
      )}

      {/* 6. Settings Modal */}
      {showSettings && (
        <SettingsModal
          audio={audioSettings}
          video={videoSettings}
          onUpdateAudio={handleUpdateAudio}
          onUpdateVideo={handleUpdateVideo}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* 7. Achievements Modal */}
      {showAchievements && (
        <AchievementsModal
          achievements={achievements}
          onClose={() => setShowAchievements(false)}
        />
      )}

      {/* 8. Bestiary Codex Modal */}
      {showBestiary && (
        <BestiaryModal
          bestiaryData={bestiaryData}
          onClose={() => setShowBestiary(false)}
        />
      )}

      {/* 9. Daily Tactical Directives Modal */}
      {showDailyMissionsModal && (
        <DailyMissionsModal
          missionsData={dailyMissions}
          credits={credits}
          onClaimMission={handleClaimMission}
          onClaimAllBonus={handleClaimAllBonus}
          onOpenTechFoundry={() => {
            setShowDailyMissionsModal(false);
            setShowTechFoundryModal(true);
          }}
          onClose={() => setShowDailyMissionsModal(false)}
        />
      )}

      {/* 10. Fleet Tech Foundry Modal */}
      {showTechFoundryModal && (
        <TechFoundryModal
          credits={credits}
          techUpgrades={techUpgrades}
          onBuyUpgrade={handleBuyTechUpgrade}
          onClose={() => setShowTechFoundryModal(false)}
        />
      )}

      {/* 11. Achievement Unlocked Floating Toast Banner */}
      {achievementToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-60 flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/95 border border-amber-500/60 shadow-2xl shadow-amber-500/20 backdrop-blur-md animate-in slide-in-from-top-6 duration-300">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-950/60 border border-amber-500/80 text-amber-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              HONOR UNLOCKED
            </span>
            <span className="text-xs font-bold text-white">{achievementToast.title}</span>
          </div>
        </div>
      )}

      {/* 12. Daily Directive Completed Floating Toast Banner */}
      {missionToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-60 flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/95 border border-cyan-500/70 shadow-2xl shadow-cyan-500/25 backdrop-blur-md animate-in slide-in-from-top-6 duration-300">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-950/80 border border-cyan-500 text-cyan-400">
            <Target className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 font-mono">
              DIRECTIVE COMPLETED · +{missionToast.rewardCredits} AC
            </span>
            <span className="text-xs font-bold text-white">{missionToast.title}</span>
          </div>
        </div>
      )}

      {/* 13. Commander's Reward Modal (Defeating Mega Boss) */}
      {commanderReward && (
        <CommanderRewardModal
          reward={commanderReward}
          onEquip={handleEquipFromReward}
          onContinue={() => setCommanderReward(null)}
          onOpenArmory={() => {
            setCommanderReward(null);
            setShowArmoryModal(true);
          }}
        />
      )}

      {/* 14. Commander Armory & Cosmetics Modal */}
      {showArmoryModal && (
        <ArmoryModal
          cosmetics={cosmetics}
          equipped={equippedCosmetics}
          megaStats={megaBossStats}
          onEquip={handleEquipCosmetic}
          onClose={() => setShowArmoryModal(false)}
        />
      )}
    </div>
  );
}
