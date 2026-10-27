import React from 'react';
import { Champion } from '../types/game';
import {
  Shield,
  Zap,
  Swords,
  Sparkles,
  ShoppingBag,
  Volume2,
  VolumeX,
  Compass,
  Award,
  Plus,
  BookOpen,
  Crosshair,
  Lock,
  Unlock
} from 'lucide-react';

interface HUDProps {
  player: Champion;
  gameTime: string;
  blueKills: number;
  redKills: number;
  onCastSkill: (key: 'Q' | 'W' | 'E' | 'R') => void;
  onLevelUpSkill: (key: 'Q' | 'W' | 'E' | 'R') => void;
  onCastSpell: (key: 'D' | 'F') => void;
  onRecall: () => void;
  onOpenShop: () => void;
  onOpenScoreboard: () => void;
  onOpenTutorial: () => void;
  onOpenWaveGuide: () => void;
  onOpenHowToPlay?: () => void;
  onTriggerAttackMove: () => void;
  onToggleCameraLock: () => void;
  isCameraLocked: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  engine: any;
}

export const HUD: React.FC<HUDProps> = ({
  player,
  gameTime,
  blueKills,
  redKills,
  onCastSkill,
  onLevelUpSkill,
  onCastSpell,
  onRecall,
  onOpenShop,
  onOpenScoreboard,
  onOpenTutorial,
  onOpenWaveGuide,
  onOpenHowToPlay,
  onTriggerAttackMove,
  onToggleCameraLock,
  isCameraLocked,
  isMuted,
  onToggleMute,
  engine,
}) => {
  const hpPercent = Math.max(0, Math.min(100, (player.stats.hp / player.stats.maxHp) * 100));
  const manaPercent = Math.max(0, Math.min(100, (player.stats.mana / player.stats.maxMana) * 100));

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-3 font-sans">
      {/* ======================================================== */}
      {/* TOP BAR: Scoreboard, Game Time, CS, Controls & Audio   */}
      {/* ======================================================== */}
      <div className="flex items-center justify-between w-full pointer-events-auto">
        {/* Left: Player Profile Brief & Net Gold */}
        <div className="flex items-center gap-3 bg-slate-950/85 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-amber-600/30 shadow-lg">
          <img
            src="/favicon.svg"
            alt="LoL Crest"
            className="w-7 h-7 drop-shadow-[0_0_8px_rgba(245,211,107,0.5)]"
          />
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold font-cinzel text-base tracking-wide">{player.nameKr}</span>
            <span className="text-xs text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded font-mono-numbers">Lv.{player.level}</span>
          </div>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex items-center gap-1.5 text-amber-300 font-mono-numbers font-bold text-sm">
            <span>🪙</span>
            <span>{player.gold}</span>
          </div>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex items-center gap-1 text-xs text-slate-300 font-mono-numbers">
            <span className="text-slate-400">CS:</span>
            <span className="font-bold text-white">{player.cs}</span>
          </div>
        </div>

        {/* Center: Match Kills & Clock + Real-time Smart Coach */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-4 bg-slate-950/90 backdrop-blur-md px-6 py-2 rounded-xl border border-slate-700 shadow-2xl">
            <div className="flex items-center gap-2">
              <span className="text-blue-400 font-bold text-xl font-mono-numbers">{blueKills}</span>
              <span className="text-xs text-blue-300/80 uppercase font-semibold">아군</span>
            </div>
            <div className="flex flex-col items-center px-3 border-x border-slate-800">
              <span className="text-xs text-slate-400 uppercase font-medium">시간</span>
              <span className="text-amber-400 font-mono-numbers font-bold text-base">{gameTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-300/80 uppercase font-semibold">적군</span>
              <span className="text-red-400 font-bold text-xl font-mono-numbers">{redKills}</span>
            </div>
          </div>
          {/* Smart Coach Real-time Guidance */}
          {engine && typeof engine.getSmartCoachTip === 'function' && engine.getSmartCoachTip() && (
            <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-900/90 border border-amber-500/40 text-amber-200 text-[11px] font-medium shadow-md animate-pulse">
              <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
              <span>{engine.getSmartCoachTip()}</span>
            </div>
          )}
        </div>

        {/* Right: Quick Action Buttons (How To Play, Wave Guide, Shop, Tutorial, Scoreboard, Mute) */}
        <div className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-700 shadow-lg">
          {/* How to Play & Champion Combos Guide button */}
          {onOpenHowToPlay && (
            <button
              onClick={onOpenHowToPlay}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold text-xs shadow-md transition-all hover:scale-105 active:scale-95 border border-amber-300/50"
              title="초보자 실전 플레이 & 챔피언 콤보 가이드"
            >
              <span>🕹️</span>
              <span>실전 가이드</span>
            </button>
          )}

          {/* Wave & Pulling Guide button */}
          <button
            onClick={onOpenWaveGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/70 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-all hover:scale-105 active:scale-95 shadow"
            title="미니언 풀링 & 라인전 가이드"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>미니언 가이드</span>
          </button>

          <button
            onClick={onOpenTutorial}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-900/40 hover:bg-indigo-800/60 text-indigo-200 border border-indigo-500/30 text-xs font-semibold transition-all hover:scale-105 active:scale-95"
            title="튜토리얼 가이드"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>튜토리얼</span>
          </button>

          <button
            onClick={onOpenShop}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-900/40 hover:bg-amber-800/60 text-amber-200 border border-amber-500/30 text-xs font-semibold transition-all hover:scale-105 active:scale-95"
            title="아이템 상점 (P)"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>상점 (P)</span>
          </button>

          <button
            onClick={onOpenScoreboard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all hover:scale-105 active:scale-95"
            title="점수판 (Tab)"
          >
            <Award className="w-3.5 h-3.5" />
            <span>스코어 (Tab)</span>
          </button>

          <button
            onClick={onToggleCameraLock}
            className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-300 transition-colors"
            title={isCameraLocked ? '카메라 고정 중 (Y로 해제)' : '자유 카메라 (Space로 복귀)'}
          >
            {isCameraLocked ? <Lock className="w-4 h-4 text-amber-400" /> : <Unlock className="w-4 h-4 text-slate-400" />}
          </button>

          <button
            onClick={onToggleMute}
            className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-300 transition-colors"
            title={isMuted ? '음소거 해제' : '음소거'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* BOTTOM CENTER: Main League Action Bar & Health/Mana HUD  */}
      {/* ======================================================== */}
      <div className="flex items-end justify-between w-full">
        {/* Left: Stats Panel & Attack-Move control */}
        <div className="flex flex-col gap-2">
          {/* Attack-Move & Mechanics Quick Buttons */}
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              onClick={onTriggerAttackMove}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-md active:scale-95 ${
                engine?.isAttackMoveMode
                  ? 'bg-red-500 text-white border-red-300 animate-pulse'
                  : 'bg-slate-900/90 text-amber-300 border-amber-500/40 hover:bg-slate-800'
              }`}
              title="A키: 어택땅 (Attack-Move)"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>A (어택땅)</span>
            </button>

            <span className="text-[11px] bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700 text-slate-300">
              Space: 화면 중앙
            </span>
          </div>

          {/* Stats Grid */}
          <div className="pointer-events-auto bg-slate-950/90 backdrop-blur-md p-3 rounded-xl border border-slate-700 text-xs grid grid-cols-2 gap-x-4 gap-y-1.5 shadow-xl w-56 mb-1">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1 text-amber-400"><Swords className="w-3.5 h-3.5" />공격력</span>
              <span className="font-mono-numbers font-bold text-white">{Math.round(player.stats.attackDamage)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1 text-purple-400"><Sparkles className="w-3.5 h-3.5" />주문력</span>
              <span className="font-mono-numbers font-bold text-white">{Math.round(player.stats.abilityPower)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1 text-amber-200"><Shield className="w-3.5 h-3.5" />방어력</span>
              <span className="font-mono-numbers font-bold text-white">{Math.round(player.stats.armor)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1 text-cyan-300"><Shield className="w-3.5 h-3.5 text-cyan-400" />마법저항</span>
              <span className="font-mono-numbers font-bold text-white">{Math.round(player.stats.magicResist)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1 text-yellow-300"><Zap className="w-3.5 h-3.5" />공격속도</span>
              <span className="font-mono-numbers font-bold text-white">{player.stats.attackSpeed.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1 text-emerald-400">👟 이동속도</span>
              <span className="font-mono-numbers font-bold text-white">{Math.round(player.stats.moveSpeed)}</span>
            </div>
          </div>
        </div>

        {/* Center: Champion Dashboard (Skills, Spells, HP/Mana Bar, Items) */}
        <div className="pointer-events-auto flex flex-col items-center bg-slate-950/90 backdrop-blur-md px-5 py-3 rounded-2xl border border-amber-600/40 shadow-2xl relative">
          {player.skillPoints > 0 && (
            <div className="absolute -top-7 text-xs font-bold text-amber-300 bg-amber-950/90 border border-amber-500/50 px-3 py-0.5 rounded-full animate-bounce">
              스킬 포인트 사용 가능! ({player.skillPoints})
            </div>
          )}

          {/* Upper Row: Skills & Spells */}
          <div className="flex items-center gap-3 mb-2">
            {(['Q', 'W', 'E', 'R'] as const).map((key) => {
              const skill = player.skills[key];
              const isReady = skill.level > 0 && skill.cooldown <= 0 && player.stats.mana >= skill.manaCost;
              const canLevelUp = player.skillPoints > 0 && skill.level < skill.maxLevel && (key !== 'R' || player.level >= 6);

              return (
                <div key={key} className="flex flex-col items-center relative group">
                  {canLevelUp && (
                    <button
                      onClick={() => onLevelUpSkill(key)}
                      className="absolute -top-7 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-md w-6 h-6 flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 animate-pulse"
                      title={`${skill.nameKr} 레벨 올리기`}
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                    </button>
                  )}

                  <div
                    onClick={() => onCastSkill(key)}
                    className={`relative w-13 h-13 rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer select-none transition-all ${
                      skill.level === 0
                        ? 'border-slate-700 bg-slate-900/60 opacity-50'
                        : isReady
                        ? 'border-amber-400 bg-gradient-to-b from-slate-800 to-slate-900 shadow-md hover:border-amber-200 hover:scale-105 active:scale-95'
                        : 'border-slate-600 bg-slate-900/80 grayscale'
                    }`}
                  >
                    <span className="text-xl">{skill.icon}</span>
                    <span className="absolute bottom-0.5 right-1 text-[10px] font-mono-numbers font-bold text-amber-300 bg-black/60 px-1 rounded">
                      {key}
                    </span>
                    {skill.manaCost > 0 && (
                      <span className="absolute top-0.5 left-1 text-[9px] font-mono-numbers text-cyan-300 bg-black/60 px-0.5 rounded">
                        {skill.manaCost}
                      </span>
                    )}
                    {skill.cooldown > 0 && (
                      <div className="absolute inset-0 bg-black/75 rounded-lg flex items-center justify-center text-white font-mono-numbers font-bold text-sm">
                        {skill.cooldown.toFixed(1)}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1 mt-1">
                    {Array.from({ length: skill.maxLevel }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full ${
                          i < skill.level ? 'bg-amber-400' : 'bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="hidden group-hover:block absolute bottom-16 w-60 p-2.5 bg-slate-950 border border-amber-600/50 rounded-lg shadow-2xl text-left z-50 pointer-events-none">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-1">
                      <span className="font-bold text-amber-300 text-xs">{skill.nameKr} ({key})</span>
                      <span className="text-[10px] text-slate-400">Lv.{skill.level}/{skill.maxLevel}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{skill.descriptionKr}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                      <span>쿨다운: {skill.maxCooldown}초</span>
                      <span>소모 마나: {skill.manaCost}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="h-10 w-px bg-slate-800 mx-1" />

            {/* Summoner Spells */}
            {(['D', 'F'] as const).map((key) => {
              const spell = player.summonerSpells[key];
              const isReady = spell.cooldown <= 0;

              return (
                <div key={key} className="flex flex-col items-center relative group">
                  <div
                    onClick={() => onCastSpell(key)}
                    className={`relative w-11 h-11 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all ${
                      isReady
                        ? 'border-cyan-400 bg-slate-800 hover:border-cyan-200 hover:scale-105 active:scale-95'
                        : 'border-slate-700 bg-slate-900 grayscale'
                    }`}
                  >
                    <span className="text-lg">{spell.icon}</span>
                    <span className="absolute bottom-0.5 right-1 text-[9px] font-mono-numbers font-bold text-cyan-200 bg-black/60 px-1 rounded">
                      {key}
                    </span>
                    {spell.cooldown > 0 && (
                      <div className="absolute inset-0 bg-black/75 rounded-lg flex items-center justify-center text-white font-mono-numbers font-bold text-xs">
                        {Math.ceil(spell.cooldown)}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">{spell.nameKr}</span>
                </div>
              );
            })}

            {/* Recall Button */}
            <div className="flex flex-col items-center relative">
              <button
                onClick={onRecall}
                className={`relative w-11 h-11 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all ${
                  player.isRecalling
                    ? 'border-blue-400 bg-blue-950 animate-pulse'
                    : 'border-slate-700 bg-slate-800 hover:border-blue-400 hover:scale-105 active:scale-95'
                }`}
                title="본진 귀환 (B)"
              >
                <span className="text-lg">🌀</span>
                <span className="absolute bottom-0.5 right-1 text-[9px] font-mono-numbers font-bold text-blue-200 bg-black/60 px-1 rounded">
                  B
                </span>
                {player.isRecalling && (
                  <div className="absolute inset-0 bg-blue-900/60 rounded-lg flex items-center justify-center text-white font-mono-numbers font-bold text-xs">
                    {player.recallTimer.toFixed(1)}s
                  </div>
                )}
              </button>
              <span className="text-[10px] text-slate-400 mt-1">귀환</span>
            </div>
          </div>

          {/* Health and Mana Bars */}
          <div className="w-84 flex flex-col gap-1">
            <div className="relative w-full h-5 bg-slate-900 rounded-md overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-400 transition-all duration-100"
                style={{ width: `${hpPercent}%` }}
              />
              {player.shield > 0 && (
                <div
                  className="absolute top-0 bottom-0 bg-amber-400/80 border-l border-white"
                  style={{
                    left: `${hpPercent}%`,
                    width: `${Math.min(100 - hpPercent, (player.shield / player.stats.maxHp) * 100)}%`,
                  }}
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center text-[11px] font-mono-numbers font-bold text-white drop-shadow">
                {Math.round(player.stats.hp)} / {player.stats.maxHp}
                <span className="text-[10px] text-emerald-200 ml-2">+{player.stats.hpRegen.toFixed(1)}</span>
              </div>
            </div>

            <div className="relative w-full h-3.5 bg-slate-900 rounded-md overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-400 transition-all duration-100"
                style={{ width: `${manaPercent}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono-numbers font-bold text-white drop-shadow">
                {Math.round(player.stats.mana)} / {player.stats.maxMana}
              </div>
            </div>
          </div>

          {/* Items Inventory */}
          <div className="flex items-center gap-1.5 mt-2.5">
            {player.items.map((item, idx) => (
              <div
                key={idx}
                className="w-8 h-8 rounded border border-slate-700 bg-slate-900/90 flex items-center justify-center text-sm relative group cursor-pointer hover:border-amber-400"
                onClick={onOpenShop}
                title={item ? `${item.nameKr} (${item.cost}G)` : '빈 아이템 슬롯'}
              >
                {item ? (
                  <span>{item.icon}</span>
                ) : (
                  <span className="text-[9px] text-slate-600 font-mono-numbers">{idx + 1}</span>
                )}
                {item && (
                  <div className="hidden group-hover:block absolute bottom-10 -left-12 w-48 p-2 bg-slate-950 border border-slate-700 rounded-md text-[11px] text-slate-200 z-50 pointer-events-none shadow-xl">
                    <span className="font-bold text-amber-300 block mb-0.5">{item.nameKr}</span>
                    <span className="text-slate-400 block">{item.descriptionKr}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Interactive Summoner Rift Minimap */}
        <div className="pointer-events-auto bg-slate-950/90 backdrop-blur-md p-2 rounded-xl border border-slate-700 shadow-2xl flex flex-col items-center">
          <div
            className="relative w-44 h-44 bg-[#142618] rounded-lg overflow-hidden border border-slate-800 cursor-crosshair"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const clickY = e.clientY - rect.top;
              const mapX = (clickX / rect.width) * 3000;
              const mapY = (clickY / rect.height) * 3000;
              if (engine) {
                engine.player.targetX = mapX;
                engine.player.targetY = mapY;
                engine.player.targetUnitId = null;
              }
            }}
          >
            <div className="absolute top-0 right-0 w-full h-full pointer-events-none">
              <svg className="w-full h-full opacity-35" viewBox="0 0 100 100">
                <line x1="0" y1="100" x2="100" y2="0" stroke="#38bdf8" strokeWidth="8" />
                <line x1="15" y1="85" x2="85" y2="15" stroke="#78716c" strokeWidth="6" />
              </svg>
            </div>

            <div className="absolute bottom-2 left-2 w-3.5 h-3.5 rounded-full bg-blue-500 shadow-sm border border-white" />
            <div className="absolute top-2 right-2 w-3.5 h-3.5 rounded-full bg-red-500 shadow-sm border border-white" />
            <div className="absolute bottom-9 right-8 w-2.5 h-2.5 rounded-full bg-orange-500" title="드래곤 둥지" />
            <div className="absolute top-9 left-8 w-2.5 h-2.5 rounded-full bg-purple-500" title="바론 둥지" />

            {/* Player marker */}
            <div
              className="absolute w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white shadow-md transform -translate-x-1/2 -translate-y-1/2 transition-all duration-75"
              style={{
                left: `${(player.x / 3000) * 100}%`,
                top: `${(player.y / 3000) * 100}%`,
              }}
            />

            {/* Enemy Bot marker */}
            {engine?.enemyChampion && !engine.enemyChampion.isDead && (
              <div
                className="absolute w-3 h-3 rounded-full bg-red-500 border border-white shadow transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${(engine.enemyChampion.x / 3000) * 100}%`,
                  top: `${(engine.enemyChampion.y / 3000) * 100}%`,
                }}
              />
            )}

            {/* Camera Viewport Bounds box */}
            {engine && (
              <div
                className="absolute border border-white/60 pointer-events-none"
                style={{
                  left: `${(engine.cameraX / 3000) * 100}%`,
                  top: `${(engine.cameraY / 3000) * 100}%`,
                  width: `${(engine.viewportWidth / 3000) * 100}%`,
                  height: `${(engine.viewportHeight / 3000) * 100}%`,
                }}
              />
            )}
          </div>
          <div className="flex items-center justify-between w-full mt-1.5 px-1 text-[10px] text-slate-400">
            <span>미니맵 (클릭 이동)</span>
            <span className="text-emerald-400 font-mono-numbers">60 FPS</span>
          </div>
        </div>
      </div>
    </div>
  );
};
