import React from 'react';
import { Champion } from '../types/game';
import { X, Trophy, Swords, Shield, Coins, Sparkles } from 'lucide-react';

interface ScoreboardModalProps {
  player: Champion;
  enemyChampion: Champion | null;
  blueKills: number;
  redKills: number;
  gameTime: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ScoreboardModal: React.FC<ScoreboardModalProps> = ({
  player,
  enemyChampion,
  blueKills,
  redKills,
  gameTime,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-950 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="font-cinzel text-lg font-bold text-amber-300">소환사의 협곡 점수판 (TAB)</h3>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono-numbers text-sm text-slate-300 font-bold bg-slate-800 px-3 py-1 rounded-full">
              경기 시간: {gameTime}
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Teams Table */}
        <div className="p-6 flex flex-col gap-6">
          {/* Blue Team (Ally) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
              <span>블루 팀 (아군) - {blueKills} 킬</span>
              <span>아이템 & 골드</span>
            </div>
            <div className="bg-slate-900/60 border border-blue-500/30 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-blue-400 overflow-hidden bg-slate-800 relative">
                  <img src={player.portraitUrl} alt={player.nameKr} className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 right-0 bg-black text-[9px] font-bold text-white px-1 rounded-tl">
                    {player.level}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{player.nameKr} (플레이어)</span>
                    <span className="text-[11px] text-slate-400">{player.titleKr}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-300 mt-1 font-mono-numbers">
                    <span className="text-amber-400 font-bold">{player.kills} / {player.deaths} / {player.assists}</span>
                    <span className="text-slate-400">CS: <strong className="text-white">{player.cs}</strong></span>
                    <span className="text-amber-300">🪙 {player.gold}G</span>
                  </div>
                </div>
              </div>

              {/* Items Inventory */}
              <div className="flex items-center gap-1.5">
                {player.items.map((it, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded border border-slate-700 bg-slate-950 flex items-center justify-center text-sm"
                    title={it ? it.nameKr : '빈 슬롯'}
                  >
                    {it ? it.icon : <span className="text-slate-700 text-[10px]">{i + 1}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Red Team (Enemy) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-2 text-xs font-semibold text-red-400 uppercase tracking-wider">
              <span>레드 팀 (적군 AI) - {redKills} 킬</span>
              <span>아이템 & 골드</span>
            </div>
            {enemyChampion ? (
              <div className="bg-slate-900/60 border border-red-500/30 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-red-400 overflow-hidden bg-slate-800 relative">
                    <img src={enemyChampion.portraitUrl} alt={enemyChampion.nameKr} className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 right-0 bg-black text-[9px] font-bold text-white px-1 rounded-tl">
                      {enemyChampion.level}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{enemyChampion.nameKr} (AI 봇)</span>
                      <span className="text-[11px] text-slate-400">{enemyChampion.titleKr}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-300 mt-1 font-mono-numbers">
                      <span className="text-red-400 font-bold">{enemyChampion.kills} / {enemyChampion.deaths} / {enemyChampion.assists}</span>
                      <span className="text-slate-400">CS: <strong className="text-white">{enemyChampion.cs}</strong></span>
                      <span className="text-amber-300">🪙 {enemyChampion.gold}G</span>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="flex items-center gap-1.5">
                  {enemyChampion.items.map((it, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded border border-slate-700 bg-slate-950 flex items-center justify-center text-sm"
                    >
                      {it ? it.icon : <span className="text-slate-700 text-[10px]">{i + 1}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-900/40 rounded-xl text-center text-xs text-slate-500">
                적 챔피언 없음 (단독 연습 모드)
              </div>
            )}
          </div>
        </div>

        {/* Footer controls tip */}
        <div className="px-6 py-3 bg-slate-900/40 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>단축키: Tab 또는 ESC로 닫기</span>
          <span>League of Legends Web Edition</span>
        </div>
      </div>
    </div>
  );
};
