import React, { useState } from 'react';
import { TutorialObjective } from '../types/game';
import { Compass, CheckCircle2, ChevronRight, ChevronDown, ChevronUp, Sparkles, HelpCircle } from 'lucide-react';

interface TutorialGuideProps {
  objectives: TutorialObjective[];
  currentStep: number;
  onSkipStep: () => void;
  onClose?: () => void;
}

export const TutorialGuide: React.FC<TutorialGuideProps> = ({
  objectives,
  currentStep,
  onSkipStep,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const activeObjective = objectives[currentStep - 1] || objectives[objectives.length - 1];
  const progressPercent = Math.min(
    100,
    Math.round((activeObjective.currentCount / activeObjective.targetCount) * 100)
  );

  return (
    <div className="absolute top-16 left-4 z-40 pointer-events-auto select-none w-80 font-sans">
      <div className="bg-slate-950/95 backdrop-blur-md rounded-2xl border border-indigo-500/40 shadow-2xl overflow-hidden transition-all duration-200">
        {/* Header */}
        <div
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-950/80 to-slate-900 border-b border-indigo-500/20 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-xs text-indigo-200 uppercase tracking-wider">
              튜토리얼 ({currentStep} / {objectives.length})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono-numbers font-semibold text-amber-300">
              {progressPercent}%
            </span>
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </div>

        {/* Collapsible Body */}
        {!isCollapsed && (
          <div className="p-4 flex flex-col gap-3">
            {/* Step Title & Status */}
            <div className="flex items-start gap-2">
              <div className="p-1 rounded-full bg-indigo-900/60 text-indigo-300 mt-0.5">
                {activeObjective.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-100">{activeObjective.title}</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {activeObjective.description}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono-numbers">
                <span>달성도</span>
                <span className="text-amber-400 font-bold">
                  {activeObjective.currentCount} / {activeObjective.targetCount}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-amber-400 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Hint Box */}
            <div className="flex items-start gap-2 bg-indigo-950/40 border border-indigo-500/20 p-2.5 rounded-xl text-[11px] text-indigo-200">
              <HelpCircle className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5" />
              <span>{activeObjective.hint}</span>
            </div>

            {/* Action footer */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
              <span className="text-[10px] text-slate-500">
                우클릭: 이동/공격 | QWER: 스킬
              </span>
              <button
                onClick={onSkipStep}
                className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300 px-2 py-1 rounded hover:bg-slate-800 transition-colors"
              >
                <span>단계 넘기기</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
