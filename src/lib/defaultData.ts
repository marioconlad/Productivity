import { Category, Task, HabitLog, ProgressMetric, MentalCheckIn } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat_ENT',
    userId: 'local',
    name: 'ENT',
    type: 'ENT',
    color: '#FB923C', // Pale Apricot / Orange
    icon: '🚀',
    monthlyTarget: 20,
    monthlyTaskGoal: 20,
    unit: 'hours',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat_EPS',
    userId: 'local',
    name: 'EPS',
    type: 'EPS',
    color: '#818CF8', // Pale Indigo
    icon: '♟️',
    monthlyTarget: 20,
    monthlyTaskGoal: 20,
    unit: 'hours',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat_BIDA',
    userId: 'local',
    name: 'BIDA',
    type: 'BIDA',
    color: '#38BDF8', // Pale Sky Blue
    icon: '📊',
    monthlyTarget: 30,
    monthlyTaskGoal: 20,
    unit: 'hours',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat_COD',
    userId: 'local',
    name: 'COD',
    type: 'COD',
    color: '#2DD4BF', // Pale Teal / Mint
    icon: '💻',
    monthlyTarget: 40,
    monthlyTaskGoal: 20,
    unit: 'hours',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat_MEN',
    userId: 'local',
    name: 'MEN',
    type: 'MEN',
    color: '#C084FC', // Pale Lilac
    icon: '🧠',
    monthlyTarget: 15,
    monthlyTaskGoal: 20,
    unit: 'checks',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat_SPORT',
    userId: 'local',
    name: 'SPORT',
    type: 'SPORT',
    color: '#34D399', // Pale Sage Green
    icon: '⚡',
    monthlyTarget: 20,
    monthlyTaskGoal: 20,
    unit: 'workouts',
    createdAt: new Date().toISOString(),
  },
];

const today = new Date();
const formatDate = (d: Date) => d.toISOString().split('T')[0];
const todayStr = formatDate(today);

// Only COD has an initial starter task, all others start clean and empty
export const DEFAULT_TASKS: Task[] = [
  {
    id: 'task_cod_1',
    userId: 'local',
    categoryId: 'cat_COD',
    title: 'Algorithms & System Architecture Practice',
    description: 'Solve Tree traversal and Graph problems in TypeScript/Python.',
    itemType: 'reminder',
    status: 'in_progress',
    priority: 'high',
    frequency: 'once',
    streakCount: 3,
    bestStreak: 5,
    order: 0,
    completed: false,
    createdAt: new Date().toISOString(),
  },
];

export const generateDefaultHabitLogs = (): HabitLog[] => {
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const dayBefore = new Date(today);
  dayBefore.setDate(dayBefore.getDate() - 2);

  const yesterdayStr = formatDate(yesterday);
  const dayBeforeStr = formatDate(dayBefore);

  return [
    {
      id: `log_task_cod_1_${dayBeforeStr}`,
      userId: 'local',
      taskId: 'task_cod_1',
      categoryId: 'cat_COD',
      date: dayBeforeStr,
      completed: true,
      value: 1,
      note: 'Tree traversal practice',
      createdAt: dayBefore.toISOString(),
    },
    {
      id: `log_task_cod_1_${yesterdayStr}`,
      userId: 'local',
      taskId: 'task_cod_1',
      categoryId: 'cat_COD',
      date: yesterdayStr,
      completed: true,
      value: 1,
      note: 'Graph algorithms practice',
      createdAt: yesterday.toISOString(),
    },
    {
      id: `log_task_cod_1_${todayStr}`,
      userId: 'local',
      taskId: 'task_cod_1',
      categoryId: 'cat_COD',
      date: todayStr,
      completed: true,
      value: 1,
      note: 'Morning coding session',
      createdAt: today.toISOString(),
    },
  ];
};

export const generateDefaultProgressMetrics = (): ProgressMetric[] => {
  return [
    {
      id: 'metric_cod_init',
      userId: 'local',
      categoryId: 'cat_COD',
      taskId: 'task_cod_1',
      metricType: 'COD',
      date: todayStr,
      value: 2,
      note: 'Coding problem set',
      createdAt: today.toISOString(),
    },
  ];
};

export const DEFAULT_MENTAL_CHECKINS: MentalCheckIn[] = [
  {
    id: 'mcheck_sample_1',
    userId: 'local',
    date: todayStr,
    situation: 'Felt overwhelmed reviewing the final project deliverables deadline.',
    emotion: 'Anxious & Self-doubt',
    voteBefore: 85,
    distortion1: 'All-or-nothing thinking',
    distortion2: 'Fortune telling',
    distortion3: 'Catastrophizing',
    afterThought: 'I have broken the milestone into small daily tasks and have delivered similar projects before. Taking it step by step will get it done.',
    voteAfter: 25,
    createdAt: today.toISOString(),
  },
];
