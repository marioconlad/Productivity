import React from 'react';
import { X, Clock, Target, CheckCircle2, ArrowRight, HelpCircle, BookOpen, Flame, Undo2, Command } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ItemTypesGuideModal: React.FC = () => {
  const { modalState, closeGuideModal, closeLegendModal } = useApp();
  const isOpen = (modalState as any).isGuideOpen ?? false;
  const close = closeGuideModal || closeLegendModal;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl apple-panel rounded-2xl shadow-2xl border border-white/60 dark:border-white/10 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[rgba(60,60,67,0.12)] dark:border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#0A84FF]/10 text-[#0A84FF] flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#1C1C1E] dark:text-[#F5F5F7]">
                Tempo Guide: Tasks, Automatic Streaks & Shortcuts
              </h3>
              <p className="text-[11px] text-[#6E6E73] dark:text-[#A1A1A6]">
                Everything you need to master planning, automatic streaks, and keyboard shortcuts
              </p>
            </div>
          </div>
          <button
            onClick={close}
            className="p-1 rounded-md text-[#6E6E73] hover:text-[#1C1C1E] dark:hover:text-[#F5F5F7] hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          
          {/* 1. AUTOMATIC STREAKS */}
          <div className="p-3.5 rounded-xl apple-subpanel space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center text-xs">
                <Flame className="w-3.5 h-3.5 fill-current" />
              </span>
              <div>
                <h4 className="text-xs font-semibold text-[#1C1C1E] dark:text-[#F5F5F7] flex items-center gap-2">
                  <span>Automatic Category Streaks</span>
                  <span className="text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">
                    No Habit Duplicates Needed
                  </span>
                </h4>
              </div>
            </div>

            <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
              Streaks in Tempo are <strong className="text-[#1C1C1E] dark:text-[#F5F5F7]">100% automatic</strong>. Whenever you complete ≥1 task on any day in a category (or across all categories), that day becomes an active day. Your streak counts consecutive active days ending today (or yesterday if today isn't done yet).
            </p>

            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#6E6E73] dark:text-[#A1A1A6] pt-1">
              <li>Completing any task extends your active streak for that category.</li>
              <li>Unchecking a task immediately recalculates your streak live.</li>
              <li>Track weekly active days (Mon-Sun) and monthly task goals in the Report tab.</li>
            </ul>
          </div>

          {/* 2. REMINDER (TASKS & DEADLINES) */}
          <div className="p-3.5 rounded-xl apple-subpanel space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#0A84FF]/15 text-[#0A84FF] flex items-center justify-center text-xs">
                <Clock className="w-3.5 h-3.5" />
              </span>
              <div>
                <h4 className="text-xs font-semibold text-[#1C1C1E] dark:text-[#F5F5F7] flex items-center gap-2">
                  <span>Reminder</span>
                  <span className="text-[10px] font-medium bg-[#0A84FF]/10 text-[#0A84FF] px-2 py-0.5 rounded-full">
                    Actionable Tasks & Deadlines
                  </span>
                </h4>
              </div>
            </div>

            <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
              <strong className="text-[#1C1C1E] dark:text-[#F5F5F7]">Date & Time are optional:</strong> By default, tasks have no date or time. An unscheduled task stays safely in your Calendar Backlog. Setting a date places it on that day's timeline. Push alerts can be enabled whenever both date and time are provided.
            </p>
          </div>

          {/* 3. GOAL */}
          <div className="p-3.5 rounded-xl apple-subpanel space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs">
                <Target className="w-3.5 h-3.5" />
              </span>
              <div>
                <h4 className="text-xs font-semibold text-[#1C1C1E] dark:text-[#F5F5F7] flex items-center gap-2">
                  <span>Goal</span>
                  <span className="text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                    Milestones & Targets
                  </span>
                </h4>
              </div>
            </div>

            <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
              Define high-level milestones with numeric targets and units (e.g., $5,000 Saved, 10 Books Read).
            </p>
          </div>

          {/* 4. KEYBOARD SHORTCUTS & UNDO/REDO */}
          <div className="p-3.5 rounded-xl apple-subpanel space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-500/15 text-indigo-500 flex items-center justify-center text-xs">
                <Command className="w-3.5 h-3.5" />
              </span>
              <div>
                <h4 className="text-xs font-semibold text-[#1C1C1E] dark:text-[#F5F5F7] flex items-center gap-2">
                  <span>Keyboard Shortcuts & Global Undo</span>
                </h4>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="bg-white/60 dark:bg-white/[0.04] p-2 rounded-lg border border-[rgba(60,60,67,0.08)] dark:border-white/5 space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[var(--text-secondary)]">Undo</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono text-[10px]">⌘Z</kbd>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[var(--text-secondary)]">Redo</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono text-[10px]">⌘⇧Z / ⌘Y</kbd>
                </div>
              </div>

              <div className="bg-white/60 dark:bg-white/[0.04] p-2 rounded-lg border border-[rgba(60,60,67,0.08)] dark:border-white/5 space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[var(--text-secondary)]">Select All in Panel</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono text-[10px]">⌘A</kbd>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[var(--text-secondary)]">Clear Selection</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono text-[10px]">Esc</kbd>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[rgba(60,60,67,0.12)] dark:border-white/10 flex justify-end">
          <button
            onClick={close}
            className="px-4 py-1.5 rounded-xl bg-[#0A84FF] text-white text-xs font-semibold hover:bg-[#0071E3] transition cursor-pointer"
          >
            Got it
          </button>
        </div>

      </div>
    </div>
  );
};
