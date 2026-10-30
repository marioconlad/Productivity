import { Task } from '../types';

/**
 * Format a Date object to YYYY-MM-DD using local time
 */
export function formatLocalDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Normalizes title for deduplication (e.g. " Gym " -> "gym")
 */
export function normalizeHabitTitle(title: string): string {
  return title.trim().toLowerCase();
}

/**
 * Checks whether a given task or recurring habit is scheduled for a specific date (YYYY-MM-DD).
 * Strict adherence to:
 * - A habit/recurring item appears only on days matching its own start date, end date (if any) and selected weekdays. Never before its start date.
 * - If stored data has no start date or weekdays, uses creation date as start and the days the user chose as repeat days.
 */
export function isTaskScheduledForDate(task: Task, dateStr: string): boolean {
  if (!dateStr) return false;

  const isHabit = task.itemType === 'habit';
  const hasRecurrence = Boolean(
    task.frequency === 'daily' ||
    task.frequency === 'weekdays' ||
    task.frequency === 'weekly' ||
    (task.repeatDays && task.repeatDays.length > 0)
  );

  // Non-recurring non-habit items: strictly match dueDate
  if (!isHabit && !hasRecurrence) {
    return task.dueDate === dateStr;
  }

  // Determine effective start date
  const effectiveStartDate = (
    task.startDate ||
    task.dueDate ||
    (task.createdAt ? task.createdAt.split('T')[0] : '')
  ).split('T')[0];

  // RULE: Never appears before its start date
  if (effectiveStartDate && dateStr < effectiveStartDate) {
    return false;
  }

  // RULE: Never appears after end date if specified
  if (task.endDate) {
    const effectiveEndDate = task.endDate.split('T')[0];
    if (dateStr > effectiveEndDate) {
      return false;
    }
  }

  // Non-recurring habit with once frequency: strictly matches dueDate or start date
  if (task.frequency === 'once' && (!task.repeatDays || task.repeatDays.length === 0)) {
    return (task.dueDate || effectiveStartDate) === dateStr;
  }

  const [y, m, d] = dateStr.split('-').map(Number);
  const targetDate = new Date(y, m - 1, d);
  const targetDayOfWeek = targetDate.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

  // Check explicit repeatDays if specified
  if (task.repeatDays && task.repeatDays.length > 0) {
    return task.repeatDays.some((rd) => {
      if (typeof rd === 'number') {
        // Handle 0-6 (Sun-Sat) or 1-7 (Mon-Sun, where 7 = Sun = 0)
        return rd === targetDayOfWeek || (rd === 7 && targetDayOfWeek === 0);
      }
      if (typeof rd === 'string') {
        const lower = rd.toLowerCase().trim();
        const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        return lower.startsWith(dayNames[targetDayOfWeek]);
      }
      return false;
    });
  }

  // Frequency-based scheduling
  if (task.frequency === 'weekdays') {
    // Mon-Fri: 1 to 5
    return targetDayOfWeek >= 1 && targetDayOfWeek <= 5;
  }

  if (task.frequency === 'weekly') {
    if (effectiveStartDate) {
      const [sy, sm, sd] = effectiveStartDate.split('-').map(Number);
      const startDayOfWeek = new Date(sy, sm - 1, sd).getDay();
      return targetDayOfWeek === startDayOfWeek;
    }
    return false;
  }

  if (task.frequency === 'daily') {
    return true;
  }

  // If a habit has no recurring frequency but has a dueDate, it appears on that dueDate
  if (task.dueDate) {
    return task.dueDate === dateStr;
  }

  // Unscheduled habits without repeatDays or frequency do not appear on scheduled days
  return false;
}

/**
 * Returns tasks scheduled for dateStr, ensuring:
 * - Each habit/task occurrence appears AT MOST ONCE per day
 * - Deduplicates duplicate items with the same title and category
 */
export function getUniqueTasksForDate(tasks: Task[], dateStr: string): Task[] {
  const matching = tasks.filter((t) => isTaskScheduledForDate(t, dateStr));
  const seenKeys = new Set<string>();
  const uniqueList: Task[] = [];

  for (const t of matching) {
    const key = `${t.categoryId || 'none'}__${normalizeHabitTitle(t.title)}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueList.push(t);
    }
  }

  return uniqueList;
}

/**
 * Human-friendly date header for "Group by Date"
 */
export function getFriendlyDateHeader(dateStr: string): {
  title: string;
  isToday: boolean;
  isTomorrow: boolean;
  dateObj?: Date;
} {
  if (!dateStr) {
    return { title: 'No Due Date / Backlog', isToday: false, isTomorrow: false };
  }

  const todayStr = formatLocalDateStr(new Date());
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatLocalDateStr(tomorrow);

  if (dateStr === todayStr) {
    return { title: 'Today', isToday: true, isTomorrow: false };
  }
  if (dateStr === tomorrowStr) {
    return { title: 'Tomorrow', isToday: false, isTomorrow: true };
  }

  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const formatted = dateObj.toLocaleDateString('default', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: dateObj.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });

  return { title: formatted, isToday: false, isTomorrow: false, dateObj };
}
