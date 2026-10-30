import React from 'react';
import { X, BookOpen, Brain, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { COGNITIVE_DISTORTIONS } from '../types';

export const CognitiveDistortionLegendModal: React.FC = () => {
  const { modalState, closeLegendModal } = useApp();
  const { isLegendOpen } = modalState;

  if (!isLegendOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl apple-panel rounded-2xl shadow-2xl border border-white/60 dark:border-white/10 overflow-hidden flex flex-col max-h-[88vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[rgba(60,60,67,0.12)] dark:border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#0A84FF]/10 text-[#0A84FF] flex items-center justify-center">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#1C1C1E] dark:text-[#F5F5F7]">
                Cognitive Emotional Distortions Legend
              </h3>
              <p className="text-[11px] text-[#6E6E73] dark:text-[#A1A1A6]">David D. Burns CBT Cognitive Reframing Guide</p>
            </div>
          </div>
          <button
            onClick={closeLegendModal}
            className="p-1 rounded-md text-[#6E6E73] hover:text-[#1C1C1E] dark:hover:text-[#F5F5F7] hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Table of Distortions & Definitions */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
            Identify which automatic distortions are present in your thoughts when feeling distressed.
          </p>

          <div className="rounded-xl apple-subpanel overflow-hidden divide-y divide-[rgba(60,60,67,0.08)] dark:divide-white/5">
            {COGNITIVE_DISTORTIONS.map((d) => (
              <div
                key={d.name}
                className="p-3 hover:bg-black/5 dark:hover:bg-white/5 transition flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4"
              >
                <div className="sm:w-52 shrink-0">
                  <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                    {d.name}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                    {d.definition}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[rgba(60,60,67,0.12)] dark:border-white/10 flex justify-end shrink-0">
          <button
            onClick={closeLegendModal}
            className="px-3.5 py-1.5 rounded-lg bg-[#0A84FF] text-white text-xs font-medium hover:bg-[#0071E3] transition cursor-pointer"
          >
            Close Legend
          </button>
        </div>

      </div>
    </div>
  );
};
