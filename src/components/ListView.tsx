import React, { useState, useMemo } from 'react';
import {
  Check,
  Flame,
  Clock,
  Calendar,
  AlertCircle,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  ChevronRight,
  TrendingUp,
  Bell,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Task, ItemType } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { calculateHabitStreak } from '../lib/streak';

export const ListView: React.FC = () => {
  const {
    tasks,
    categories,
    habitLogs,
    selectedCategory,
    toggleTaskCompletion,
    deleteTask,
    openTaskModal,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<ItemType | 'all'>('all');
  const [showCompleted, setShowCompleted] = useState(true);

  // Filter tasks based on category, search, and type
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Category filter
      if (selectedCategory !== 'all' && task.categoryId !== selectedCategory) {
        return false;
      }
      // Type filter
      if (typeFilter !== 'all' && task.itemType !== typeFilter) {
        return false;
      }
      // Completed filter
      if (!showCompleted && task.completed) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDesc = task.description?.toLowerCase().includes(query);
        return matchesTitle || matchesDesc;
      }
      return true;
    });
  }, [tasks, selectedCategory, typeFilter, showCompleted, searchQuery]);

  // Group into Active and Completed
  const activeTasks = useMemo(() => filteredTasks.filter((t) => !t.completed), [filteredTasks]);
  const completedTasks = useMemo(() => filteredTasks.filter((t) => t.completed), [filteredTasks]);

  const getCategory = (catId: string) => categories.find((c) => c.id === catId);

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      
      {/* Search & Filter Toolbar (Apple Style) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search habits, reminders, and goals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none transition-all shadow-inner"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {(['all', 'habit', 'reminder', 'goal'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition cursor-pointer shrink-0 ${
                typeFilter === type
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
              }`}
            >
              {type === 'all' ? 'All Types' : type + 's'}
            </button>
          ))}

          {/* Toggle completed visibility */}
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer shrink-0 ${
              showCompleted
                ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
            }`}
          >
            {showCompleted ? 'Hide Done' : 'Show Done'}
          </button>
        </div>
      </div>

      {/* Active Tasks Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            To Do & In Progress ({activeTasks.length})
          </h2>
          <button
            onClick={() => openTaskModal(null, selectedCategory !== 'all' ? selectedCategory : undefined)}
            className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add New
          </button>
        </div>

        {activeTasks.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-zinc-50/80 dark:bg-zinc-900/50 border border-dashed border-zinc-200 dark:border-zinc-800">
            <Sparkles className="w-8 h-8 mx-auto text-blue-500/70 mb-2" />
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">All clear!</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
              No pending items in this view. Keep up the high productivity streak or add a new goal!
            </p>
            <button
              onClick={() => openTaskModal(null, selectedCategory !== 'all' ? selectedCategory : undefined)}
              className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition shadow-sm cursor-pointer"
            >
              Add Item
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900/90 rounded-3xl shadow-sm border border-zinc-200/70 dark:border-zinc-800/80 divide-y divide-zinc-100 dark:divide-zinc-800/60 overflow-hidden">
            {activeTasks.map((task) => (
              <TaskListItem
                key={task.id}
                task={task}
                category={getCategory(task.categoryId)}
                habitLogs={habitLogs}
                onToggle={() => toggleTaskCompletion(task.id)}
                onEdit={() => openTaskModal(task)}
                onDelete={() => deleteTask(task.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Completed Section */}
      {showCompleted && completedTasks.length > 0 && (
        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Completed ({completedTasks.length})
            </h2>
          </div>

          <div className="bg-white/60 dark:bg-zinc-900/50 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 divide-y divide-zinc-100 dark:divide-zinc-800/40 overflow-hidden">
            {completedTasks.map((task) => (
              <TaskListItem
                key={task.id}
                task={task}
                category={getCategory(task.categoryId)}
                habitLogs={habitLogs}
                onToggle={() => toggleTaskCompletion(task.id)}
                onEdit={() => openTaskModal(task)}
                onDelete={() => deleteTask(task.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface TaskListItemProps {
  task: Task;
  category?: ReturnType<typeof useApp>['categories'][0];
  habitLogs: ReturnType<typeof useApp>['habitLogs'];
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const TaskListItem: React.FC<TaskListItemProps> = ({
  task,
  category,
  habitLogs,
  onToggle,
  onEdit,
  onDelete,
}) => {
  const isGoal = task.itemType === 'goal';
  const isHabit = task.itemType === 'habit';
  const isReminder = task.itemType === 'reminder';

  const streakInfo = useMemo(() => {
    if (!isHabit) return null;
    return calculateHabitStreak(task, habitLogs);
  }, [isHabit, task, habitLogs]);

  const goalPercent = isGoal && task.targetValue && task.targetValue > 0
    ? Math.min(100, Math.round(((task.currentValue || 0) / task.targetValue) * 100))
    : null;

  return (
    <div className="group flex items-start sm:items-center justify-between p-4 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition gap-3">
      {/* Left Checkbox & Title */}
      <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
        
        {/* Apple Style Tactile Circular Checkbox */}
        <button
          onClick={onToggle}
          className={`mt-0.5 sm:mt-0 w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 cursor-pointer ${
            task.completed
              ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/30'
              : 'border-2 border-zinc-300 dark:border-zinc-600 hover:border-blue-500 dark:hover:border-blue-400 bg-transparent'
          }`}
        >
          {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        {/* Content Details */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-sm font-medium transition-all ${
                task.completed
                  ? 'line-through text-zinc-400 dark:text-zinc-500'
                  : 'text-zinc-900 dark:text-zinc-100'
              }`}
            >
              {task.title}
            </span>

            {/* Category tag */}
            {category && (
              <span
                className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${category.color}15`,
                  color: category.color,
                }}
              >
                <CategoryIcon name={category.icon || category.type} size={11} />
                <span>{category.name}</span>
              </span>
            )}

            {/* Habit Streak Badge */}
            {isHabit && streakInfo && (
              <span
                title={streakInfo.streakStatusText}
                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ring-1 ${
                  streakInfo.currentStreak > 0
                    ? 'text-amber-700 dark:text-amber-300 bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-rose-500/10 ring-amber-300/60 dark:ring-amber-700/50'
                    : 'text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 ring-zinc-200 dark:ring-zinc-700'
                }`}
              >
                <Flame className={`w-3 h-3 ${streakInfo.currentStreak > 0 ? 'text-amber-500 fill-amber-500 animate-pulse' : 'text-zinc-400'}`} />
                <span>{streakInfo.currentStreak}d streak</span>
              </span>
            )}

            {/* Priority flag */}
            {task.priority === 'high' && (
              <span className="text-[10px] uppercase font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 rounded-md">
                High
              </span>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
              {task.description}
            </p>
          )}

          {/* Goal Progress bar */}
          {isGoal && goalPercent !== null && (
            <div className="pt-1 max-w-xs space-y-1">
              <div className="flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                <span>
                  {task.unit === '$' ? '$' : ''}
                  {task.currentValue || 0} / {task.unit === '$' ? '$' : ''}
                  {task.targetValue} {task.unit !== '$' ? task.unit : ''}
                </span>
                <span className="font-semibold">{goalPercent}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                  style={{ width: `${goalPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Due date & Reminder tags */}
          <div className="flex items-center gap-3 text-[11px] text-zinc-400 dark:text-zinc-500 pt-0.5">
            {task.dueDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {task.dueDate} {task.dueTime ? `@ ${task.dueTime}` : ''}
              </span>
            )}
            {task.reminderEnabled && (
              <span className="flex items-center gap-1 text-blue-500 dark:text-blue-400">
                <Bell className="w-3 h-3" />
                Push active
              </span>
            )}
            {task.frequency && task.frequency !== 'once' && (
              <span className="capitalize text-zinc-400">• {task.frequency}</span>
            )}
          </div>
        </div>
      </div>

      {/* Right Action buttons */}
      <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={onEdit}
          title="Edit item"
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          title="Delete item"
          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
