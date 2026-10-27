import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/GameEngine';
import { Champion, Team, GameMode, TutorialObjective, Item } from './types/game';
import { HUD } from './components/HUD';
import { ShopModal } from './components/ShopModal';
import { ScoreboardModal } from './components/ScoreboardModal';
import { TutorialGuide } from './components/TutorialGuide';
import { WaveGuideModal } from './components/WaveGuideModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { ChampionSelectModal } from './components/ChampionSelectModal';
import { GameOverModal } from './components/GameOverModal';
import { KillAnnouncementBanner } from './components/KillAnnouncementBanner';
import { soundManager } from './audio/soundManager';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // App UI State
  const [player, setPlayer] = useState<Champion | null>(null);
  const [gameTime, setGameTime] = useState<string>('00:00');
  const [blueKills, setBlueKills] = useState<number>(0);
  const [redKills, setRedKills] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isCameraLocked, setIsCameraLocked] = useState<boolean>(true);

  // Modals state
  const [isLobbyOpen, setIsLobbyOpen] = useState<boolean>(true);
  const [isShopOpen, setIsShopOpen] = useState<boolean>(false);
  const [isScoreboardOpen, setIsScoreboardOpen] = useState<boolean>(false);
  const [isWaveGuideOpen, setIsWaveGuideOpen] = useState<boolean>(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState<boolean>(false);
  const [isGameOverOpen, setIsGameOverOpen] = useState<boolean>(false);
  const [gameOverWinner, setGameOverWinner] = useState<Team | null>(null);
  const [gameOverStats, setGameOverStats] = useState({ kills: 0, deaths: 0, cs: 0, gold: 0, time: '00:00' });

  // Tutorial state
  const [tutorialObjectives, setTutorialObjectives] = useState<TutorialObjective[]>([]);
  const [currentTutorialStep, setCurrentTutorialStep] = useState<number>(1);
  const [isTutorialActive, setIsTutorialActive] = useState<boolean>(true);

  // Announcement state
  const [announcement, setAnnouncement] = useState<{ text: string; subtext?: string } | null>(null);

  // Initialize or Restart Engine
  const startMatch = useCallback((champId: string, mode: GameMode) => {
    if (!canvasRef.current) return;

    if (engineRef.current) {
      engineRef.current.stop();
    }

    const engine = new GameEngine(
      canvasRef.current,
      {
        onPlayerUpdate: (updatedPlayer) => {
          setPlayer({ ...updatedPlayer });
        },
        onGameEvent: (event, detail) => {
          // Event handlers
        },
        onTutorialProgress: (objectives, step) => {
          setTutorialObjectives([...objectives]);
          setCurrentTutorialStep(step);
        },
        onGameOver: (winner, stats) => {
          setGameOverWinner(winner);
          setGameOverStats(stats);
          setIsGameOverOpen(true);
        },
        onKillAnnouncement: (text, subtext) => {
          setAnnouncement({ text, subtext });
        },
      },
      mode,
      champId
    );

    engine.setDimensions(window.innerWidth, window.innerHeight);
    engine.start();
    engineRef.current = engine;

    setPlayer({ ...engine.player });
    setTutorialObjectives([...engine.tutorialObjectives]);
    setCurrentTutorialStep(engine.currentTutorialStep);
    setIsTutorialActive(mode === 'tutorial');
    setIsLobbyOpen(false);
    setIsGameOverOpen(false);
    setIsShopOpen(false);
    setIsScoreboardOpen(false);
    setIsWaveGuideOpen(false);
    setIsCameraLocked(engine.isCameraLocked);
  }, []);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      if (engineRef.current && canvasRef.current) {
        engineRef.current.setDimensions(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const engine = engineRef.current;
      if (!engine || isLobbyOpen) return;

      if (e.key === 'Tab') {
        e.preventDefault();
        setIsScoreboardOpen((prev) => !prev);
        return;
      }

      if (e.key === 'Escape') {
        setIsShopOpen(false);
        setIsScoreboardOpen(false);
        setIsWaveGuideOpen(false);
        if (engine.aimingSkill) {
          engine.aimingSkill = null;
        }
        if (engine.isAttackMoveMode) {
          engine.isAttackMoveMode = false;
        }
        return;
      }

      if (key === 'p') {
        setIsShopOpen((prev) => !prev);
        return;
      }

      if (key === 'b') {
        engine.startRecall();
        return;
      }

      // Camera lock toggle (Y key in League)
      if (key === 'y') {
        const locked = engine.toggleCameraLock();
        setIsCameraLocked(locked);
        return;
      }

      // Attack Move (A key)
      if (key === 'a') {
        engine.triggerAttackMoveMode();
        return;
      }

      // Center Camera on Champion (Spacebar)
      if (e.code === 'Space') {
        e.preventDefault();
        engine.snapCameraToPlayer();
        return;
      }

      // Skill hotkeys Q, W, E, R
      if (key === 'q' || key === 'w' || key === 'e' || key === 'r') {
        const skillKey = key.toUpperCase() as 'Q' | 'W' | 'E' | 'R';
        const skill = engine.player.skills[skillKey];
        if (skill && skill.level > 0 && skill.cooldown <= 0) {
          if (skill.targetType === 'self') {
            engine.castSkill(engine.player, skillKey);
          } else {
            // Smartcast directly toward mouse cursor
            engine.castSkill(engine.player, skillKey, engine.mouseMapX, engine.mouseMapY);
          }
        }
        return;
      }

      // Summoner Spells D, F
      if (key === 'd' || key === 'f') {
        const spellKey = key.toUpperCase() as 'D' | 'F';
        engine.castSummonerSpell(spellKey);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLobbyOpen]);

  // Periodic HUD stats sync
  useEffect(() => {
    const timer = setInterval(() => {
      if (engineRef.current) {
        setGameTime(engineRef.current.formatGameTime());
        setBlueKills(engineRef.current.blueKills);
        setRedKills(engineRef.current.redKills);
      }
    }, 250);
    return () => clearInterval(timer);
  }, []);

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!engineRef.current) return;

    if (e.button === 2) {
      e.preventDefault();
      engineRef.current.handleRightClick(e.clientX, e.clientY);
    } else if (e.button === 0) {
      engineRef.current.handleLeftClick(e.clientX, e.clientY);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!engineRef.current) return;
    engineRef.current.handleMouseMove(e.clientX, e.clientY);

    // Screen-edge camera panning when unlocked
    if (!engineRef.current.isCameraLocked) {
      const margin = 35;
      const panSpeed = 600;
      if (e.clientX < margin) {
        engineRef.current.cameraX = Math.max(0, engineRef.current.cameraX - panSpeed * 0.016);
      } else if (e.clientX > window.innerWidth - margin) {
        engineRef.current.cameraX = Math.min(3000 - engineRef.current.viewportWidth, engineRef.current.cameraX + panSpeed * 0.016);
      }
      if (e.clientY < margin) {
        engineRef.current.cameraY = Math.max(0, engineRef.current.cameraY - panSpeed * 0.016);
      } else if (e.clientY > window.innerHeight - margin) {
        engineRef.current.cameraY = Math.min(3000 - engineRef.current.viewportHeight, engineRef.current.cameraY + panSpeed * 0.016);
      }
    }
  };

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-black select-none cursor-crosshair"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 2D Canvas Game Viewport */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        className="absolute inset-0 w-full h-full block"
      />

      {/* Main MOBA HUD */}
      {player && !isLobbyOpen && (
        <HUD
          player={player}
          gameTime={gameTime}
          blueKills={blueKills}
          redKills={redKills}
          onCastSkill={(key) => {
            if (engineRef.current) {
              const skill = engineRef.current.player.skills[key];
              if (skill.targetType === 'self') {
                engineRef.current.castSkill(engineRef.current.player, key);
              } else {
                engineRef.current.aimingSkill = engineRef.current.aimingSkill === key ? null : key;
              }
            }
          }}
          onLevelUpSkill={(key) => {
            if (engineRef.current) {
              engineRef.current.levelUpSkill(key);
            }
          }}
          onCastSpell={(key) => {
            if (engineRef.current) {
              engineRef.current.castSummonerSpell(key);
            }
          }}
          onRecall={() => {
            if (engineRef.current) {
              engineRef.current.startRecall();
            }
          }}
          onOpenShop={() => setIsShopOpen(true)}
          onOpenScoreboard={() => setIsScoreboardOpen(true)}
          onOpenTutorial={() => setIsTutorialActive((prev) => !prev)}
          onOpenWaveGuide={() => setIsWaveGuideOpen(true)}
          onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
          onTriggerAttackMove={() => {
            if (engineRef.current) {
              engineRef.current.triggerAttackMoveMode();
            }
          }}
          onToggleCameraLock={() => {
            if (engineRef.current) {
              const locked = engineRef.current.toggleCameraLock();
              setIsCameraLocked(locked);
            }
          }}
          isCameraLocked={isCameraLocked}
          isMuted={isMuted}
          onToggleMute={() => {
            const muted = soundManager.toggleMute();
            setIsMuted(muted);
          }}
          engine={engineRef.current}
        />
      )}

      {/* Tutorial Guide Overlay */}
      {isTutorialActive && !isLobbyOpen && tutorialObjectives.length > 0 && (
        <TutorialGuide
          objectives={tutorialObjectives}
          currentStep={currentTutorialStep}
          onSkipStep={() => {
            if (engineRef.current) {
              engineRef.current.advanceTutorialStep();
            }
          }}
        />
      )}

      {/* Minion Wave & Pulling Guide Modal */}
      <WaveGuideModal
        isOpen={isWaveGuideOpen}
        onClose={() => setIsWaveGuideOpen(false)}
      />

      {/* In-depth How To Play & Combos Guide Modal */}
      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />

      {/* Real-time Kill / Match Announcement */}
      <KillAnnouncementBanner
        text={announcement?.text || null}
        subtext={announcement?.subtext}
        onDismiss={() => setAnnouncement(null)}
      />

      {/* Item Shop Modal (P) */}
      {player && (
        <ShopModal
          player={player}
          isOpen={isShopOpen}
          onClose={() => setIsShopOpen(false)}
          onBuyItem={(item: Item) => {
            if (engineRef.current) {
              return engineRef.current.buyItem(item);
            }
            return false;
          }}
          onSellItem={(index: number) => {
            if (engineRef.current) {
              const it = engineRef.current.player.items[index];
              if (it) {
                engineRef.current.player.gold += Math.round(it.cost * 0.7);
                engineRef.current.player.items[index] = null;
                soundManager.playGold();
                setPlayer({ ...engineRef.current.player });
              }
            }
          }}
        />
      )}

      {/* Scoreboard Modal (Tab) */}
      {player && (
        <ScoreboardModal
          player={player}
          enemyChampion={engineRef.current?.enemyChampion || null}
          blueKills={blueKills}
          redKills={redKills}
          gameTime={gameTime}
          isOpen={isScoreboardOpen}
          onClose={() => setIsScoreboardOpen(false)}
        />
      )}

      {/* Champion & Game Mode Select Lobby */}
      <ChampionSelectModal
        isOpen={isLobbyOpen}
        onStartGame={(champId, mode) => startMatch(champId, mode)}
        onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
      />

      {/* Game Over (Victory / Defeat) */}
      <GameOverModal
        isOpen={isGameOverOpen}
        winner={gameOverWinner}
        stats={gameOverStats}
        onPlayAgain={() => {
          if (engineRef.current) {
            startMatch(engineRef.current.selectedChampionId, engineRef.current.mode);
          }
        }}
        onGoToLobby={() => {
          setIsGameOverOpen(false);
          setIsLobbyOpen(true);
        }}
      />
    </div>
  );
}
