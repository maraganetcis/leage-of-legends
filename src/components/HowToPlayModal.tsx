import React, { useState } from 'react';
import { HOW_TO_PLAY_SECTIONS } from '../game/constants';
import { X, HelpCircle, Swords, Play, Sparkles, ChevronRight, Award } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<number>(0);

  if (!isOpen) return null;

  const currentSection = HOW_TO_PLAY_SECTIONS[activeTab] || HOW_TO_PLAY_SECTIONS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="bg-slate-950 border border-amber-600/50 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden text-slate-100 flex flex-col font-sans max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 to-indigo-950/80 border-b border-amber-600/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 border border-amber-500/40 rounded-xl">
              <HelpCircle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-cinzel text-amber-300">
                초보자 실전 플레이 완벽 가이드
              </h2>
              <p className="text-xs text-slate-400">
                어떤 식으로 플레이해야 이길 수 있는지, 챔피언별 스킬 콤보와 실전 팁을 알려드립니다!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-800 bg-slate-900/40">
          {HOW_TO_PLAY_SECTIONS.map((sec, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(idx)}
              className={`pb-3 px-3 text-xs font-bold transition-all relative ${
                activeTab === idx
                  ? 'text-amber-300 border-b-2 border-amber-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{sec.title.split('(')[0]}</span>
              <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-normal">
                {sec.badge}
              </span>
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-5 bg-slate-900/20">
          {/* Overview Banner */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm text-slate-100">{currentSection.title}</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {currentSection.description}
              </p>
            </div>
          </div>

          {/* Steps / Champions list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {currentSection.steps.map((st, i) => (
              <div
                key={i}
                className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col gap-2 shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl p-1.5 bg-slate-900 rounded-xl border border-slate-800">
                    {st.icon}
                  </span>
                  <h4 className="font-bold text-sm text-amber-300 leading-snug">
                    {st.title}
                  </h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed pl-1">
                  {st.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Quick Controls Cheat Sheet */}
          <div className="mt-auto pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-3">
              <span><strong>우클릭:</strong> 이동/공격</span>
              <span><strong>A:</strong> 어택땅</span>
              <span><strong>Q,W,E,R:</strong> 스킬</span>
              <span><strong>D,F:</strong> 스펠</span>
              <span><strong>B:</strong> 귀환</span>
              <span><strong>P:</strong> 상점</span>
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow"
            >
              가이드 닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
