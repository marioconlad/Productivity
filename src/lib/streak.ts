import { Task, HabitLog } from '../types';

export interface DayStreakStatus {
  dateStr: string; // YYYY-MM-DD
  dayLabel: string; // "Mon", "Tue", etc.
  dateNum: number;
  isCompleted: boolean;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
}

export interface CategoryStreakResult {
  currentStreak: number;
  bestStreak: number;
  isCompletedToday: boolean;
  activeDates: Set<string>;
  totalCompletedTasks: number;
  completedThisWeekCount: number;
  completedThisMonthCount: number;
}

export const formatLocalDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Calculates automatic streaks for a category (or 'ALL' categories):
 * - An active day is any day where >= 1 task was completed.
 * - Uses completedAt (fallback to dueDate or date if completedAt missing).
 * - Current streak = consecutive active days ending today (or ending yesterday if no task completed yet today).
 * - Best streak = maximum consecutive active days across all history.
 * - Un-completing immediately reflects in active days and streaks.
 */
export function calculateCategoryStreak(
  categoryId: string, // category id or 'ALL' / 'all'
  tasks: Task[],
  habitLogs: HabitLog[] = [],
  baseDate: Date = new Date()
): CategoryStreakResult {
  const today = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  const todayStr = formatLocalDate(today);
  const isAll = categoryId === 'ALL' || categoryId === 'all';

  const activeDates = new Set<string>();

  // Filter tasks belonging to category (or all)
  const relevantTasks = tasks.filter((t) => isAll || t.categoryId === categoryId);

  // 1. Collect completed dates from tasks that are currently marked completed
  relevantTasks.forEach((task) => {
    if (task.completed) {
      const dateStr = task.completedAt
        ? task.completedAt.split('T')[0]
        : task.dueDate || formatLocalDate(new Date(task.updatedAt || task.createdAt || todayStr));
      if (dateStr) {
        activeDates.add(dateStr);
      }
    }
  });

  // 2. Also incorporate historical logs if present
  habitLogs.forEach((log) => {
    if (log.completed && log.date) {
      if (isAll || log.categoryId === categoryId) {
        activeDates.add(log.date);
      } else {
        // If log belongs to a task in this category
        const matchingTask = tasks.find((t) => t.id === log.taskId);
        if (matchingTask && matchingTask.categoryId === categoryId) {
          activeDates.add(log.date);
        }
      }
    }
  });

  const isCompletedToday = activeDates.has(todayStr);

  // Calculate current streak
  let currentStreak = 0;
  const cursor = new Date(today);

  if (isCompletedToday) {
    currentStreak++;
    cursor.setDate(cursor.getDate() - 1);
  } else {
    // If not completed today, check if streak ended yesterday
    cursor.setDate(cursor.getDate() - 1);
  }

  // Count backwards continuously
  while (true) {
    const dStr = formatLocalDate(cursor);
    if (activeDates.has(dStr)) {
      currentStreak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate best streak across all history
  let bestStreak = 0;
  const sortedDates = Array.from(activeDates).sort();

  if (sortedDates.length > 0) {
    let tempStreak = 1;
    bestStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      // Difference in days
      const diffTime = curr.getTime() - prev.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

      if (diffDays === 1) {
        tempStreak++;
        if (tempStreak > bestStreak) bestStreak = tempStreak;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
  }

  // Also check existing task.bestStreak records if any
  const maxRecordedBest = Math.max(
    0,
    ...relevantTasks.map((t) => t.bestStreak || 0)
  );
  if (maxRecordedBest > bestStreak) {
    bestStreak = maxRecordedBest;
  }
  if (currentStreak > bestStreak) {
    bestStreak = currentStreak;
  }

  // Total completed tasks currently
  const totalCompletedTasks = relevantTasks.filter((t) => t.completed).length;

  // Completed this week (Mon-Sun)
  const d = new Date(today);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  const weekStartStr = formatLocalDate(monday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const weekEndStr = formatLocalDate(sunday);

  const completedThisWeekCount = relevantTasks.filter((t) => {
    if (!t.completed) return false;
    const dateStr = t.completedAt ? t.completedAt.split('T')[0] : t.dueDate;
    return dateStr ? dateStr >= weekStartStr && dateStr <= weekEndStr : false;
  }).length;

  // Completed this month
  const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const completedThisMonthCount = relevantTasks.filter((t) => {
    if (!t.completed) return false;
    const dateStr = t.completedAt ? t.completedAt.split('T')[0] : t.dueDate;
    return dateStr ? dateStr.startsWith(currentYearMonth) : false;
  }).length;

  return {
    currentStreak,
    bestStreak,
    isCompletedToday,
    activeDates,
    totalCompletedTasks,
    completedThisWeekCount,
    completedThisMonthCount,
  };
}

// Backward compatibility alias
export function calculateHabitStreak(
  task: Task,
  habitLogs: HabitLog[] = [],
  baseDate: Date = new Date()
) {
  const result = calculateCategoryStreak(task.categoryId, [task], habitLogs, baseDate);
  return {
    currentStreak: result.currentStreak,
    bestStreak: result.bestStreak,
    isCompletedToday: result.isCompletedToday,
    isDueToday: !result.isCompletedToday,
    totalCompletedDays: result.activeDates.size,
    completedDates: result.activeDates,
    streakStatusText: `${result.currentStreak} day streak`,
    recentDays: [],
  };
}
