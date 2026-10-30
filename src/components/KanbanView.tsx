import React, { useState, useMemo } from 'react';
import {
  Plus,
  ArrowRight,
  ArrowLeft,
  Flame,
  Calendar,
  CheckCircle2,
  CircleDot,
  Clock,
  Edit2,
  Trash2,
  GripVertical,
  Move,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Task, TaskStatus } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { sounds } from '../lib/audio';
import { isTaskScheduledForDate, formatLocalDateStr } from '../lib/habitSchedule';

export const KanbanView: React.FC = () => {
  const {
    tasks,
    categories,
    selectedCategory,
    updateTask,
    reorderTasks,
    openTaskModal,
    deleteTask,
    toggleTaskCompletion,
  } = useApp();

  // Tab State: "Today" vs "All Tasks" (all other tasks not scheduled for today)
  const [boardTab, setBoardTab] = useState<'today' | 'all'>('today');

  // Drag and Drop States
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<TaskStatus | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);

  const todayStr = useMemo(() => formatLocalDateStr(new Date()), []);

  const filteredTasks = useMemo(() => {
    if (selectedCategory === 'all') return tasks;
    return tasks.filter((t) => t.categoryId === selectedCategory);
  }, [tasks, selectedCategory]);

  const todayTasks = useMemo(() => {
    return filteredTasks.filter((t) => t.dueDate === todayStr);
  }, [filteredTasks, todayStr]);

  const otherTasks = useMemo(() => {
    return filteredTasks.filter((t) => t.dueDate !== todayStr);
  }, [filteredTasks, todayStr]);

  const activeBoardTasks = boardTab === 'today' ? todayTasks : otherTasks;

  const columns: {
    id: TaskStatus;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    badgeColor: string;
    glowBorder: string;
  }[] = [
    {
      id: 'todo',
      title: 'To Do',
      subtitle: 'Upcoming & Backlog',
      icon: <Clock className="w-4 h-4 text-zinc-400" />,
      badgeColor: 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300',
      glowBorder: 'border-zinc-300 dark:border-zinc-700',
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      subtitle: 'Active Habits & Goals',
      icon: <CircleDot className="w-4 h-4 text-amber-500 animate-pulse" />,
      badgeColor: 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300',
      glowBorder: 'border-amber-400 dark:border-amber-600',
    },
    {
      id: 'completed',
      title: 'Completed',
      subtitle: 'Achieved & Checked Off',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
      badgeColor: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
      glowBorder: 'border-emerald-400 dark:border-emerald-600',
    },
  ];

  // Helper to sort tasks within a column by order for the active tab
  const getSortedColTasks = (colId: TaskStatus) => {
    return activeBoardTasks
      .filter((t) => t.status === colId)
      .sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        if (a.order !== undefined) return -1;
        if (b.order !== undefined) return 1;
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      });
  };

  const getCategory = (catId: string) => categories.find((c) => c.id === catId);

  // 1. Drag Start
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTaskId(task.id);
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  // 2. Drag End Cleanup
  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverColId(null);
    setDragOverTaskId(null);
    setDropPosition(null);
  };

  // 3. Card Hover (Up/Down inside column or cross-column card hover)
  const handleCardDragOver = (e: React.DragEvent, targetTask: Task, targetColId: TaskStatus) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    setDragOverColId(targetColId);

    if (draggedTaskId === targetTask.id) {
      setDragOverTaskId(null);
      setDropPosition(null);
      return;
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const middleY = rect.top + rect.height / 2;
    const pos = e.clientY < middleY ? 'before' : 'after';

    setDragOverTaskId(targetTask.id);
    setDropPosition(pos);
  };

  // 4. Column Hover
  const handleColumnDragOver = (e: React.DragEvent, colId: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColId !== colId) {
      setDragOverColId(colId);
    }
  };

  const handleColumnDragLeave = (e: React.DragEvent, colId: TaskStatus) => {
    // Only clear if leaving the column boundary completely
    const related = e.relatedTarget as Node | null;
    if (!related || !(e.currentTarget as Node).contains(related)) {
      if (dragOverColId === colId) {
        setDragOverColId(null);
      }
    }
  };

  // 5. Drop Directly On a Card (Up / Down Reordering)
  const handleDropOnCard = (e: React.DragEvent, targetTask: Task, targetColId: TaskStatus) => {
    e.preventDefault();
    e.stopPropagation();

    const sourceTaskId = draggedTaskId || e.dataTransfer.getData('text/plain');
    if (!sourceTaskId) return;

    const sourceTask = tasks.find((t) => t.id === sourceTaskId);
    if (!sourceTask) return;

    const currentSortedColTasks = getSortedColTasks(targetColId).filter((t) => t.id !== sourceTaskId);
    const targetIdx = currentSortedColTasks.findIndex((t) => t.id === targetTask.id);
    const insertIdx = dropPosition === 'after' ? targetIdx + 1 : Math.max(0, targetIdx);

    const isCompleted = targetColId === 'completed';
    const nowStr = new Date().toISOString().split('T')[0];

    const updatedSourceTask: Task = {
      ...sourceTask,
      status: targetColId,
      completed: isCompleted,
      completedAt: isCompleted ? (sourceTask.completedAt || nowStr) : undefined,
    };

    const newColTasks = [...currentSortedColTasks];
    newColTasks.splice(insertIdx, 0, updatedSourceTask);

    const updates = newColTasks.map((t, idx) => ({
      id: t.id,
      status: targetColId,
      order: idx * 10,
      completed: targetColId === 'completed',
    }));

    if (targetColId === 'completed' && !sourceTask.completed) {
      sounds.playCheck();
    }

    reorderTasks(updates);
    handleDragEnd();
  };

  // 6. Drop On Column Background (or empty column)
  const handleDropOnColumn = (e: React.DragEvent, targetColId: TaskStatus) => {
    e.preventDefault();
    const sourceTaskId = draggedTaskId || e.dataTransfer.getData('text/plain');
    if (!sourceTaskId) return;

    const sourceTask = tasks.find((t) => t.id === sourceTaskId);
    if (!sourceTask) return;

    const currentSortedColTasks = getSortedColTasks(targetColId).filter((t) => t.id !== sourceTaskId);
    const isCompleted = targetColId === 'completed';
    const nowStr = new Date().toISOString().split('T')[0];

    const updatedSourceTask: Task = {
      ...sourceTask,
      status: targetColId,
      completed: isCompleted,
      completedAt: isCompleted ? (sourceTask.completedAt || nowStr) : undefined,
    };

    const newColTasks = [...currentSortedColTasks, updatedSourceTask];
    const updates = newColTasks.map((t, idx) => ({
      id: t.id,
      status: targetColId,
      order: idx * 10,
      completed: targetColId === 'completed',
    }));

    if (targetColId === 'completed' && !sourceTask.completed) {
      sounds.playCheck();
    }

    reorderTasks(updates);
    handleDragEnd();
  };

  // Arrow button move fallback
  const moveTask = (task: Task, direction: 'prev' | 'next') => {
    let nextStatus: TaskStatus = task.status;
    if (direction === 'next') {
      if (task.status === 'todo') nextStatus = 'in_progress';
      else if (task.status === 'in_progress') nextStatus = 'completed';
    } else {
      if (task.status === 'completed') nextStatus = 'in_progress';
      else if (task.status === 'in_progress') nextStatus = 'todo';
    }

    if (nextStatus === 'completed' && !task.completed) {
      toggleTaskCompletion(task.id);
    } else if (nextStatus !== 'completed' && task.completed) {
      toggleTaskCompletion(task.id);
    } else {
      updateTask(task.id, { status: nextStatus });
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-4">
      {/* Tab Switcher: Today vs All Tasks */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 pb-1">
        <div className="flex items-center bg-[rgba(118,118,128,0.12)] p-0.5 rounded-[9px] text-xs font-medium w-fit">
          <button
            onClick={() => setBoardTab('today')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] transition cursor-pointer ${
              boardTab === 'today'
                ? 'bg-white dark:bg-[#3A3A3C] text-[#1C1C1E] dark:text-[#F5F5F7] shadow-xs'
                : 'text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-[#F5F5F7]'
            }`}
          >
            <span>Today</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                boardTab === 'today'
                  ? 'bg-[rgba(10,132,255,0.12)] text-[#0A84FF]'
                  : 'bg-black/5 dark:bg-white/10 text-[#8E8E93]'
              }`}
            >
              {todayTasks.length}
            </span>
          </button>

          <button
            onClick={() => setBoardTab('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] transition cursor-pointer ${
              boardTab === 'all'
                ? 'bg-white dark:bg-[#3A3A3C] text-[#1C1C1E] dark:text-[#F5F5F7] shadow-xs'
                : 'text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-[#F5F5F7]'
            }`}
          >
            <span>All Tasks</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                boardTab === 'all'
                  ? 'bg-[rgba(10,132,255,0.12)] text-[#0A84FF]'
                  : 'bg-black/5 dark:bg-white/10 text-[#8E8E93]'
              }`}
            >
              {otherTasks.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#8E8E93]">
          <Move className="w-3.5 h-3.5 text-[#0A84FF]" />
          <span>
            {boardTab === 'today'
              ? 'Showing tasks scheduled for today'
              : 'Showing tasks not scheduled for today'}
          </span>
        </div>
      </div>

      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {columns.map((col) => {
          const colTasks = getSortedColTasks(col.id);
          const isOverThisCol = dragOverColId === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleColumnDragOver(e, col.id)}
              onDragLeave={(e) => handleColumnDragLeave(e, col.id)}
              onDrop={(e) => handleDropOnColumn(e, col.id)}
              className={`flex flex-col apple-subpanel rounded-2xl p-3.5 min-h-[550px] transition-all duration-200 border ${
                isOverThisCol
                  ? 'border-[#0A84FF] ring-2 ring-[#0A84FF]/20 shadow-md'
                  : 'border-[rgba(255,255,255,0.6)] dark:border-[rgba(255,255,255,0.08)]'
              }`}
            >
              {/* Column Header: 13px medium, icon, light grey count, plain + Add */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[rgba(60,60,67,0.08)] dark:border-[rgba(255,255,255,0.08)] shrink-0">
                <div className="flex items-center gap-2">
                  {col.icon}
                  <h3 className="font-medium text-[var(--text-primary)] text-[13px] flex items-center gap-1.5">
                    {col.title}
                    <span className="text-[12px] text-[var(--text-secondary)] font-normal">
                      ({colTasks.length})
                    </span>
                  </h3>
                </div>

                <button
                  onClick={() =>
                    openTaskModal(
                      null,
                      selectedCategory !== 'all' ? selectedCategory : undefined,
                      undefined,
                      col.id
                    )
                  }
                  title={`Add to ${col.title}`}
                  className="text-xs font-normal text-[#0A84FF] hover:underline transition cursor-pointer"
                >
                  + Add
                </button>
              </div>

              {/* Cards List / Drop Target - Flat single-line rows with hairline dividers */}
              <div className="flex-1 overflow-y-auto pr-0.5 min-h-[300px]">
                {colTasks.length === 0 ? (
                  <div
                    className={`h-40 rounded-[10px] flex flex-col items-center justify-center text-xs italic transition border border-dashed ${
                      isOverThisCol
                        ? 'border-[#0A84FF] bg-[#0A84FF]/10 text-[#0A84FF] font-medium'
                        : 'border-[rgba(60,60,67,0.15)] dark:border-[rgba(255,255,255,0.12)] text-[var(--text-tertiary)]'
                    }`}
                  >
                    <span>{isOverThisCol ? 'Drop task here' : 'No items in this column'}</span>
                  </div>
                ) : (
                  <div className="divide-y divide-[rgba(60,60,67,0.08)] dark:divide-[rgba(255,255,255,0.08)] apple-panel rounded-[10px] overflow-hidden">
                    {colTasks.map((task) => {
                      const cat = getCategory(task.categoryId);
                      const isBeingDragged = draggedTaskId === task.id;
                      const isDropTargetBefore = dragOverTaskId === task.id && dropPosition === 'before';
                      const isDropTargetAfter = dragOverTaskId === task.id && dropPosition === 'after';

                      return (
                        <div key={task.id} className="relative">
                          {/* Insertion Slot Before Indicator */}
                          {isDropTargetBefore && (
                            <div className="h-0.5 bg-[#0A84FF] w-full" />
                          )}

                          {/* Flat Single-Line Row (32-36px height) */}
                          <div
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, task)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => handleCardDragOver(e, task, col.id)}
                            onDrop={(e) => handleDropOnCard(e, task, col.id)}
                            className={`group min-h-[34px] py-1.5 px-2.5 flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing select-none transition-all hover:bg-black/[0.03] dark:hover:bg-white/[0.03] ${
                              isBeingDragged ? 'opacity-30 bg-black/5 dark:bg-white/5' : ''
                            }`}
                          >
                            {/* Left: Drag Handle + Round Checkbox 18px + Category Dot + Title */}
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span
                                title="Drag to reorder"
                                className="opacity-0 group-hover:opacity-60 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-grab -ml-1 transition shrink-0"
                              >
                                <GripVertical className="w-3.5 h-3.5" />
                              </span>

                              {/* Apple Round Checkbox 18px */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleTaskCompletion(task.id);
                                }}
                                title={task.completed ? 'Mark incomplete' : 'Mark complete'}
                                className={`apple-checkbox ${task.completed ? 'checked' : ''}`}
                              >
                                {task.completed && <CheckCircle2 className="w-3 h-3 stroke-[3]" />}
                              </button>

                              {/* Category Dot */}
                              {cat && (
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: cat.color }}
                                  title={cat.name}
                                />
                              )}

                              {/* Title: 14px regular */}
                              <span
                                onClick={() => openTaskModal(task)}
                                className={`text-[14px] font-normal truncate flex-1 min-w-0 cursor-pointer ${
                                  task.completed
                                    ? 'line-through text-[var(--text-secondary)]'
                                    : 'text-[var(--text-primary)]'
                                }`}
                              >
                                {task.title}
                              </span>

                              {/* Inline secondary metadata: 12px light grey */}
                              <div className="hidden sm:flex items-center gap-2 text-[12px] text-[var(--text-secondary)] shrink-0 ml-auto mr-1">
                                {task.dueDate && <span>{task.dueDate}</span>}
                                {task.itemType === 'habit' && (task.streakCount || 0) > 0 && (
                                  <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-medium">
                                    <Flame className="w-3 h-3 fill-amber-500" />
                                    <span>{task.streakCount}d</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons on Hover: Prev, Edit, Delete, Next */}
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              {col.id !== 'todo' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveTask(task, 'prev');
                                  }}
                                  title="Move back"
                                  className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
                                >
                                  <ArrowLeft className="w-3.5 h-3.5 stroke-current" />
                                </button>
                              )}

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openTaskModal(task);
                                }}
                                title="Edit item"
                                className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5 stroke-current" />
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteTask(task.id);
                                }}
                                title="Delete"
                                className="p-1 rounded text-[var(--text-secondary)] hover:text-[#FF3B30] transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 stroke-current" />
                              </button>

                              {col.id !== 'completed' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveTask(task, 'next');
                                  }}
                                  title="Advance"
                                  className="p-1 rounded text-[#0A84FF] hover:text-[#0071E3] transition cursor-pointer"
                                >
                                  <ArrowRight className="w-3.5 h-3.5 stroke-current" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Insertion Slot After Indicator */}
                          {isDropTargetAfter && (
                            <div className="h-0.5 bg-[#0A84FF] w-full" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Bottom Drop Zone when hovering over column below all cards */}
                {isOverThisCol && colTasks.length > 0 && !dragOverTaskId && (
                  <div className="p-2.5 rounded-xl border-2 border-dashed border-blue-400 bg-blue-50/40 dark:bg-blue-950/20 text-center text-xs font-semibold text-blue-600 dark:text-blue-400 animate-pulse">
                    Drop to bottom of {col.title}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
