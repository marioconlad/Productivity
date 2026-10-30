import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, X, Settings, Check } from 'lucide-react';
import { sounds } from '../lib/audio';

type TimerMode = 'work' | 'short_break' | 'long_break';

export interface PomodoroSettings {
  focusTime: number; // in minutes
  shortBreak: number; // in minutes
  longBreak: number; // in minutes
  sessionsBeforeLongBreak: number;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  focusTime: 25,
  shortBreak: 5,
  longBreak: 15,
  sessionsBeforeLongBreak: 4,
};

const STORAGE_KEY = 'tempo_pomodoro_settings';

const MODE_LABELS: Record<TimerMode, string> = {
  work: 'Focus',
  short_break: 'Short Break',
  long_break: 'Long Break',
};

export const PomodoroTimer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Settings state persisted in localStorage
  const [settings, setSettings] = useState<PomodoroSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          focusTime: Number(parsed.focusTime) || DEFAULT_SETTINGS.focusTime,
          shortBreak: Number(parsed.shortBreak) || DEFAULT_SETTINGS.shortBreak,
          longBreak: Number(parsed.longBreak) || DEFAULT_SETTINGS.longBreak,
          sessionsBeforeLongBreak:
            Number(parsed.sessionsBeforeLongBreak) || DEFAULT_SETTINGS.sessionsBeforeLongBreak,
        };
      }
    } catch {
      // fallback
    }
    return DEFAULT_SETTINGS;
  });

  const getDurationForMode = (m: TimerMode, customSettings = settings) => {
    switch (m) {
      case 'work':
        return Math.max(1, customSettings.focusTime) * 60;
      case 'short_break':
        return Math.max(1, customSettings.shortBreak) * 60;
      case 'long_break':
        return Math.max(1, customSettings.longBreak) * 60;
    }
  };

  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(() => getDurationForMode('work', settings));
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [completedSessions, setCompletedSessions] = useState(0);

  const timerRef = useRef<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Save settings when modified
  const updateSettings = (updates: Partial<PomodoroSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      // Changes apply to the next session, not running one:
      // If timer is not running, update timeLeft to reflect the new setting for current mode
      if (!isRunning) {
        setTimeLeft(getDurationForMode(mode, next));
      }
      return next;
    });
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsSettingsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Timer interval countdown
  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            if (soundEnabled) {
              sounds.playCelebration();
            }
            if (mode === 'work') {
              setCompletedSessions((s) => s + 1);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, soundEnabled, mode]);

  const switchMode = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(getDurationForMode(newMode));
  };

  const togglePlay = () => {
    if (timeLeft === 0) {
      setTimeLeft(getDurationForMode(mode));
    }
    setIsRunning((prev) => !prev);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(getDurationForMode(mode));
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const totalDuration = getDurationForMode(mode);
  const progressPercent = Math.min(
    100,
    Math.round(((totalDuration - timeLeft) / totalDuration) * 100)
  );

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Tomato Header Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        title="Pomodoro Focus Timer (Click to open)"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer apple-subpanel ${
          isRunning
            ? 'ring-1.5 ring-[#0A84FF] text-[#0A84FF] shadow-xs'
            : isOpen
            ? 'bg-black/10 dark:bg-white/15 text-[#1C1C1E] dark:text-[#F5F5F7]'
            : 'text-[#1C1C1E] dark:text-[#F5F5F7] hover:bg-black/5 dark:hover:bg-white/10'
        }`}
      >
        <span className="text-xs select-none" role="img" aria-label="Pomodoro Tomato">
          🍅
        </span>
        <span className="font-mono text-xs">{formatTime(timeLeft)}</span>
      </button>

      {/* Downward Dropdown Popover */}
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-80 apple-panel rounded-2xl shadow-2xl border border-white/60 dark:border-white/10 p-4 z-50 animate-fadeIn space-y-3">
          {/* Header Row */}
          <div className="flex items-center justify-between pb-2 border-b border-[rgba(60,60,67,0.12)] dark:border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-base">🍅</span>
              <div>
                <h4 className="text-xs font-semibold text-[#1C1C1E] dark:text-[#F5F5F7]">
                  Focus Timer
                </h4>
                <p className="text-[10px] text-[#6E6E73] dark:text-[#A1A1A6]">
                  {completedSessions} {completedSessions === 1 ? 'session' : 'sessions'} completed
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Settings Toggle Button */}
              <button
                onClick={() => setIsSettingsOpen((v) => !v)}
                title={isSettingsOpen ? 'Close Timer Settings' : 'Edit Timer Durations'}
                className={`p-1 rounded-md transition cursor-pointer ${
                  isSettingsOpen
                    ? 'bg-black/10 dark:bg-white/15 text-[#1C1C1E] dark:text-[#F5F5F7]'
                    : 'text-[#6E6E73] hover:text-[#1C1C1E] dark:hover:text-[#F5F5F7]'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setSoundEnabled((v) => !v)}
                title={soundEnabled ? 'Mute alert' : 'Enable alert'}
                className="p-1 rounded-md text-[#6E6E73] hover:text-[#1C1C1E] dark:hover:text-[#F5F5F7] transition cursor-pointer"
              >
                {soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsSettingsOpen(false);
                }}
                className="p-1 rounded-md text-[#6E6E73] hover:text-[#1C1C1E] dark:hover:text-[#F5F5F7] transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Editable Settings Panel */}
          {isSettingsOpen ? (
            <div className="space-y-2.5 p-3 rounded-xl apple-subpanel animate-fadeIn">
              <div className="flex items-center justify-between pb-1 border-b border-[rgba(60,60,67,0.12)] dark:border-white/10">
                <span className="text-[10px] font-medium text-[#6E6E73] dark:text-[#A1A1A6] uppercase tracking-wider">
                  Timer Settings (min)
                </span>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-[10px] font-medium text-[#0A84FF] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  <span>Done</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] font-medium text-[#6E6E73] dark:text-[#A1A1A6] mb-0.5">
                    Focus Duration
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={settings.focusTime}
                      onChange={(e) => updateSettings({ focusTime: Math.max(1, Number(e.target.value) || 1) })}
                      className="w-full px-2 py-1 rounded-lg bg-white/70 dark:bg-black/20 border border-[rgba(60,60,67,0.15)] dark:border-white/10 font-mono text-[#1C1C1E] dark:text-[#F5F5F7] text-xs focus:outline-none"
                    />
                    <span className="text-[10px] text-[#6E6E73]">m</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-[#6E6E73] dark:text-[#A1A1A6] mb-0.5">
                    Short Break
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={settings.shortBreak}
                      onChange={(e) => updateSettings({ shortBreak: Math.max(1, Number(e.target.value) || 1) })}
                      className="w-full px-2 py-1 rounded-lg bg-white/70 dark:bg-black/20 border border-[rgba(60,60,67,0.15)] dark:border-white/10 font-mono text-[#1C1C1E] dark:text-[#F5F5F7] text-xs focus:outline-none"
                    />
                    <span className="text-[10px] text-[#6E6E73]">m</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-[#6E6E73] dark:text-[#A1A1A6] mb-0.5">
                    Long Break
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={90}
                      value={settings.longBreak}
                      onChange={(e) => updateSettings({ longBreak: Math.max(1, Number(e.target.value) || 1) })}
                      className="w-full px-2 py-1 rounded-lg bg-white/70 dark:bg-black/20 border border-[rgba(60,60,67,0.15)] dark:border-white/10 font-mono text-[#1C1C1E] dark:text-[#F5F5F7] text-xs focus:outline-none"
                    />
                    <span className="text-[10px] text-[#6E6E73]">m</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-[#6E6E73] dark:text-[#A1A1A6] mb-0.5">
                    Sessions before Long
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={settings.sessionsBeforeLongBreak}
                      onChange={(e) =>
                        updateSettings({ sessionsBeforeLongBreak: Math.max(1, Number(e.target.value) || 1) })
                      }
                      className="w-full px-2 py-1 rounded-lg bg-white/70 dark:bg-black/20 border border-[rgba(60,60,67,0.15)] dark:border-white/10 font-mono text-[#1C1C1E] dark:text-[#F5F5F7] text-xs focus:outline-none"
                    />
                    <span className="text-[10px] text-[#6E6E73]">#</span>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-[#6E6E73] dark:text-[#A1A1A6] italic">
                Changes apply to the next session and persist automatically.
              </p>
            </div>
          ) : (
            <>
              {/* Mode Switcher Tabs */}
              <div className="grid grid-cols-3 gap-0.5 bg-black/5 dark:bg-white/10 p-0.5 rounded-xl text-xs font-medium">
                {(['work', 'short_break', 'long_break'] as TimerMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => switchMode(m)}
                    className={`py-1 text-[11px] font-medium rounded-lg transition cursor-pointer ${
                      mode === m
                        ? 'bg-white dark:bg-white/20 text-[#1C1C1E] dark:text-[#F5F5F7] shadow-xs'
                        : 'text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#1C1C1E] dark:hover:text-[#F5F5F7]'
                    }`}
                  >
                    {MODE_LABELS[m]}
                  </button>
                ))}
              </div>

              {/* Time Display & Progress Bar */}
              <div className="text-center py-2 space-y-1.5">
                <div className="font-mono text-3xl font-semibold tracking-tight text-[#1C1C1E] dark:text-[#F5F5F7]">
                  {formatTime(timeLeft)}
                </div>

                {/* Subtle Progress Bar */}
                <div className="w-full bg-black/10 dark:bg-white/10 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-[#0A84FF] h-full rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Controls: Play/Pause and Reset */}
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  onClick={togglePlay}
                  className="flex-1 py-1.5 px-3 rounded-lg text-xs font-medium text-white shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer bg-[#0A84FF] hover:bg-[#0071E3]"
                >
                  {isRunning ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{timeLeft === 0 ? 'Restart' : 'Start Focus'}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={resetTimer}
                  title="Reset Timer"
                  className="p-1.5 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 text-[#6E6E73] dark:text-[#A1A1A6] transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
