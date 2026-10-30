import React, { useState, useMemo, useEffect } from 'react';
import {
  Flame,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Plus,
  PlusCircle,
  Edit2,
  TrendingUp,
  Sparkles,
  Layers,
  BarChart2,
  Target,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Category, Task } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { MentalCheckInSection } from './MentalCheckInSection';
import { calculateCategoryStreak, formatLocalDate } from '../lib/streak';

export const AnalyticsView: React.FC = () => {
  const {
    categories,
    tasks,
    habitLogs,
    mentalCheckIns,
    selectedCategory,
    setSelectedCategory,
    openCategoryModal,
    openTaskModal,
    updateCategory,
  } = useApp();

  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    selectedCategory === 'all' ? 'ALL' : selectedCategory || 'ALL'
  );

  useEffect(() => {
    setActiveCategoryId(selectedCategory === 'all' ? 'ALL' : selectedCategory || 'ALL');
  }, [selectedCategory]);

  const isAll = activeCategoryId === 'ALL';

  const today = new Date();
  const todayStr = formatLocalDate(today);
  const monthName = today.toLocaleString('default', { month: 'long' });

  // Get current week dates (Mon to Sun)
  const currentWeekDates = useMemo(() => {
    const d = new Date(today);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));

    const week: { dateStr: string; dayName: string; dayNum: number; isToday: boolean }[] = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
      const current = new Date(monday);
      current.setDate(monday.getDate() + i);
      const str = formatLocalDate(current);
      week.push({
        dateStr: str,
        dayName: dayNames[i],
        dayNum: current.getDate(),
        isToday: str === todayStr,
      });
    }
    return week;
  }, [todayStr]);

  const activeCategory: Category | undefined = isAll
    ? {
        id: 'ALL',
        userId: 'all',
        name: 'All Categories',
        type: 'all',
        color: '#0A84FF',
        icon: 'Layers',
        monthlyTaskGoal: categories.reduce((sum, c) => sum + (c.monthlyTaskGoal ?? 20), 0) || 120,
        createdAt: '',
      }
    : categories.find((c) => c.id === activeCategoryId) || categories[0];

  // Automatic Streaks and Metrics calculation
  const streakStats = useMemo(() => {
    return calculateCategoryStreak(activeCategoryId, tasks, habitLogs, today);
  }, [activeCategoryId, tasks, habitLogs]);

  // Monthly task goal (default 20, editable per category)
  const monthlyGoal = useMemo(() => {
    if (isAll) {
      return categories.reduce((sum, c) => sum + (c.monthlyTaskGoal ?? 20), 0);
    }
    return activeCategory?.monthlyTaskGoal ?? 20;
  }, [isAll, categories, activeCategory]);

  const monthPercent = Math.min(100, Math.round((streakStats.completedThisMonthCount / (monthlyGoal || 1)) * 100));

  // Editing monthly goal state
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState(String(monthlyGoal));

  useEffect(() => {
    setGoalDraft(String(monthlyGoal));
  }, [monthlyGoal]);

  const handleSaveGoal = async () => {
    const num = parseInt(goalDraft, 10);
    if (!isNaN(num) && num > 0 && !isAll && activeCategory) {
      await updateCategory(activeCategory.id, { monthlyTaskGoal: num });
    }
    setIsEditingGoal(false);
  };

  // Mon-Sun active days for current week
  const weeklyDayActivity = useMemo(() => {
    return currentWeekDates.map((day) => {
      const isActive = streakStats.activeDates.has(day.dateStr);
      return {
        ...day,
        active: isActive,
      };
    });
  }, [currentWeekDates, streakStats.activeDates]);

  const activeDaysThisWeek = weeklyDayActivity.filter((d) => d.active).length;

  // Filter tasks in active category for list review
  const categoryTasks = useMemo(() => {
    if (isAll) return tasks;
    return tasks.filter((t) => t.categoryId === activeCategory?.id);
  }, [isAll, tasks, activeCategory]);

  const completedTasksList = categoryTasks.filter((t) => t.completed);
  const openTasksList = categoryTasks.filter((t) => !t.completed);

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 space-y-6 animate-fadeIn">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Report
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Automatic streaks, weekly active days, and monthly task goal progress
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isAll && activeCategory && (
            <button
              onClick={() => openCategoryModal(activeCategory)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl apple-subpanel hover:bg-white/70 dark:hover:bg-white/10 text-xs font-semibold text-[var(--text-primary)] transition cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Category</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => {
            setActiveCategoryId('ALL');
            setSelectedCategory('all');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-medium transition cursor-pointer whitespace-nowrap ${
            isAll
              ? 'bg-[rgba(10,132,255,0.12)] text-[#0A84FF] border border-[#0A84FF]/25 shadow-2xs'
              : 'apple-subpanel text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-[#0A84FF]" />
          <span>All</span>
        </button>

        {categories.map((c) => {
          const isSelected = !isAll && c.id === activeCategory?.id;
          return (
            <button
              key={c.id}
              onClick={() => {
                setActiveCategoryId(c.id);
                setSelectedCategory(c.id);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                isSelected
                  ? 'bg-[rgba(10,132,255,0.12)] text-[#0A84FF] border border-[#0A84FF]/25 shadow-2xs'
                  : 'apple-subpanel text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: c.color }}
              />
              <span>{c.name}</span>
            </button>
          );
        })}
      </div>

      {/* 3 Pillar Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* 1. Relative Streak (Automatic) */}
        <div className="apple-subpanel rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              Current Streak
            </span>
            <div className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Flame className="w-3.5 h-3.5 fill-amber-500" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-semibold text-[var(--text-primary)] font-mono">
                {streakStats.currentStreak}
              </span>
              <span className="text-xs font-normal text-[var(--text-secondary)]">
                {streakStats.currentStreak === 1 ? 'consecutive active day' : 'consecutive active days'}
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] mt-1">
              Best streak: <span className="font-semibold text-[var(--text-primary)]">{streakStats.bestStreak} days</span>
            </p>
          </div>
        </div>

        {/* 2. Weekly Report (Mon-Sun active days) */}
        <div className="apple-subpanel rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              Completed This Week
            </span>
            <div className="w-6 h-6 rounded-full bg-[rgba(10,132,255,0.1)] text-[#0A84FF] flex items-center justify-center">
              <BarChart2 className="w-3.5 h-3.5" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-semibold text-[var(--text-primary)] font-mono">
                {streakStats.completedThisWeekCount}
              </span>
              <span className="text-xs font-normal text-[var(--text-secondary)]">
                tasks completed ({activeDaysThisWeek}/7 active days)
              </span>
            </div>
          </div>

          {/* 7-day Mini Activity Strip (Mon-Sun) */}
          <div className="grid grid-cols-7 gap-1 pt-1">
            {weeklyDayActivity.map((d) => (
              <div key={d.dateStr} className="flex flex-col items-center gap-1">
                <span className={`text-[10px] ${d.isToday ? 'font-semibold text-[#0A84FF]' : 'text-[var(--text-tertiary)]'}`}>
                  {d.dayName}
                </span>
                <div
                  className={`w-full h-2 rounded-full transition-all ${
                    d.active ? 'bg-[#0A84FF]' : 'bg-black/5 dark:bg-white/10'
                  }`}
                  style={{ backgroundColor: d.active ? (isAll ? '#0A84FF' : activeCategory?.color) : undefined }}
                  title={`${d.dayName} (${d.dateStr}): ${d.active ? 'Active day (tasks completed)' : 'No tasks completed'}`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 3. Monthly Task Goal Progress */}
        <div className="apple-subpanel rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              Monthly Task Goal ({monthName})
            </span>
            <div className="w-6 h-6 rounded-full bg-[rgba(10,132,255,0.1)] text-[#0A84FF] flex items-center justify-center">
              <Target className="w-3.5 h-3.5 text-[#0A84FF]" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-semibold text-[var(--text-primary)] font-mono">
                {streakStats.completedThisMonthCount}
              </span>
              <span className="text-xs font-normal text-[var(--text-secondary)]">
                / {monthlyGoal} tasks ({monthPercent}%)
              </span>
            </div>

            <div className="flex items-center justify-between mt-1 text-[11px] text-[var(--text-secondary)]">
              <span>Goal: {monthlyGoal} tasks/month</span>
              {!isAll && (
                isEditingGoal ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      value={goalDraft}
                      onChange={(e) => setGoalDraft(e.target.value)}
                      className="w-14 px-1 py-0.5 text-xs rounded bg-white dark:bg-black/30 border border-black/10 dark:border-white/10"
                    />
                    <button
                      onClick={handleSaveGoal}
                      className="text-xs text-[#0A84FF] font-semibold cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditingGoal(true)}
                    className="text-xs text-[#0A84FF] hover:underline cursor-pointer"
                  >
                    Edit Goal
                  </button>
                )
              )}
            </div>

            {/* Progress bar */}
            <div className="w-full bg-black/5 dark:bg-white/10 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-[#0A84FF] h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${monthPercent}%` }}
              />
            </div>
          </div>
        </div>

      </div>

      {/* CBT Mental Wellbeing Section */}
      <MentalCheckInSection />

      {/* Task Performance & Activity Summary */}
      <div className="apple-panel rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[rgba(60,60,67,0.12)] dark:border-white/10 pb-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Tasks in {activeCategory?.name || 'Category'} ({categoryTasks.length})
          </h3>
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {completedTasksList.length} completed · {openTasksList.length} open
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Open Tasks */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Open Tasks ({openTasksList.length})
            </h4>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {openTasksList.length === 0 ? (
                <p className="text-xs text-[var(--text-tertiary)] italic py-2">No open tasks.</p>
              ) : (
                openTasksList.slice(0, 15).map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-2 rounded-lg apple-subpanel text-xs text-[var(--text-primary)]"
                  >
                    <span className="truncate">{t.title}</span>
                    {t.dueDate && <span className="text-[10px] text-[var(--text-tertiary)]">{t.dueDate}</span>}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recently Completed Tasks */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Recently Completed ({completedTasksList.length})
            </h4>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {completedTasksList.length === 0 ? (
                <p className="text-xs text-[var(--text-tertiary)] italic py-2">No completed tasks yet.</p>
              ) : (
                completedTasksList.slice(0, 15).map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-2 rounded-lg apple-subpanel text-xs text-[var(--text-secondary)] line-through"
                  >
                    <span className="truncate">{t.title}</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 no-underline">
                      {t.completedAt ? t.completedAt.split('T')[0] : 'Done'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
