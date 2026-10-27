import React, { useState } from 'react';
import { GameMode } from '../types/game';
import { CHAMPION_PRESETS } from '../game/constants';
import { Play, Sparkles, Shield, Swords, Compass, Settings, Zap, BookOpen, HelpCircle } from 'lucide-react';

interface ChampionSelectModalProps {
  isOpen: boolean;
  onStartGame: (champId: string, mode: GameMode) => void;
  onOpenHowToPlay: () => void;
}

export const ChampionSelectModal: React.FC<ChampionSelectModalProps> = ({
  isOpen,
  onStartGame,
  onOpenHowToPlay,
}) => {
  const [selectedChamp, setSelectedChamp] = useState<string>('garen');
  const [selectedMode, setSelectedMode] = useState<GameMode>('tutorial');

  if (!isOpen) return null;

  const currentChamp = CHAMPION_PRESETS[selectedChamp];

  const CHAMPIONS_LIST = [
    {
      id: 'garen',
      name: '가렌',
      title: '데마시아의 힘',
      role: '전사 / 탱커',
      icon: '⚔️',
      image: '/images/champion_garen.jpg',
      difficulty: '초급 (쉬움)',
      color: 'from-blue-900 to-amber-950',
    },
    {
      id: 'ahri',
      name: '아리',
      title: '구미호',
      role: '마법사 / 암살자',
      icon: '🔮',
      image: '/images/champion_ahri.jpg',
      difficulty: '중급 (보통)',
      color: 'from-pink-900 to-purple-950',
    },
    {
      id: 'ashe',
      name: '애쉬',
      title: '서리 궁수',
      role: '원거리 딜러',
      icon: '🏹',
      image: '/images/champion_ashe.jpg',
      difficulty: '초급 (쉬움)',
      color: 'from-cyan-900 to-blue-950',
    },
    {
      id: 'yasuo',
      name: '야스오',
      title: '용서받지 못한 자',
      role: '근접 딜러 / 전사',
      icon: '🌪️',
      image: '/images/champion_yasuo.svg',
      difficulty: '상급 (숙련)',
      color: 'from-sky-900 to-indigo-950',
    },
    {
      id: 'lux',
      name: '럭스',
      title: '광명의 소녀',
      role: '마법사 / 포킹',
      icon: '✨',
      image: '/images/champion_lux.svg',
      difficulty: '초급 (쉬움)',
      color: 'from-amber-900 to-rose-950',
    },
    {
      id: 'leesin',
      name: '리 신',
      title: '눈먼 수도승',
      role: '전사 / 암살자',
      icon: '👊',
      image: '/images/champion_leesin.svg',
      difficulty: '상급 (숙련)',
      color: 'from-amber-950 to-orange-950',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-950 border border-amber-600/50 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden text-slate-100 flex flex-col font-sans my-auto max-h-[92vh]">
        {/* Banner Header with Summoner's Rift artwork & League Hextech Logo */}
        <div className="relative h-36 overflow-hidden border-b border-amber-600/30 shrink-0">
          <img
            src="/images/rift_banner.jpg"
            alt="Summoners Rift"
            className="w-full h-full object-cover object-center filter brightness-90"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/images/lol_summoners_rift_banner_1793073874050.jpg';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
          <div className="absolute bottom-3 left-6 right-6 flex items-end justify-between">
            <div className="flex items-center gap-3.5">
              <img
                src="/favicon.svg"
                alt="League Emblem Logo"
                className="w-14 h-14 drop-shadow-[0_0_12px_rgba(245,211,107,0.7)] transition-transform hover:scale-105"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black font-cinzel text-amber-300 drop-shadow-md tracking-wider">
                    LEAGUE OF LEGENDS
                  </h1>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/50 font-mono-numbers uppercase tracking-wider">
                    Web Edition
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  웹 브라우저에서 바로 즐기는 정통 소환사의 협곡 MOBA
                </p>
              </div>
            </div>
            {/* Dedicated How To Play Guide Button */}
            <button
              onClick={onOpenHowToPlay}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>초보자 실전 플레이 가이드</span>
            </button>
          </div>
        </div>

        {/* Body: Mode Selection + Champion Picker + Details */}
        <div className="p-6 flex flex-col gap-5 overflow-y-auto">
          {/* 1. Mode Picker */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
              게임 모드 선택
            </span>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  id: 'tutorial',
                  title: '튜토리얼 모드',
                  subtitle: '이동, 스킬, 막타, 부쉬 풀링, 포탑, 상점 단계별 안내',
                  badge: '추천',
                  icon: <Compass className="w-4 h-4 text-indigo-400" />,
                },
                {
                  id: 'match',
                  title: '일반 대전 (AI 봇전)',
                  subtitle: '소환사의 협곡 정통 라인전 및 넥서스 파괴 실전',
                  badge: '대전',
                  icon: <Swords className="w-4 h-4 text-amber-400" />,
                },
                {
                  id: 'practice',
                  title: '자유 연습 모드',
                  subtitle: '허수아비와 함께 자유롭게 스킬 콤보 테스트',
                  badge: '연습',
                  icon: <Settings className="w-4 h-4 text-emerald-400" />,
                },
              ].map((m) => (
                <div
                  key={m.id}
                  onClick={() => setSelectedMode(m.id as GameMode)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    selectedMode === m.id
                      ? 'border-amber-400 bg-amber-950/30 shadow-lg ring-1 ring-amber-400/50'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="p-1.5 bg-slate-800 rounded-lg">{m.icon}</div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {m.badge}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-100">{m.title}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{m.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Champion Picker Grid (6 Champions!) */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
              챔피언 선택 ({CHAMPIONS_LIST.length}명)
            </span>
            <div className="grid grid-cols-6 gap-3">
              {CHAMPIONS_LIST.map((c) => {
                const isSelected = selectedChamp === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedChamp(c.id)}
                    className={`rounded-2xl border overflow-hidden cursor-pointer transition-all flex flex-col ${
                      isSelected
                        ? 'border-amber-400 shadow-xl ring-2 ring-amber-400 scale-[1.03] bg-amber-950/20'
                        : 'border-slate-800 opacity-80 hover:opacity-100 hover:border-slate-700 bg-slate-900/40'
                    }`}
                  >
                    <div className={`h-24 overflow-hidden relative flex items-center justify-center bg-gradient-to-br ${c.color}`}>
                      {c.image ? (
                        <img src={c.image} alt={c.name} className="w-full h-full object-cover object-top" />
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-3xl">{c.icon}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                      <span className="absolute bottom-1.5 left-2 text-[10px] font-bold text-white bg-black/60 px-1 rounded font-cinzel">
                        {c.name}
                      </span>
                    </div>
                    <div className="p-2 flex flex-col">
                      <span className="text-[11px] font-bold text-amber-300 truncate">{c.title}</span>
                      <span className="text-[9px] text-slate-400 mt-0.5">{c.role}</span>
                      <span className="text-[9px] text-emerald-400 mt-1 font-medium">{c.difficulty}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Selected Champion Skills Breakdown */}
          {currentChamp && (
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-col gap-2.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-100 font-cinzel">
                    {currentChamp.nameKr} ({currentChamp.titleKr})
                  </span>
                  <span className="text-[11px] text-amber-400 font-medium bg-amber-950/60 px-2 py-0.5 rounded border border-amber-600/30">
                    사거리: {currentChamp.stats.attackRange} | 이속: {currentChamp.stats.moveSpeed}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  기본 공격력: {Math.round(currentChamp.stats.attackDamage)} | 방어력: {currentChamp.stats.armor}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2.5">
                {(['Q', 'W', 'E', 'R'] as const).map((key) => {
                  const skill = currentChamp.skills[key];
                  return (
                    <div key={key} className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{skill.icon}</span>
                        <div>
                          <span className="text-xs font-bold text-amber-300">{skill.nameKr}</span>
                          <span className="text-[10px] text-slate-400 ml-1 font-mono">[{key}]</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-300 line-clamp-2 leading-tight mt-0.5">
                        {skill.descriptionKr}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Controls Quick Reference & Play Button */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800 shrink-0">
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span><strong>우클릭:</strong> 이동/공격</span>
              <span><strong>A:</strong> 어택땅</span>
              <span><strong>스킬:</strong> Q, W, E, R</span>
              <span><strong>스펠:</strong> D(점멸), F(점화/회복)</span>
              <span><strong>기능:</strong> B(귀환), P(상점), Tab(스코어), Y(시점)</span>
            </div>

            <button
              onClick={() => onStartGame(selectedChamp, selectedMode)}
              className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold font-cinzel text-base bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 shadow-xl hover:shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>소환사의 협곡 시작</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
