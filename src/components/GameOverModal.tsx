import React from 'react';
import { Team } from '../types/game';
import { Trophy, RotateCcw, Home, Award, Swords, Coins } from 'lucide-react';

interface GameOverModalProps {
  isOpen: boolean;
  winner: Team | null;
  stats: {
    kills: number;
    deaths: number;
    cs: number;
    gold: number;
    time: string;
  };
  onPlayAgain: () => void;
  onGoToLobby: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  winner,
  stats,
  onPlayAgain,
  onGoToLobby,
}) => {
  if (!isOpen || !winner) return null;

  const isVictory = winner === 'blue';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-slate-950 border border-amber-600/50 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100 flex flex-col items-center p-8 text-center font-sans">
        {/* Victory / Defeat Badge */}
        <div className="relative mb-6">
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-2xl border-4 ${
              isVictory
                ? 'bg-gradient-to-b from-amber-500 to-amber-700 border-amber-300 text-slate-950'
                : 'bg-gradient-to-b from-red-600 to-red-900 border-red-400 text-white'
            }`}
          >
            {isVictory ? '👑' : '💀'}
          </div>
        </div>

        {/* Title */}
        <h2
          className={`text-4xl font-extrabold font-cinzel tracking-wider uppercase drop-shadow-lg ${
            isVictory ? 'text-amber-300' : 'text-red-500'
          }`}
        >
          {isVictory ? 'VICTORY (승리)' : 'DEFEAT (패배)'}
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          {isVictory ? '적 넥서스를 파괴하고 소환사의 협곡에서 승리했습니다!' : '아군 넥서스가 파괴되었습니다.'}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 w-full my-6 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div className="flex flex-col items-center p-2 bg-slate-950/60 rounded-xl">
            <span className="text-xs text-slate-400">K / D / A</span>
            <span className="font-bold font-mono-numbers text-lg text-amber-400">
              {stats.kills} / {stats.deaths} / 0
            </span>
          </div>

          <div className="flex flex-col items-center p-2 bg-slate-950/60 rounded-xl">
            <span className="text-xs text-slate-400">미니언 막타 (CS)</span>
            <span className="font-bold font-mono-numbers text-lg text-white">
              {stats.cs}
            </span>
          </div>

          <div className="flex flex-col items-center p-2 bg-slate-950/60 rounded-xl">
            <span className="text-xs text-slate-400">누적 골드</span>
            <span className="font-bold font-mono-numbers text-lg text-amber-300">
              🪙 {stats.gold}
            </span>
          </div>

          <div className="flex flex-col items-center p-2 bg-slate-950/60 rounded-xl">
            <span className="text-xs text-slate-400">경기 시간</span>
            <span className="font-bold font-mono-numbers text-lg text-white">
              {stats.time}
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3 w-full">
          <button
            onClick={onPlayAgain}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold font-cinzel text-sm bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:brightness-110 active:scale-95 transition-all shadow-lg"
          >
            <RotateCcw className="w-4 h-4" />
            <span>다시 플레이</span>
          </button>
          <button
            onClick={onGoToLobby}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold font-cinzel text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 active:scale-95 transition-all border border-slate-700"
          >
            <Home className="w-4 h-4" />
            <span>메인 메뉴</span>
          </button>
        </div>
      </div>
    </div>
  );
};
