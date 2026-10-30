export type ItemType = 'reminder' | 'goal' | 'habit';

export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export type Priority = 'low' | 'medium' | 'high';

export type Frequency = 'daily' | 'weekly' | 'weekdays' | 'monthly' | 'once';

export type CategoryType = 'ENT' | 'EPS' | 'BIDA' | 'COD' | 'MEN' | 'SPORT' | 'custom';

export interface Category {
  id: string;
  userId: string;
  name: string; // e.g. "ENT", "EPS", "BIDA", "COD", "MEN", "SPORT"
  type: string;
  color: string;
  icon: string;
  monthlyTarget?: number;
  monthlyTaskGoal?: number; // Target number of completed tasks per month (default 20)
  unit?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Task {
  id: string;
  userId: string;
  categoryId: string;
  title: string;
  description?: string;
  itemType: ItemType;
  status: TaskStatus;
  priority?: Priority;
  dueDate?: string; // YYYY-MM-DD - optional!
  dueTime?: string; // HH:mm - optional!
  duration?: number; // duration in minutes - optional!
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  repeatDays?: (number | string)[]; // e.g. [1, 3, 5]
  frequency?: Frequency;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  reminderEnabled?: boolean;
  streakCount?: number;
  bestStreak?: number;
  completed?: boolean;
  completedAt?: string;
  order?: number; // Manual order number
  createdAt: string;
  updatedAt?: string;
}

export interface HistoryStep {
  id: string;
  description: string;
  timestamp: number;
  tasksBefore: Task[];
  tasksAfter: Task[];
  categoriesBefore?: Category[];
  categoriesAfter?: Category[];
}

export interface HabitLog {
  id: string;
  userId: string;
  taskId: string;
  categoryId?: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  value?: number;
  note?: string;
  createdAt: string;
}

export interface ProgressMetric {
  id: string;
  userId: string;
  categoryId: string;
  taskId?: string;
  metricType?: string;
  date: string; // YYYY-MM-DD
  value: number;
  note?: string;
  createdAt: string;
}

export interface EmotionalDistortionDef {
  name: string;
  definition: string;
}

export const COGNITIVE_DISTORTIONS: EmotionalDistortionDef[] = [
  {
    name: 'All-or-nothing thinking',
    definition: 'You see things in black and white. Anything short of perfect counts as a total failure.',
  },
  {
    name: 'Overgeneralization',
    definition: 'You treat one bad event as a never-ending pattern ("always", "never").',
  },
  {
    name: 'Mental filter',
    definition: 'You pick out one negative detail and dwell on it until everything looks dark.',
  },
  {
    name: 'Disqualifying the positive',
    definition: 'You dismiss good experiences as flukes or as not counting.',
  },
  {
    name: 'Jumping to conclusions',
    definition: 'You reach a negative conclusion without evidence. Divided into Mind reading & Fortune telling.',
  },
  {
    name: 'Mind reading',
    definition: 'Assuming people think badly of you.',
  },
  {
    name: 'Fortune telling',
    definition: 'Predicting things will go badly and treating that as fact.',
  },
  {
    name: 'Magnification and minimization',
    definition: 'You blow up your mistakes and shrink your strengths. Burns calls this the "binocular trick".',
  },
  {
    name: 'Emotional reasoning',
    definition: '"I feel it, so it must be true." Feeling worthless becomes proof that you are worthless.',
  },
  {
    name: 'Should statements',
    definition: 'You push yourself with "should", "must" and "ought". Aimed at yourself they produce guilt; aimed at others they produce resentment.',
  },
  {
    name: 'Labeling and mislabeling',
    definition: 'Instead of describing a mistake, you attach a label to yourself ("I\'m a loser").',
  },
  {
    name: 'Personalization',
    definition: 'You take responsibility for things that aren\'t mainly your fault.',
  },
];

export interface MentalCheckIn {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  situation: string;
  emotion: string;
  voteBefore?: number; // 1 to 100
  distortion1?: string;
  distortion2?: string;
  distortion3?: string;
  afterThought?: string;
  voteAfter: number; // 1 to 100
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  pushEnabled?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  taskId?: string;
}

export type ViewMode = 'list' | 'kanban' | 'calendar' | 'analytics';

export type ThemeMode = 'dark' | 'light' | 'system';
