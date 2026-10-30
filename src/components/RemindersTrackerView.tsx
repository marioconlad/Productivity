import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Check,
  Calendar,
  Clock,
  Bell,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronRight,
  Plus,
  GripVertical,
  CheckCircle2,
  X,
  Target,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FolderInput,
  CheckSquare,
  Square,
  MinusSquare,
  Copy,
  Layers,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Task, Category } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { QuickInputBar } from './QuickInputBar';
import { MentalCheckInSection } from './MentalCheckInSection';
import { formatLocalDate } from '../lib/streak';

export type SortField = 'manual' | 'title' | 'date' | 'date_added' | 'completed';
export type SortDirection = 'asc' | 'desc';

export const RemindersTrackerView: React.FC = () => {
  const {
    tasks,
    categories,
    selectedCategory,
    setSelectedCategory,
    toggleTaskCompletion,
    updateTask,
    deleteTask,
    duplicateTask,
    openTaskModal,
    openCategoryModal,
    reorderTasks,
    bulkUpdateTasks,
    bulkDeleteTasks,
    bulkSetDate,
    bulkClearDateTime,
    saveCurrentOrderAsManual,
  } = useApp();

  const [showCompleted, setShowCompleted] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [lastSelectedTaskId, setLastSelectedTaskId] = useState<string | null>(null);

  // Group by (Category vs Date)
  const [groupBy, setGroupBy] = useState<'category' | 'date'>(() => {
    try {
      return (
        (localStorage.getItem('focusflow_reminders_groupBy') as 'category' | 'date') ||
        'category'
      );
    } catch {
      return 'category';
    }
  });

  const handleGroupByChange = (mode: 'category' | 'date') => {
    setGroupBy(mode);
    try {
      localStorage.setItem('focusflow_reminders_groupBy', mode);
    } catch (e) {
      console.warn(e);
    }
  };

  // Sort State
  const [sortField, setSortField] = useState<SortField>(() => {
    try {
      return (localStorage.getItem('focusflow_reminders_sort_field') as SortField) || 'manual';
    } catch {
      return 'manual';
    }
  });

  const [sortDirection, setSortDirection] = useState<SortDirection>(() => {
    try {
      return (localStorage.getItem('focusflow_reminders_sort_direction') as SortDirection) || 'asc';
    } catch {
      return 'asc';
    }
  });

  const [showSortMenu, setShowSortMenu] = useState(false);

  const handleSortFieldChange = (field: SortField) => {
    setSortField(field);
    try {
      localStorage.setItem('focusflow_reminders_sort_field', field);
    } catch (e) {
      console.warn(e);
    }
    setShowSortMenu(false);
  };

  const toggleSortDirection = () => {
    const nextDir = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(nextDir);
    try {
      localStorage.setItem('focusflow_reminders_sort_direction', nextDir);
    } catch (e) {
      console.warn(e);
    }
  };

  // Floating Bulk Move To Date / Category Pickers
  const [showMoveDateInput, setShowMoveDateInput] = useState(false);
  const [bulkDateValue, setBulkDateValue] = useState('');
  const [showMoveCategorySelect, setShowMoveCategorySelect] = useState(false);

  // Collapsible categories state in Reminders
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('focusflow_reminders_collapsed_categories');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleCategoryCollapse = (catId: string) => {
    setCollapsedCategories((prev) => {
      const updated = { ...prev, [catId]: !prev[catId] };
      try {
        localStorage.setItem('focusflow_reminders_collapsed_categories', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save collapsed category state', e);
      }
      return updated;
    });
  };

  // Collapsible dates state
  const [collapsedDates, setCollapsedDates] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('focusflow_reminders_collapsed_dates');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleDateCollapse = (dateKey: string) => {
    setCollapsedDates((prev) => {
      const updated = { ...prev, [dateKey]: !prev[dateKey] };
      try {
        localStorage.setItem('focusflow_reminders_collapsed_dates', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save collapsed date state', e);
      }
      return updated;
    });
  };

  // Drag-and-drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);

  // Filter tasks based on category selection
  const filteredTasks = useMemo(() => {
    if (selectedCategory === 'all') return tasks;
    return tasks.filter((t) => t.categoryId === selectedCategory);
  }, [tasks, selectedCategory]);

  // Sorting helper inside groups
  const sortTasks = (taskList: Task[]): Task[] => {
    if (sortField === 'manual') {
      return [...taskList].sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
        if (a.order !== undefined) return -1;
        if (b.order !== undefined) return 1;
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      });
    }

    const sorted = [...taskList].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'title':
          cmp = a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' });
          break;
        case 'date':
          // undated tasks always last
          if (!a.dueDate && !b.dueDate) cmp = 0;
          else if (!a.dueDate) return 1;
          else if (!b.dueDate) return -1;
          else {
            cmp = a.dueDate.localeCompare(b.dueDate);
            if (cmp === 0 && a.dueTime && b.dueTime) {
              cmp = a.dueTime.localeCompare(b.dueTime);
            }
          }
          break;
        case 'date_added':
          cmp = (a.createdAt || '').localeCompare(b.createdAt || '');
          break;
        case 'completed':
          // open tasks first
          cmp = (a.completed ? 1 : 0) - (b.completed ? 1 : 0);
          break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return sorted;
  };

  const activeTasks = useMemo(() => {
    return filteredTasks.filter((t) => !t.completed);
  }, [filteredTasks]);

  const completedTasks = useMemo(() => {
    return filteredTasks.filter((t) => t.completed);
  }, [filteredTasks]);

  const todayStr = formatLocalDate(new Date());

  // Count done today (completed tasks with completedAt or dueDate matching today)
  const doneTodayCount = useMemo(() => {
    return tasks.filter((t) => {
      if (!t.completed) return false;
      const cDate = t.completedAt ? t.completedAt.split('T')[0] : t.dueDate;
      return cDate === todayStr;
    }).length;
  }, [tasks, todayStr]);

  // Group active tasks automatically by category
  const activeTasksByCategory = useMemo(() => {
    const targetCategories =
      selectedCategory === 'all'
        ? categories
        : categories.filter((c) => c.id === selectedCategory);

    const groups: {
      category: Category;
      tasks: Task[];
    }[] = [];

    targetCategories.forEach((cat) => {
      const catTasks = activeTasks.filter((t) => t.categoryId === cat.id);
      if (catTasks.length > 0 || selectedCategory === cat.id) {
        groups.push({
          category: cat,
          tasks: sortTasks(catTasks),
        });
      }
    });

    const knownCatIds = new Set(categories.map((c) => c.id));
    const uncategorizedTasks = activeTasks.filter(
      (t) => !t.categoryId || !knownCatIds.has(t.categoryId)
    );
    if (uncategorizedTasks.length > 0 && selectedCategory === 'all') {
      groups.push({
        category: {
          id: 'uncategorized',
          userId: 'local',
          name: 'General',
          type: 'custom',
          color: '#6B7280',
          icon: 'Folder',
          createdAt: new Date().toISOString(),
        },
        tasks: sortTasks(uncategorizedTasks),
      });
    }

    return groups;
  }, [categories, activeTasks, selectedCategory, sortField, sortDirection]);

  // Group completed tasks automatically by category
  const completedTasksByCategory = useMemo(() => {
    const targetCategories =
      selectedCategory === 'all'
        ? categories
        : categories.filter((c) => c.id === selectedCategory);

    const groups: {
      category: Category;
      tasks: Task[];
    }[] = [];

    targetCategories.forEach((cat) => {
      const catTasks = completedTasks.filter((t) => t.categoryId === cat.id);
      if (catTasks.length > 0) {
        groups.push({
          category: cat,
          tasks: sortTasks(catTasks),
        });
      }
    });

    return groups;
  }, [categories, completedTasks, selectedCategory, sortField, sortDirection]);

  // Group active tasks by Date
  const activeTasksByDate = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = formatLocalDate(tomorrow);

    const dateMap = new Map<string, Task[]>();
    const unscheduledTasks: Task[] = [];

    activeTasks.forEach((t) => {
      if (t.dueDate) {
        const list = dateMap.get(t.dueDate) || [];
        list.push(t);
        dateMap.set(t.dueDate, list);
      } else {
        unscheduledTasks.push(t);
      }
    });

    const sortedDates = Array.from(dateMap.keys()).sort();
    const groups: {
      dateStr: string;
      header: string;
      isToday: boolean;
      isTomorrow: boolean;
      tasks: Task[];
    }[] = [];

    sortedDates.forEach((dStr) => {
      let header = dStr;
      let isToday = false;
      let isTomorrow = false;

      if (dStr === todayStr) {
        header = 'Today';
        isToday = true;
      } else if (dStr === tomorrowStr) {
        header = 'Tomorrow';
        isTomorrow = true;
      } else {
        const [y, m, d] = dStr.split('-').map(Number);
        const obj = new Date(y, m - 1, d);
        header = obj.toLocaleDateString('default', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });
      }

      groups.push({
        dateStr: dStr,
        header,
        isToday,
        isTomorrow,
        tasks: sortTasks(dateMap.get(dStr) || []),
      });
    });

    if (unscheduledTasks.length > 0) {
      groups.push({
        dateStr: 'no-date',
        header: 'Backlog (No Date)',
        isToday: false,
        isTomorrow: false,
        tasks: sortTasks(unscheduledTasks),
      });
    }

    return groups;
  }, [activeTasks, todayStr, sortField, sortDirection]);

  // Flattened visible tasks for multi-select range calculation
  const allVisibleTasks = useMemo(() => {
    const list: Task[] = [];
    if (groupBy === 'category') {
      activeTasksByCategory.forEach((g) => list.push(...g.tasks));
      if (showCompleted) {
        completedTasksByCategory.forEach((g) => list.push(...g.tasks));
      }
    } else {
      activeTasksByDate.forEach((g) => list.push(...g.tasks));
    }
    return list;
  }, [groupBy, activeTasksByCategory, completedTasksByCategory, activeTasksByDate, showCompleted]);

  // Multi-select keyboard listeners (Cmd+A to select all, Esc to clear)
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

  // Row selection handler (click, shift+click, cmd+click)
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
      // Single click selects only this row
      setSelectedTaskIds(new Set([taskId]));
      setLastSelectedTaskId(taskId);
    }
  };

  // Group Header select-all / toggle
  const handleGroupSelectAll = (groupTasks: Task[]) => {
    const groupIds = groupTasks.map((t) => t.id);
    const allSelected = groupIds.every((id) => selectedTaskIds.has(id));

    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        groupIds.forEach((id) => next.delete(id));
      } else {
        groupIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const getGroupSelectState = (groupTasks: Task[]): 'all' | 'some' | 'none' => {
    if (groupTasks.length === 0) return 'none';
    const groupIds = groupTasks.map((t) => t.id);
    const count = groupIds.filter((id) => selectedTaskIds.has(id)).length;
    if (count === groupIds.length) return 'all';
    if (count > 0) return 'some';
    return 'none';
  };

  // Drag & drop within group
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    if (sortField !== 'manual') return;

    // If task is in multi-selection, drag all selected tasks; otherwise drag just this one
    const draggingIds = selectedTaskIds.has(task.id)
      ? Array.from(selectedTaskIds)
      : [task.id];

    e.dataTransfer.setData('text/plain', JSON.stringify({ taskIds: draggingIds, primaryId: task.id }));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(task.id);
  };

  const handleDragOver = (e: React.DragEvent, targetTask: Task) => {
    if (sortField !== 'manual') return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const isTopHalf = offsetY < rect.height / 2;

    setDragOverTaskId(targetTask.id);
    setDropPosition(isTopHalf ? 'before' : 'after');
  };

  const handleDrop = async (e: React.DragEvent, targetTask: Task, groupTasks: Task[]) => {
    if (sortField !== 'manual') return;
    e.preventDefault();

    let taskIds: string[] = [];
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      taskIds = Array.isArray(data.taskIds) ? data.taskIds : [data.primaryId || draggedTaskId];
    } catch {
      taskIds = draggedTaskId ? [draggedTaskId] : [];
    }

    if (taskIds.length === 0 || taskIds.includes(targetTask.id)) {
      setDraggedTaskId(null);
      setDragOverTaskId(null);
      setDropPosition(null);
      return;
    }

    // Reorder inside this group
    const movingTasks = tasks.filter((t) => taskIds.includes(t.id));
    const remainingTasks = groupTasks.filter((t) => !taskIds.includes(t.id));

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
    }));

    await reorderTasks(updates, `Reordered ${movingTasks.length} task${movingTasks.length > 1 ? 's' : ''}`);

    setDraggedTaskId(null);
    setDragOverTaskId(null);
    setDropPosition(null);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverTaskId(null);
    setDropPosition(null);
  };

  // Save current order as manual
  const handleSaveAsManual = async () => {
    await saveCurrentOrderAsManual(allVisibleTasks, 'Saved current order as manual');
    setSortField('manual');
    setShowSortMenu(false);
  };

  return (
    <div className="space-y-4">
      {/* Quick Input Bar */}
      <QuickInputBar defaultCategoryId={selectedCategory !== 'all' ? selectedCategory : undefined} />

      {/* CBT Mental Wellbeing Check-in Section (Kept intact) */}
      <MentalCheckInSection />

      {/* Main Reminders Panel */}
      <div className="apple-panel rounded-2xl p-4 sm:p-5 transition-all">
        
        {/* Top Controls: Title, Done Today, Group By, Sort Control, Select */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[rgba(60,60,67,0.12)] dark:border-[rgba(255,255,255,0.08)]">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              {selectedCategory === 'all'
                ? 'All Reminders'
                : categories.find((c) => c.id === selectedCategory)?.name || 'Reminders'}
            </h2>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[var(--text-secondary)]">
              {activeTasks.length} open
            </span>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {doneTodayCount} done today
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Active Sort Pill with 'x' */}
            {sortField !== 'manual' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-[8px] bg-[rgba(10,132,255,0.12)] text-[#0A84FF] text-xs font-medium">
                <span>Sorted by {sortField.replace('_', ' ')}</span>
                <button
                  onClick={() => setSortField('manual')}
                  title="Return to Manual sort"
                  className="hover:bg-[#0A84FF]/20 rounded-full p-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3 stroke-current" />
                </button>
              </span>
            )}

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSortMenu(!showSortMenu)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] text-xs font-medium border transition cursor-pointer ${
                  sortField !== 'manual'
                    ? 'bg-[#0A84FF] text-white border-transparent'
                    : 'bg-white/50 dark:bg-white/5 border-black/5 dark:border-white/10 text-[var(--text-primary)] hover:bg-white/80 dark:hover:bg-white/10'
                }`}
              >
                <ArrowUpDown className="w-3.5 h-3.5 stroke-current" />
                <span className="capitalize">{sortField === 'manual' ? 'Sort' : sortField.replace('_', ' ')}</span>
              </button>

              {showSortMenu && (
                <div className="absolute right-0 mt-1.5 w-56 rounded-xl apple-panel p-1.5 shadow-xl border border-[rgba(60,60,67,0.12)] dark:border-white/10 z-30 animate-fadeIn">
                  <div className="px-2 py-1 text-[10px] uppercase font-bold text-[var(--text-tertiary)] tracking-wider">
                    Sort by
                  </div>
                  {(['manual', 'title', 'date', 'date_added', 'completed'] as SortField[]).map((field) => (
                    <button
                      key={field}
                      onClick={() => handleSortFieldChange(field)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                        sortField === field
                          ? 'bg-[#0A84FF]/10 text-[#0A84FF]'
                          : 'text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10'
                      }`}
                    >
                      <span className="capitalize">{field === 'manual' ? 'Manual (Custom drag)' : field.replace('_', ' ')}</span>
                      {sortField === field && <Check className="w-3.5 h-3.5 text-[#0A84FF]" />}
                    </button>
                  ))}

                  {sortField !== 'manual' && (
                    <div className="pt-1 mt-1 border-t border-[rgba(60,60,67,0.08)] dark:border-white/10 space-y-1">
                      <button
                        onClick={toggleSortDirection}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer flex items-center justify-between"
                      >
                        <span>Direction: {sortDirection.toUpperCase()}</span>
                        {sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={handleSaveAsManual}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#0A84FF] hover:bg-[#0A84FF]/10 transition cursor-pointer"
                      >
                        Save current order as manual
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Group By Selector */}
            <div className="flex items-center apple-segmented-pill p-0.5 rounded-lg text-xs font-medium">
              <button
                onClick={() => handleGroupByChange('category')}
                className={`px-2.5 py-1 rounded-[6px] transition cursor-pointer ${
                  groupBy === 'category'
                    ? 'bg-white dark:bg-[#3A3A3C] text-[#0A84FF] shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Category
              </button>
              <button
                onClick={() => handleGroupByChange('date')}
                className={`px-2.5 py-1 rounded-[6px] transition cursor-pointer ${
                  groupBy === 'date'
                    ? 'bg-white dark:bg-[#3A3A3C] text-[#0A84FF] shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Date
              </button>
            </div>

            {/* Multi-Select Mode Toggle */}
            <button
              onClick={() => {
                setSelectMode(!selectMode);
                if (selectMode) setSelectedTaskIds(new Set());
              }}
              className={`px-2.5 py-1.5 rounded-[10px] text-xs font-medium border transition cursor-pointer ${
                selectMode || selectedTaskIds.size > 0
                  ? 'bg-[#0A84FF]/10 text-[#0A84FF] border-[#0A84FF]/30'
                  : 'bg-white/50 dark:bg-white/5 border-black/5 dark:border-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {selectMode || selectedTaskIds.size > 0 ? `Select (${selectedTaskIds.size})` : 'Select'}
            </button>

            {/* Show Completed Toggle */}
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className={`px-2.5 py-1.5 rounded-[10px] text-xs font-medium border transition cursor-pointer ${
                showCompleted
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-white/50 dark:bg-white/5 border-black/5 dark:border-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Done ({completedTasks.length})
            </button>
          </div>
        </div>

        {/* Task Lists Grouped */}
        <div className="space-y-4 pt-2">
          {groupBy === 'category' ? (
            activeTasksByCategory.map((group) => {
              const isCollapsed = Boolean(collapsedCategories[group.category.id]);
              const selectState = getGroupSelectState(group.tasks);

              return (
                <div key={group.category.id} className="space-y-1">
                  {/* Group Header with Indeterminate Select-All */}
                  <div className="flex items-center justify-between py-1 px-1.5 text-xs text-[var(--text-secondary)] font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleCategoryCollapse(group.category.id)}
                        className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
                      >
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isCollapsed ? '' : 'rotate-90'}`} />
                      </button>

                      {(selectMode || selectedTaskIds.size > 0) && (
                        <button
                          type="button"
                          onClick={() => handleGroupSelectAll(group.tasks)}
                          className="text-[var(--text-secondary)] hover:text-[#0A84FF] cursor-pointer"
                        >
                          {selectState === 'all' && <CheckSquare className="w-4 h-4 text-[#0A84FF]" />}
                          {selectState === 'some' && <MinusSquare className="w-4 h-4 text-[#0A84FF]" />}
                          {selectState === 'none' && <Square className="w-4 h-4" />}
                        </button>
                      )}

                      <div className="flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
                        <span style={{ color: group.category.color }}>
                          <CategoryIcon name={group.category.icon || group.category.type} size={14} />
                        </span>
                        <span>{group.category.name}</span>
                        <span className="text-xs font-normal text-[var(--text-secondary)]">({group.tasks.length})</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openTaskModal(null, group.category.id)}
                      className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[#0A84FF] hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
                      title="Add task in category"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Tasks in Category */}
                  {!isCollapsed && (
                    <div className="border border-[rgba(60,60,67,0.08)] dark:border-white/5 rounded-xl divide-y divide-[rgba(60,60,67,0.08)] dark:divide-white/5 overflow-hidden">
                      {group.tasks.length === 0 ? (
                        <div className="py-2.5 px-3 text-xs text-[var(--text-tertiary)] italic">
                          No open tasks in {group.category.name}. Click + to add one.
                        </div>
                      ) : (
                        group.tasks.map((task) => renderTaskRow(task, group.tasks))
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            // Group By Date
            activeTasksByDate.map((group) => {
              const isCollapsed = Boolean(collapsedDates[group.dateStr]);
              const selectState = getGroupSelectState(group.tasks);

              return (
                <div key={group.dateStr} className="space-y-1">
                  <div className="flex items-center justify-between py-1 px-1.5 text-xs text-[var(--text-secondary)] font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleDateCollapse(group.dateStr)}
                        className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
                      >
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isCollapsed ? '' : 'rotate-90'}`} />
                      </button>

                      {(selectMode || selectedTaskIds.size > 0) && (
                        <button
                          type="button"
                          onClick={() => handleGroupSelectAll(group.tasks)}
                          className="text-[var(--text-secondary)] hover:text-[#0A84FF] cursor-pointer"
                        >
                          {selectState === 'all' && <CheckSquare className="w-4 h-4 text-[#0A84FF]" />}
                          {selectState === 'some' && <MinusSquare className="w-4 h-4 text-[#0A84FF]" />}
                          {selectState === 'none' && <Square className="w-4 h-4" />}
                        </button>
                      )}

                      <span className={`font-semibold ${group.isToday ? 'text-[#0A84FF]' : 'text-[var(--text-primary)]'}`}>
                        {group.header} ({group.tasks.length})
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => openTaskModal(null, undefined, undefined, undefined, group.dateStr !== 'no-date' ? group.dateStr : undefined)}
                      className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[#0A84FF] hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {!isCollapsed && (
                    <div className="border border-[rgba(60,60,67,0.08)] dark:border-white/5 rounded-xl divide-y divide-[rgba(60,60,67,0.08)] dark:divide-white/5 overflow-hidden">
                      {group.tasks.map((task) => renderTaskRow(task, group.tasks))}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Completed Tasks Accordion */}
          {showCompleted && completedTasks.length > 0 && (
            <div className="pt-4 space-y-2 border-t border-[rgba(60,60,67,0.12)] dark:border-white/10">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400 px-1">
                <span>Completed Tasks ({completedTasks.length})</span>
              </div>
              <div className="border border-[rgba(60,60,67,0.08)] dark:border-white/5 rounded-xl divide-y divide-[rgba(60,60,67,0.08)] dark:divide-white/5 overflow-hidden">
                {completedTasks.map((task) => renderTaskRow(task, completedTasks))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Bar for Multi-Selected Tasks */}
      {selectedTaskIds.size >= 1 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl apple-panel shadow-2xl border border-white/60 dark:border-white/10 animate-slideUp backdrop-blur-xl">
          <span className="text-xs font-semibold text-[var(--text-primary)] px-1">
            {selectedTaskIds.size} selected
          </span>

          <div className="h-4 w-px bg-black/10 dark:bg-white/10 mx-1" />

          {/* Toggle Complete */}
          <button
            onClick={() => {
              const ids = Array.from(selectedTaskIds);
              const anyOpen = ids.some((id) => !tasks.find((t) => t.id === id)?.completed);
              bulkUpdateTasks(ids, { completed: anyOpen, status: anyOpen ? 'completed' : 'todo' }, `${anyOpen ? 'Completed' : 'Reopened'} ${ids.length} tasks`);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-black/5 dark:bg-white/10 text-xs font-medium text-[var(--text-primary)] hover:bg-[#0A84FF] hover:text-white transition cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Complete/Open</span>
          </button>

          {/* Set Date */}
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
                  className="px-2 py-1 rounded-lg bg-[#0A84FF] text-white text-xs font-medium"
                >
                  Set
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
                <Calendar className="w-3.5 h-3.5" />
                <span>Set Date</span>
              </button>
            )}
          </div>

          {/* Move to Backlog (Clear Date & Time) */}
          <button
            onClick={() => bulkClearDateTime(Array.from(selectedTaskIds), false)}
            title="Move to Calendar Backlog by clearing date"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-black/5 dark:bg-white/10 text-xs font-medium text-[var(--text-primary)] hover:bg-black/10 dark:hover:bg-white/20 transition cursor-pointer"
          >
            <span>To Backlog</span>
          </button>

          {/* Move to Category */}
          <div className="relative">
            {showMoveCategorySelect ? (
              <div className="flex items-center gap-1">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      bulkUpdateTasks(Array.from(selectedTaskIds), { categoryId: e.target.value }, `Moved ${selectedTaskIds.size} tasks to category`);
                      setShowMoveCategorySelect(false);
                    }
                  }}
                  className="px-2 py-1 text-xs rounded-lg bg-white dark:bg-[#2C2C2E] border border-black/10 dark:border-white/10 text-[var(--text-primary)]"
                >
                  <option value="">Select category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setShowMoveCategorySelect(false)}
                  className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowMoveCategorySelect(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-black/5 dark:bg-white/10 text-xs font-medium text-[var(--text-primary)] hover:bg-[#0A84FF] hover:text-white transition cursor-pointer"
              >
                <FolderInput className="w-3.5 h-3.5" />
                <span>Category</span>
              </button>
            )}
          </div>

          {/* Delete with Undo Toast */}
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

          {/* Clear Selection */}
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

  // Helper to render compact 32-36px row with insertion indicator line
  function renderTaskRow(task: Task, siblingTasks: Task[]) {
    const isSelected = selectedTaskIds.has(task.id);
    const isDragOver = dragOverTaskId === task.id;
    const cat = categories.find((c) => c.id === task.categoryId);

    return (
      <div
        key={task.id}
        draggable={sortField === 'manual'}
        onDragStart={(e) => handleDragStart(e, task)}
        onDragOver={(e) => handleDragOver(e, task)}
        onDrop={(e) => handleDrop(e, task, siblingTasks)}
        onDragEnd={handleDragEnd}
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
        {/* Left Side: Drag Handle, Checkbox, Title, Details */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Drag Handle (visible on hover, disabled when sorted) */}
          <div
            title={sortField === 'manual' ? 'Drag to reorder' : 'Switch to Manual to reorder'}
            className={`cursor-grab active:cursor-grabbing text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition ${
              sortField === 'manual' ? 'opacity-0 group-hover:opacity-100' : 'opacity-20 cursor-not-allowed'
            }`}
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>

          {/* 18px Round Apple Checkbox */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleTaskCompletion(task.id);
            }}
            aria-label={task.completed ? 'Mark open' : 'Mark complete'}
            className={`w-[18px] h-[18px] rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
              task.completed
                ? 'bg-[#0A84FF] text-white border border-[#0A84FF]'
                : 'border-[1.5px] border-[rgba(60,60,67,0.35)] dark:border-[rgba(255,255,255,0.45)] hover:border-[#0A84FF]'
            }`}
          >
            {task.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
          </button>

          {/* Title & Optional Description */}
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

        {/* Right Side: Optional Category Tag, Optional Date & Time (small grey), Duration, Actions */}
        <div className="flex items-center gap-2 shrink-0 ml-3">
          {/* Category Chip (if All category view) */}
          {selectedCategory === 'all' && cat && (
            <span
              className="hidden sm:inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-md font-medium"
              style={{
                backgroundColor: `${cat.color}15`,
                color: cat.color,
              }}
            >
              <CategoryIcon name={cat.icon || cat.type} size={11} />
              <span>{cat.name}</span>
            </span>
          )}

          {/* Optional Date Label (only if set) */}
          {task.dueDate && (
            <span
              className={`text-[11px] flex items-center gap-1 ${
                task.dueDate === todayStr
                  ? 'text-[#0A84FF] font-medium'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              <Calendar className="w-3 h-3 stroke-current" />
              <span>{task.dueDate === todayStr ? 'Today' : task.dueDate}</span>
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

          {/* Hover Actions: Duplicate, Edit, Delete */}
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
