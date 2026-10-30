import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  Calendar as CalendarIcon,
  Check,
  Clock,
  Inbox as InboxIcon,
  CheckCircle2,
  Trash2,
  Edit2,
  ArrowRight,
  Folder,
  X,
  GripVertical,
  CheckSquare,
  Square,
  MinusSquare,
  Copy,
  CalendarDays,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Task, Category } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { formatLocalDate } from '../lib/streak';

export const CalendarView: React.FC = () => {
  const {
    tasks,
    categories,
    selectedCategory,
    toggleTaskCompletion,
    openTaskModal,
    addTask,
    updateTask,
    deleteTask,
    duplicateTask,
    reorderTasks,
    bulkUpdateTasks,
    bulkDeleteTasks,
    bulkSetDate,
    bulkClearDateTime,
  } = useApp();

  // Active anchor date for week / month navigation
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(formatLocalDate(new Date()));
  const [selectMode, setSelectMode] = useState<boolean>(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [lastSelectedTaskId, setLastSelectedTaskId] = useState<string | null>(null);

  // Floating Bulk Move To Day State
  const [showMoveDateInput, setShowMoveDateInput] = useState(false);
  const [bulkDateValue, setBulkDateValue] = useState('');

  // Drag-and-drop state (Unified with Reminders: blue insertion indicator lines)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);
  const [dragOverDateStr, setDragOverDateStr] = useState<string | null>(null);
  const [isBacklogDragOver, setIsBacklogDragOver] = useState<boolean>(false);
  const [isDayPageDragOver, setIsDayPageDragOver] = useState<boolean>(false);

  // Collapsed categories state in Backlog (persisted across reloads)
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('focusflow_calendar_backlog_collapsed');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleCategoryCollapse = (catId: string) => {
    setCollapsedCategories((prev) => {
      const updated = { ...prev, [catId]: !prev[catId] };
      try {
        localStorage.setItem('focusflow_calendar_backlog_collapsed', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save collapsed state', e);
      }
      return updated;
    });
  };

  const selectedDate = useMemo(() => {
    const [y, m, d] = selectedDateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [selectedDateStr]);

  const year = currentDate.getFullYear();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // Calculate Monday-to-Sunday dates for the active week
  const weekDays = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));

    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const result: {
      dateStr: string;
      dayLabel: string;
      dayNumber: number;
      isToday: boolean;
      isSelected: boolean;
      dateObj: Date;
    }[] = [];

    const todayStr = formatLocalDate(new Date());

    for (let i = 0; i < 7; i++) {
      const cur = new Date(monday);
      cur.setDate(monday.getDate() + i);
      const str = formatLocalDate(cur);
      result.push({
        dateStr: str,
        dayLabel: dayLabels[i],
        dayNumber: cur.getDate(),
        isToday: str === todayStr,
        isSelected: str === selectedDateStr,
        dateObj: cur,
      });
    }
    return result;
  }, [currentDate, selectedDateStr]);

  // Navigate week
  const handlePrevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const handleNextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  const handleTodayClick = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(formatLocalDate(now));
  };

  // Day page tasks: sorted strictly by manual order number
  const dayPageTasks = useMemo(() => {
    const targetCats = selectedCategory === 'all' ? null : selectedCategory;
    const dayTasks = tasks.filter((t) => {
      if (t.dueDate !== selectedDateStr) return false;
      if (targetCats && t.categoryId !== targetCats) return false;
      return true;
    });

    return [...dayTasks].sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
  }, [tasks, selectedDateStr, selectedCategory]);

  // Backlog tasks: tasks WITHOUT a date (unscheduled)
  const backlogTasks = useMemo(() => {
    const targetCats = selectedCategory === 'all' ? null : selectedCategory;
    const unscheduled = tasks.filter((t) => {
      if (t.dueDate) return false;
      if (targetCats && t.categoryId !== targetCats) return false;
      return true;
    });

    return [...unscheduled].sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
  }, [tasks, selectedCategory]);

  // Backlog grouped by category
  const backlogByCategory = useMemo(() => {
    const targetCategories =
      selectedCategory === 'all'
        ? categories
        : categories.filter((c) => c.id === selectedCategory);

    return targetCategories.map((cat) => ({
      category: cat,
      tasks: backlogTasks.filter((t) => t.categoryId === cat.id),
    }));
  }, [categories, backlogTasks, selectedCategory]);

  // All visible tasks in view for multi-select range
  const allVisibleTasks = useMemo(() => {
    return [...dayPageTasks, ...backlogTasks];
  }, [dayPageTasks, backlogTasks]);

  // Keyboard shortcut listeners (Cmd+A to select all, Esc to clear)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable)
      ) {
        return;
      }

      if (e.key === 'Escape') {
        setSelectedTaskIds(new Set());
        setSelectMode(false);
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        setSelectedTaskIds(new Set(allVisibleTasks.map((t) => t.id)));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [allVisibleTasks]);

  // Row selection handler
  const handleRowClick = (e: React.MouseEvent, taskId: string) => {
    const isCmdOrCtrl = e.metaKey || e.ctrlKey;
    const isShift = e.shiftKey;

    if (isShift && lastSelectedTaskId) {
      const ids = allVisibleTasks.map((t) => t.id);
      const startIdx = ids.indexOf(lastSelectedTaskId);
      const endIdx = ids.indexOf(taskId);
      if (startIdx !== -1 && endIdx !== -1) {
        const [low, high] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
        const rangeIds = ids.slice(low, high + 1);
        setSelectedTaskIds((prev) => {
          const next = new Set(prev);
          rangeIds.forEach((id) => next.add(id));
          return next;
        });
      }
    } else if (isCmdOrCtrl || selectMode) {
      setSelectedTaskIds((prev) => {
        const next = new Set(prev);
        if (next.has(taskId)) next.delete(taskId);
        else next.add(taskId);
        return next;
      });
      setLastSelectedTaskId(taskId);
    } else {
      setSelectedTaskIds(new Set([taskId]));
      setLastSelectedTaskId(taskId);
    }
  };

  // Drag and Drop (Reordering within day page, Backlog, or across)
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    const draggingIds = selectedTaskIds.has(task.id)
      ? Array.from(selectedTaskIds)
      : [task.id];

    e.dataTransfer.setData('text/plain', JSON.stringify({ taskIds: draggingIds, primaryId: task.id }));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(task.id);
  };

  const handleRowDragOver = (e: React.DragEvent, targetTask: Task) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const rect = e.currentTarget.getBoundingClientRect();
    const isTopHalf = e.clientY - rect.top < rect.height / 2;

    setDragOverTaskId(targetTask.id);
    setDropPosition(isTopHalf ? 'before' : 'after');
  };

  // Drop on another row (in Day page or Backlog category group)
  const handleRowDrop = async (e: React.DragEvent, targetTask: Task, containerTasks: Task[], targetDate?: string) => {
    e.preventDefault();
    e.stopPropagation();

    let taskIds: string[] = [];
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      taskIds = Array.isArray(data.taskIds) ? data.taskIds : [data.primaryId || draggedTaskId];
    } catch {
      taskIds = draggedTaskId ? [draggedTaskId] : [];
    }

    if (taskIds.length === 0 || taskIds.includes(targetTask.id)) {
      clearDragState();
      return;
    }

    const movingTasks = tasks.filter((t) => taskIds.includes(t.id));
    const remainingTasks = containerTasks.filter((t) => !taskIds.includes(t.id));

    const targetIndex = remainingTasks.findIndex((t) => t.id === targetTask.id);
    const insertIndex = dropPosition === 'after' ? targetIndex + 1 : targetIndex;

    const newOrderedGroup = [
      ...remainingTasks.slice(0, insertIndex),
      ...movingTasks,
      ...remainingTasks.slice(insertIndex),
    ];

    const updates = newOrderedGroup.map((t, index) => ({
      id: t.id,
      order: index,
      dueDate: targetDate !== undefined ? targetDate : t.dueDate,
      dueTime: targetDate === '' ? undefined : t.dueTime, // clearing date clears time
    }));

    await reorderTasks(updates, `Moved ${movingTasks.length} task${movingTasks.length > 1 ? 's' : ''}`);
    clearDragState();
  };

  // Drop onto Day Page panel (empty area)
  const handleDayPageDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    let taskIds: string[] = [];
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      taskIds = Array.isArray(data.taskIds) ? data.taskIds : [data.primaryId || draggedTaskId];
    } catch {
      taskIds = draggedTaskId ? [draggedTaskId] : [];
    }

    if (taskIds.length === 0) {
      clearDragState();
      return;
    }

    const maxOrder = dayPageTasks.reduce((max, t) => Math.max(max, t.order ?? 0), 0);
    const updates = taskIds.map((id, idx) => ({
      id,
      dueDate: selectedDateStr,
      order: maxOrder + idx + 1,
    }));

    await reorderTasks(updates, `Scheduled ${taskIds.length} tasks for ${selectedDateStr}`);
    clearDragState();
  };

  // Drop onto Backlog panel (empty area) -> clears date and time!
  const handleBacklogDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    let taskIds: string[] = [];
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      taskIds = Array.isArray(data.taskIds) ? data.taskIds : [data.primaryId || draggedTaskId];
    } catch {
      taskIds = draggedTaskId ? [draggedTaskId] : [];
    }

    if (taskIds.length === 0) {
      clearDragState();
      return;
    }

    const maxOrder = backlogTasks.reduce((max, t) => Math.max(max, t.order ?? 0), 0);
    const updates = taskIds.map((id, idx) => ({
      id,
      dueDate: '', // cleared -> unscheduled Backlog
      dueTime: '',
      order: maxOrder + idx + 1,
    }));

    await reorderTasks(updates, `Moved ${taskIds.length} tasks to Backlog`);
    clearDragState();
  };

  // Drop on week strip day -> assign date and append
  const handleWeekDayDrop = async (e: React.DragEvent, targetDateStr: string) => {
    e.preventDefault();
    let taskIds: string[] = [];
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      taskIds = Array.isArray(data.taskIds) ? data.taskIds : [data.primaryId || draggedTaskId];
    } catch {
      taskIds = draggedTaskId ? [draggedTaskId] : [];
    }

    if (taskIds.length === 0) {
      clearDragState();
      return;
    }

    const dayTasks = tasks.filter((t) => t.dueDate === targetDateStr);
    const maxOrder = dayTasks.reduce((max, t) => Math.max(max, t.order ?? 0), 0);

    const updates = taskIds.map((id, idx) => ({
      id,
      dueDate: targetDateStr,
      order: maxOrder + idx + 1,
    }));

    await reorderTasks(updates, `Moved ${taskIds.length} tasks to ${targetDateStr}`);
    setSelectedDateStr(targetDateStr);
    clearDragState();
  };

  const clearDragState = () => {
    setDraggedTaskId(null);
    setDragOverTaskId(null);
    setDropPosition(null);
    setDragOverDateStr(null);
    setIsBacklogDragOver(false);
    setIsDayPageDragOver(false);
  };

  const todayStr = formatLocalDate(new Date());

  return (
    <div className="space-y-4">
      {/* Week Strip Header Navigation */}
      <div className="apple-panel rounded-2xl p-3 sm:p-4 transition-all">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              {monthName} {year}
            </span>
            <button
              onClick={handleTodayClick}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/60 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-[#0A84FF] border border-black/5 dark:border-white/10 transition cursor-pointer"
            >
              Today
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevWeek}
              title="Previous week"
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextWeek}
              title="Next week"
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 7-Day Week Strip Buttons (Droppable) */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {weekDays.map((day) => {
            const isDragOver = dragOverDateStr === day.dateStr;
            const dayTaskCount = tasks.filter((t) => t.dueDate === day.dateStr && !t.completed).length;

            return (
              <div
                key={day.dateStr}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverDateStr(day.dateStr);
                }}
                onDragLeave={() => setDragOverDateStr(null)}
                onDrop={(e) => handleWeekDayDrop(e, day.dateStr)}
                onClick={() => setSelectedDateStr(day.dateStr)}
                className={`flex flex-col items-center py-2 px-1 rounded-xl transition-all cursor-pointer border select-none ${
                  day.isSelected
                    ? 'bg-[#0A84FF] text-white border-[#0A84FF] shadow-sm font-semibold'
                    : day.isToday
                    ? 'bg-white/80 dark:bg-white/15 text-[#0A84FF] border-[#0A84FF]/40 font-medium'
                    : 'bg-white/40 dark:bg-white/5 text-[var(--text-primary)] border-transparent hover:bg-white/80 dark:hover:bg-white/10'
                } ${isDragOver ? 'ring-2 ring-[#0A84FF] scale-102 bg-[#0A84FF]/20' : ''}`}
              >
                <span className={`text-[11px] ${day.isSelected ? 'text-white/90' : 'text-[var(--text-secondary)]'}`}>
                  {day.dayLabel}
                </span>
                <span className="text-base sm:text-lg font-bold leading-tight my-0.5">
                  {day.dayNumber}
                </span>
                {dayTaskCount > 0 && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                      day.isSelected ? 'bg-white text-[#0A84FF]' : 'bg-[#0A84FF]/10 text-[#0A84FF]'
                    }`}
                  >
                    {dayTaskCount}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main 2-Column Layout: Day Page (Left) & Backlog (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Day Page Column */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDayPageDragOver(true);
          }}
          onDragLeave={() => setIsDayPageDragOver(false)}
          onDrop={handleDayPageDrop}
          className={`lg:col-span-7 apple-panel rounded-2xl p-4 sm:p-5 flex flex-col transition-all min-h-[500px] ${
            isDayPageDragOver ? 'ring-2 ring-[#0A84FF] bg-[#0A84FF]/5' : ''
          }`}
        >
          {/* Day Page Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(60,60,67,0.12)] dark:border-[rgba(255,255,255,0.08)] mb-3">
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <span>{selectedDateStr === todayStr ? 'Today' : selectedDate.toLocaleDateString('default', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                <span className="text-xs font-normal text-[var(--text-secondary)]">
                  ({dayPageTasks.length} tasks)
                </span>
              </h3>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Select Mode Toggle */}
              <button
                onClick={() => {
                  setSelectMode(!selectMode);
                  if (selectMode) setSelectedTaskIds(new Set());
                }}
                className={`px-2.5 py-1 rounded-[8px] text-xs font-medium border transition cursor-pointer ${
                  selectMode || selectedTaskIds.size > 0
                    ? 'bg-[#0A84FF]/10 text-[#0A84FF] border-[#0A84FF]/30'
                    : 'bg-white/50 dark:bg-white/5 border-black/5 dark:border-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {selectMode ? `Selecting (${selectedTaskIds.size})` : 'Select'}
              </button>

              {/* Add Task Button (Creates task for shown day, NO time field) */}
              <button
                type="button"
                onClick={() => openTaskModal(null, undefined, undefined, undefined, selectedDateStr)}
                className="flex items-center gap-1 px-3 py-1 rounded-[8px] bg-[#0A84FF] hover:bg-[#0071E3] text-white text-xs font-medium transition cursor-pointer shadow-xs active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Task</span>
              </button>
            </div>
          </div>

          {/* Day Page Task List with Insertion Indicator Lines */}
          <div className="flex-1 space-y-1">
            {dayPageTasks.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-[var(--text-tertiary)] text-xs border border-dashed border-[rgba(60,60,67,0.15)] dark:border-white/10 rounded-xl">
                <CalendarDays className="w-8 h-8 mb-2 opacity-40 text-[#0A84FF]" />
                <p>No tasks scheduled for this day.</p>
                <p className="mt-1 text-[11px]">Click &ldquo;Add Task&rdquo; or drag items from the Backlog.</p>
              </div>
            ) : (
              <div className="border border-[rgba(60,60,67,0.08)] dark:border-white/5 rounded-xl divide-y divide-[rgba(60,60,67,0.08)] dark:divide-white/5 overflow-hidden">
                {dayPageTasks.map((task) => renderCalendarTaskRow(task, dayPageTasks, selectedDateStr))}
              </div>
            )}
          </div>
        </div>

        {/* Backlog Column (Unscheduled Tasks Grouped by Category) */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsBacklogDragOver(true);
          }}
          onDragLeave={() => setIsBacklogDragOver(false)}
          onDrop={handleBacklogDrop}
          className={`lg:col-span-5 apple-panel rounded-2xl p-4 sm:p-5 flex flex-col transition-all min-h-[500px] ${
            isBacklogDragOver ? 'ring-2 ring-[#0A84FF] bg-[#0A84FF]/5' : ''
          }`}
        >
          {/* Backlog Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(60,60,67,0.12)] dark:border-[rgba(255,255,255,0.08)] mb-3">
            <div className="flex items-center gap-2">
              <InboxIcon className="w-4 h-4 text-[#0A84FF]" />
              <h3 className="text-sm sm:text-base font-semibold text-[var(--text-primary)]">
                Backlog
              </h3>
              <span className="text-xs font-normal text-[var(--text-secondary)]">
                ({backlogTasks.length})
              </span>
            </div>

            {/* Backlog "+ New Item" creates unscheduled task (no date, no time) */}
            <button
              type="button"
              onClick={() => openTaskModal(null, undefined, undefined, undefined, '')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-[8px] bg-white/60 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-[#0A84FF] text-xs font-medium border border-black/5 dark:border-white/10 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New Item</span>
            </button>
          </div>

          {/* Backlog Categories Accordion */}
          <div className="flex-1 space-y-3 overflow-y-auto">
            {backlogByCategory.map(({ category, tasks: catBacklog }) => {
              const isCollapsed = Boolean(collapsedCategories[category.id]);

              return (
                <div key={category.id} className="space-y-1">
                  {/* Category Header */}
                  <div className="flex items-center justify-between py-1 px-1 text-xs text-[var(--text-secondary)] font-medium">
                    <button
                      type="button"
                      onClick={() => toggleCategoryCollapse(category.id)}
                      className="flex items-center gap-1.5 hover:text-[var(--text-primary)] transition cursor-pointer"
                    >
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isCollapsed ? '' : 'rotate-90'}`} />
                      <span style={{ color: category.color }}>
                        <CategoryIcon name={category.icon || category.type} size={13} />
                      </span>
                      <span className="font-semibold text-[var(--text-primary)]">{category.name}</span>
                      <span className="text-xs text-[var(--text-secondary)]">({catBacklog.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openTaskModal(null, category.id, undefined, undefined, '')}
                      title="Add unscheduled task to category"
                      className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[#0A84FF] cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Tasks in Category Backlog */}
                  {!isCollapsed && (
                    <div className="border border-[rgba(60,60,67,0.08)] dark:border-white/5 rounded-xl divide-y divide-[rgba(60,60,67,0.08)] dark:divide-white/5 overflow-hidden">
                      {catBacklog.length === 0 ? (
                        <div className="py-2 px-3 text-[11px] text-[var(--text-tertiary)] italic">
                          No unscheduled items.
                        </div>
                      ) : (
                        catBacklog.map((task) => renderCalendarTaskRow(task, catBacklog, ''))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Action Bar for Multi-Selected Tasks */}
      {selectedTaskIds.size >= 1 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl apple-panel shadow-2xl border border-white/60 dark:border-white/10 animate-slideUp backdrop-blur-xl">
          <span className="text-xs font-semibold text-[var(--text-primary)] px-1">
            {selectedTaskIds.size} selected
          </span>

          <div className="h-4 w-px bg-black/10 dark:bg-white/10 mx-1" />

          {/* Move to Day... */}
          <div className="relative">
            {showMoveDateInput ? (
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={bulkDateValue}
                  onChange={(e) => setBulkDateValue(e.target.value)}
                  className="px-2 py-1 text-xs rounded-lg bg-white dark:bg-black/30 border border-black/10 dark:border-white/10"
                />
                <button
                  onClick={() => {
                    if (bulkDateValue) {
                      bulkSetDate(Array.from(selectedTaskIds), bulkDateValue);
                    }
                    setShowMoveDateInput(false);
                    setBulkDateValue('');
                  }}
                  className="px-2 py-1 rounded-lg bg-[#0A84FF] text-white text-xs font-medium cursor-pointer"
                >
                  Move
                </button>
                <button
                  onClick={() => setShowMoveDateInput(false)}
                  className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowMoveDateInput(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-black/5 dark:bg-white/10 text-xs font-medium text-[var(--text-primary)] hover:bg-[#0A84FF] hover:text-white transition cursor-pointer"
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Move to day...</span>
              </button>
            )}
          </div>

          {/* Move to Backlog */}
          <button
            onClick={() => bulkClearDateTime(Array.from(selectedTaskIds), false)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-black/5 dark:bg-white/10 text-xs font-medium text-[var(--text-primary)] hover:bg-black/10 dark:hover:bg-white/20 transition cursor-pointer"
          >
            <span>Move to Backlog</span>
          </button>

          {/* Delete */}
          <button
            onClick={() => {
              const ids = Array.from(selectedTaskIds);
              bulkDeleteTasks(ids);
              setSelectedTaskIds(new Set());
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white text-xs font-medium transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>

          {/* Clear */}
          <button
            onClick={() => setSelectedTaskIds(new Set())}
            title="Clear selection (Esc)"
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );

  // Compact Row Renderer with drag handles, blue insertion line, multi-select
  function renderCalendarTaskRow(task: Task, siblingTasks: Task[], containerDateStr?: string) {
    const isSelected = selectedTaskIds.has(task.id);
    const isDragOver = dragOverTaskId === task.id;
    const cat = categories.find((c) => c.id === task.categoryId);

    return (
      <div
        key={task.id}
        draggable
        onDragStart={(e) => handleDragStart(e, task)}
        onDragOver={(e) => handleRowDragOver(e, task)}
        onDrop={(e) => handleRowDrop(e, task, siblingTasks, containerDateStr)}
        onDragEnd={clearDragState}
        onClick={(e) => handleRowClick(e, task.id)}
        className={`group relative flex items-center justify-between px-3 py-1.5 min-h-[34px] transition-colors cursor-pointer select-none ${
          isSelected
            ? 'bg-[#0A84FF]/12'
            : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
        } ${
          isDragOver && dropPosition === 'before'
            ? 'border-t-2 border-[#0A84FF]'
            : ''
        } ${
          isDragOver && dropPosition === 'after'
            ? 'border-b-2 border-[#0A84FF]'
            : ''
        }`}
      >
        {/* Left Side: Drag Handle, Checkbox, Title */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div
            title="Drag to reorder or move"
            className="cursor-grab active:cursor-grabbing text-[var(--text-tertiary)] hover:text-[var(--text-primary)] opacity-0 group-hover:opacity-100 transition"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleTaskCompletion(task.id);
            }}
            className={`w-[18px] h-[18px] rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
              task.completed
                ? 'bg-[#0A84FF] text-white border border-[#0A84FF]'
                : 'border-[1.5px] border-[rgba(60,60,67,0.35)] dark:border-[rgba(255,255,255,0.45)] hover:border-[#0A84FF]'
            }`}
          >
            {task.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
          </button>

          <div className="min-w-0 flex-1">
            <span
              className={`text-[13px] leading-tight block truncate ${
                task.completed
                  ? 'line-through text-[var(--text-secondary)]'
                  : 'text-[var(--text-primary)] font-normal'
              }`}
            >
              {task.title}
            </span>
            {task.description && (
              <span className="text-[11px] text-[var(--text-tertiary)] block truncate">
                {task.description}
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Category Chip, Optional Time (small grey), Duration, Hover Actions */}
        <div className="flex items-center gap-2 shrink-0 ml-3">
          {cat && (
            <span
              className="text-[11px] px-1.5 py-0.5 rounded-md font-medium flex items-center gap-1"
              style={{
                backgroundColor: `${cat.color}15`,
                color: cat.color,
              }}
            >
              <CategoryIcon name={cat.icon || cat.type} size={11} />
              <span className="hidden sm:inline">{cat.name}</span>
            </span>
          )}

          {/* Optional Time Label (only if set, small grey) */}
          {task.dueTime && (
            <span className="text-[11px] text-[var(--text-secondary)] flex items-center gap-0.5 font-normal">
              <Clock className="w-3 h-3 stroke-current" />
              <span>{task.dueTime}</span>
            </span>
          )}

          {/* Optional Duration */}
          {task.duration !== undefined && task.duration > 0 && (
            <span className="text-[10px] text-[var(--text-tertiary)]">
              {task.duration}m
            </span>
          )}

          {/* Quick Hover Actions */}
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                duplicateTask(task.id);
              }}
              title="Duplicate"
              className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
            >
              <Copy className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openTaskModal(task);
              }}
              title="Edit"
              className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[#0A84FF] hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
            >
              <Edit2 className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                deleteTask(task.id);
              }}
              title="Delete"
              className="p-1 rounded-md text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }
};
