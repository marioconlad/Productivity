import React, { useState } from 'react';
import {
  CheckSquare,
  Columns3,
  CalendarDays,
  TrendingUp,
  Moon,
  Sun,
  Laptop,
  Database,
  HelpCircle,
  PanelLeft,
  Undo2,
  Redo2,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ViewMode } from '../types';
import { MacInstallModal } from './MacInstallModal';
import { PomodoroTimer } from './PomodoroTimer';
import { DataBackupModal } from './DataBackupModal';

interface HeaderProps {
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  sidebarCollapsed = false,
  onToggleSidebar,
}) => {
  const {
    viewMode,
    setViewMode,
    theme,
    setTheme,
    openGuideModal,
    undo,
    redo,
    canUndo,
    canRedo,
    nextUndoDescription,
    nextRedoDescription,
    undoToast,
    clearUndoToast,
  } = useApp();

  const [showMacModal, setShowMacModal] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);

  const viewOptions: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    {
      id: 'list',
      label: 'Reminders',
      icon: <CheckSquare className="w-4 h-4" />,
    },
    {
      id: 'kanban',
      label: 'Board',
      icon: <Columns3 className="w-4 h-4" />,
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: <CalendarDays className="w-4 h-4" />,
    },
    {
      id: 'analytics',
      label: 'Report',
      icon: <TrendingUp className="w-4 h-4" />,
    },
  ];

  const cycleTheme = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('system');
    else setTheme('dark');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[rgba(255,255,255,0.65)] dark:bg-[rgba(44,44,48,0.65)] backdrop-blur-[12px] [-webkit-backdrop-filter:blur(12px)] border-b border-[rgba(255,255,255,0.6)] dark:border-[rgba(255,255,255,0.08)] shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between gap-4">
        
        {/* Brand Logo, Name & Sidebar Toggle */}
        <div className="flex items-center gap-2.5">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label="Toggle sidebar"
              className="p-1.5 rounded-[8px] text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#1C1C1E] dark:hover:text-[#F5F5F7] hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}

          <div className="shrink-0 select-none">
            <svg
              className="w-9 h-9 rounded-2xl shadow-sm ring-1 ring-black/5 dark:ring-white/10"
              viewBox="0 0 100 100"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="headerTempoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
              </defs>
              <rect width="100" height="100" rx="22" fill="#FFFFFF" />
              <circle cx="50" cy="50" r="33" fill="url(#headerTempoGrad)" />
              <circle cx="50" cy="50" r="3.5" fill="#FFFFFF" />
              <line x1="50" y1="50" x2="37" y2="34" stroke="#FFFFFF" strokeWidth="5.5" strokeLinecap="round" />
              <line x1="50" y1="50" x2="65" y2="30" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" />
            </svg>
          </div>

          <div>
            <span className="font-semibold text-[#1C1C1E] dark:text-[#F5F5F7] text-base tracking-tight flex items-center gap-1.5">
              Tempo
              <span className="text-[10px] font-medium tracking-wide px-1.5 py-0.5 rounded-full bg-[#0A84FF]/10 text-[#0A84FF] dark:bg-[#0A84FF]/20 dark:text-[#0A84FF]">
                PRO
              </span>
            </span>
            <p className="text-[11px] text-[#6E6E73] dark:text-[#A1A1A6] hidden sm:block">
              Reminders · Goals · Planner
            </p>
          </div>
        </div>

        {/* Apple Segmented Control View Switcher */}
        <nav className="flex items-center apple-segmented-pill p-1 rounded-full">
          {viewOptions.map((opt) => {
            const isActive = viewMode === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setViewMode(opt.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-[13px] transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-[#3A3A3C] text-[#0A84FF] shadow-[0_1px_3px_rgba(0,0,0,0.08)] font-medium'
                    : 'text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#1C1C1E] dark:hover:text-[#F5F5F7] font-normal'
                }`}
              >
                {opt.icon}
                <span className="hidden md:inline">{opt.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Action Icons & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          {/* Global Undo & Redo Buttons */}
          <div className="flex items-center bg-white/40 dark:bg-white/5 p-0.5 rounded-[10px] border border-black/5 dark:border-white/10">
            <button
              onClick={() => undo()}
              disabled={!canUndo}
              title={canUndo ? `Undo: ${nextUndoDescription} (⌘Z)` : 'Undo (⌘Z)'}
              aria-label="Undo"
              className={`p-1.5 rounded-[8px] transition cursor-pointer ${
                canUndo
                  ? 'text-[#1C1C1E] dark:text-[#F5F5F7] hover:bg-white/80 dark:hover:bg-white/15'
                  : 'text-[#8E8E93]/40 cursor-not-allowed'
              }`}
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => redo()}
              disabled={!canRedo}
              title={canRedo ? `Redo: ${nextRedoDescription} (⌘⇧Z)` : 'Redo (⌘⇧Z)'}
              aria-label="Redo"
              className={`p-1.5 rounded-[8px] transition cursor-pointer ${
                canRedo
                  ? 'text-[#1C1C1E] dark:text-[#F5F5F7] hover:bg-white/80 dark:hover:bg-white/15'
                  : 'text-[#8E8E93]/40 cursor-not-allowed'
              }`}
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tomato Pomodoro Focus Timer */}
          <PomodoroTimer />

          {/* Data Backup (Export & Import JSON) */}
          <button
            onClick={() => setShowDataModal(true)}
            title="Data Backup (Export or Import JSON data)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] bg-white/40 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 text-[#1C1C1E] dark:text-[#F5F5F7] text-xs font-medium transition cursor-pointer border border-black/5 dark:border-white/10"
          >
            <Database className="w-3.5 h-3.5 text-[#6E6E73] dark:text-[#A1A1A6]" />
            <span className="hidden lg:inline">Data</span>
          </button>

          {/* Mac App (DMG / Dock) Button */}
          <button
            onClick={() => setShowMacModal(true)}
            title="Run on Mac (Add to Dock or DMG build guide)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] bg-white/40 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 text-[#1C1C1E] dark:text-[#F5F5F7] text-xs font-medium transition cursor-pointer border border-black/5 dark:border-white/10"
          >
            <Laptop className="w-3.5 h-3.5 text-[#6E6E73] dark:text-[#A1A1A6]" />
            <span className="hidden lg:inline">Mac App</span>
          </button>

          {/* Guide Modal: Reminder & Goal */}
          <button
            onClick={openGuideModal}
            title="Item Types Guide: How to use Reminder & Goal"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] bg-white/40 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 text-[#1C1C1E] dark:text-[#F5F5F7] text-xs font-medium transition cursor-pointer border border-black/5 dark:border-white/10"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#0A84FF]" />
            <span className="hidden md:inline">Guide</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={cycleTheme}
            title={`Current theme: ${theme}. Click to change.`}
            className="p-1.5 rounded-[10px] text-[#6E6E73] dark:text-[#A1A1A6] hover:bg-white/60 dark:hover:bg-white/10 transition cursor-pointer"
          >
            {theme === 'dark' ? (
              <Moon className="w-4 h-4 text-[#A1A1A6]" />
            ) : theme === 'light' ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : (
              <Laptop className="w-4 h-4 text-[#6E6E73]" />
            )}
          </button>
        </div>

      </div>

      {/* Global 5-second Undo / Redo Toast Banner */}
      {undoToast && (
        <div className="fixed top-18 right-6 z-50 flex items-center gap-3 px-4 py-2.5 rounded-xl apple-panel shadow-2xl border border-white/60 dark:border-white/10 animate-slideDown">
          <span className="text-xs font-medium text-[#1C1C1E] dark:text-[#F5F5F7]">
            {undoToast.message}
          </span>

          {undoToast.onAction && (
            <button
              onClick={() => {
                undoToast.onAction?.();
                clearUndoToast();
              }}
              className="px-2.5 py-1 rounded-lg bg-[#0A84FF] text-white text-xs font-semibold hover:bg-[#0071E3] transition cursor-pointer"
            >
              {undoToast.actionLabel || 'Undo'}
            </button>
          )}

          <button
            onClick={clearUndoToast}
            className="p-1 rounded-md text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-[#F5F5F7] transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Mac Desktop / DMG Installation Modal */}
      <MacInstallModal isOpen={showMacModal} onClose={() => setShowMacModal(false)} />

      {/* Data Backup Modal (JSON Export & Import) */}
      <DataBackupModal isOpen={showDataModal} onClose={() => setShowDataModal(false)} />
    </header>
  );
};
