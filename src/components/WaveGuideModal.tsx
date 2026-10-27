import React, { useState } from 'react';
import { WAVE_MANAGEMENT_GUIDES, WaveGuideTopic } from '../game/constants';
import { X, BookOpen, Sparkles, Shield, Swords, Wind, ChevronRight } from 'lucide-react';

interface WaveGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WaveGuideModal: React.FC<WaveGuideModalProps> = ({ isOpen, onClose }) => {
  const [selectedTopicId, setSelectedTopicId] = useState<string>(WAVE_MANAGEMENT_GUIDES[0].id);

  if (!isOpen) return null;

  const currentTopic = WAVE_MANAGEMENT_GUIDES.find((t) => t.id === selectedTopicId) || WAVE_MANAGEMENT_GUIDES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-slate-950 border border-amber-600/50 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden text-slate-100 flex flex-col font-sans max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 to-indigo-950/70 border-b border-amber-600/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 border border-amber-500/40 rounded-xl">
              <BookOpen className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-cinzel text-amber-300">
                미니언 라인전 & 웨이브 관리 마스터 가이드
              </h2>
              <p className="text-xs text-slate-400">
                미니언 끌기(풀링), 부쉬 어그로 초기화, 라인 프리징, 슬로우/하드 푸시 총정리
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

        {/* Body: Left topic tabs + Right detailed explanation & diagrams */}
        <div className="flex flex-1 overflow-hidden">
          {/* Topic list */}
          <div className="w-72 border-r border-slate-800 p-3 bg-slate-900/30 flex flex-col gap-1.5 overflow-y-auto">
            <span className="text-[11px] font-bold text-slate-400 px-3 py-1 uppercase tracking-wider">
              웨이브 핵심 테크닉
            </span>
            {WAVE_MANAGEMENT_GUIDES.map((topic) => {
              const isActive = topic.id === selectedTopicId;
              return (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopicId(topic.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-2.5 ${
                    isActive
                      ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 shadow-md'
                      : 'hover:bg-slate-900 text-slate-300 border border-transparent'
                  }`}
                >
                  <span className="text-lg shrink-0 mt-0.5">{topic.icon}</span>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-xs block truncate">{topic.title}</span>
                    <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                      {topic.summary}
                    </span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-amber-400 shrink-0 self-center" />}
                </button>
              );
            })}
          </div>

          {/* Detailed view */}
          <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-5 bg-slate-900/10">
            {/* Title & Summary */}
            <div className="flex flex-col gap-1.5 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{currentTopic.icon}</span>
                <h3 className="text-xl font-bold font-cinzel text-amber-300">
                  {currentTopic.title}
                </h3>
              </div>
              <p className="text-sm text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                {currentTopic.summary}
              </p>
            </div>

            {/* Step-by-Step Breakdown */}
            <div className="flex flex-col gap-2.5">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                실전 실행 단계
              </span>
              <div className="flex flex-col gap-2">
                {currentTopic.detailedSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800"
                  >
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-xs text-slate-200 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pro Tip Box */}
            <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-indigo-950/60 border border-indigo-500/40 p-4 rounded-2xl flex items-start gap-3 shadow-lg">
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-amber-300 block mb-1">
                  챌린저 노하우 & 프로 팁
                </span>
                <p className="text-xs text-indigo-100 leading-relaxed font-medium">
                  {currentTopic.proTip}
                </p>
              </div>
            </div>

            {/* In-game Key Controls Helper */}
            <div className="mt-auto pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-slate-300">우클릭</span>
                <span>이동/공격</span>
                <span className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-slate-300 ml-2">A</span>
                <span>어택땅(Attack-Move)</span>
                <span className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-slate-300 ml-2">Space</span>
                <span>챔피언 중심</span>
              </div>
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow"
              >
                가이드 닫고 실전 적용하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
