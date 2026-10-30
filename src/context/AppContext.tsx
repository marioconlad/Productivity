import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
  testFirestoreConnection,
} from '../lib/firebase';
import {
  Category,
  Task,
  HabitLog,
  ProgressMetric,
  MentalCheckIn,
  NotificationItem,
  ViewMode,
  ThemeMode,
  TaskStatus,
  ItemType,
  HistoryStep,
} from '../types';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_TASKS,
  generateDefaultHabitLogs,
  generateDefaultProgressMetrics,
  DEFAULT_MENTAL_CHECKINS,
} from '../lib/defaultData';
import { notificationService } from '../lib/notifications';
import { sounds } from '../lib/audio';

interface ModalState {
  isTaskOpen: boolean;
  editingTask?: Task | null;
  defaultCategory?: string;
  defaultType?: ItemType;
  defaultStatus?: TaskStatus;
  defaultDueDate?: string;
  defaultDueTime?: string;
  isCategoryOpen: boolean;
  editingCategory?: Category | null;
  isProgressOpen: boolean;
  progressCategory?: string;
  isNotificationCenterOpen: boolean;
  isMentalCheckInOpen: boolean;
  isLegendOpen: boolean;
  isGuideOpen: boolean;
}

export interface UndoToastState {
  id: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface AppContextType {
  user: User | null;
  isAuthLoading: boolean;
  categories: Category[];
  tasks: Task[];
  habitLogs: HabitLog[];
  progressMetrics: ProgressMetric[];
  mentalCheckIns: MentalCheckIn[];
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  viewMode: ViewMode;
  selectedCategory: string;
  theme: ThemeMode;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'local';
  lastSyncedAt: Date | null;
  
  // Navigation & Modals
  setViewMode: (mode: ViewMode) => void;
  setSelectedCategory: (catId: string) => void;
  setTheme: (theme: ThemeMode) => void;
  modalState: ModalState;
  openTaskModal: (
    task?: Task | null,
    defaultCategory?: string,
    defaultType?: ItemType,
    defaultStatus?: TaskStatus,
    defaultDueDate?: string,
    defaultDueTime?: string
  ) => void;
  closeTaskModal: () => void;
  openCategoryModal: (cat?: Category | null) => void;
  closeCategoryModal: () => void;
  openProgressModal: (categoryId?: string) => void;
  closeProgressModal: () => void;
  openNotificationCenter: () => void;
  closeNotificationCenter: () => void;
  openMentalModal: () => void;
  closeMentalModal: () => void;
  openLegendModal: () => void;
  closeLegendModal: () => void;
  openGuideModal: () => void;
  closeGuideModal: () => void;

  // Actions
  addTask: (data: Partial<Task>) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>, customHistoryDesc?: string) => Promise<void>;
  reorderTasks: (
    updates: { id: string; status?: TaskStatus; order: number; completed?: boolean; dueDate?: string; dueTime?: string }[],
    customDesc?: string
  ) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  toggleTaskCompletion: (taskId: string) => Promise<void>;
  duplicateTask: (taskId: string) => Promise<void>;
  addCategory: (data: Partial<Category>) => Promise<void>;
  updateCategory: (catId: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (catId: string) => Promise<void>;
  logHabit: (taskId: string, date: string, completed: boolean, value?: number, note?: string) => Promise<void>;
  logProgress: (categoryId: string, value: number, date?: string, note?: string, taskId?: string) => Promise<void>;
  addMentalCheckIn: (checkIn: Partial<MentalCheckIn>) => Promise<void>;
  deleteMentalCheckIn: (id: string) => Promise<void>;
  
  // Bulk operations
  bulkUpdateTasks: (taskIds: string[], updates: Partial<Task>, description?: string) => Promise<void>;
  bulkDeleteTasks: (taskIds: string[]) => Promise<void>;
  bulkSetDate: (taskIds: string[], date?: string) => Promise<void>;
  bulkClearDateTime: (taskIds: string[], timeOnly?: boolean) => Promise<void>;
  saveCurrentOrderAsManual: (orderedTasks: Task[], description?: string) => Promise<void>;

  // Undo / Redo
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  canUndo: boolean;
  canRedo: boolean;
  nextUndoDescription: string;
  nextRedoDescription: string;
  undoToast: UndoToastState | null;
  clearUndoToast: () => void;

  // Auth & Cloud
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  triggerTestNotification: () => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  importAppData: (data: any) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEYS = {
  CATEGORIES: 'focusflow_categories_caps_v3',
  TASKS: 'focusflow_tasks_caps_v3',
  HABIT_LOGS: 'focusflow_habit_logs_caps_v3',
  METRICS: 'focusflow_metrics_caps_v3',
  MENTAL_CHECKINS: 'focusflow_mental_checkins_v1',
  NOTIFICATIONS: 'focusflow_notifications_v1',
  THEME: 'focusflow_theme_mode_v1',
  HISTORY: 'tempo_undo_history_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'local'>('local');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  // Core Data States with Automatic Migration
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      const parsed: Category[] = saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
      return parsed.map((cat) => ({
        ...cat,
        monthlyTaskGoal: cat.monthlyTaskGoal ?? 20,
      }));
    } catch {
      return DEFAULT_CATEGORIES;
    }
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
      const parsed: Task[] = saved ? JSON.parse(saved) : DEFAULT_TASKS;
      // Migrate habit tasks to reminders while preserving all completedAt, dates, logs
      return parsed.map((t) => {
        if ((t.itemType as any) === 'habit') {
          return { ...t, itemType: 'reminder' as ItemType };
        }
        return t;
      });
    } catch {
      return DEFAULT_TASKS;
    }
  });

  const [habitLogs, setHabitLogs] = useState<HabitLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HABIT_LOGS);
      return saved ? JSON.parse(saved) : generateDefaultHabitLogs();
    } catch {
      return generateDefaultHabitLogs();
    }
  });

  const [progressMetrics, setProgressMetrics] = useState<ProgressMetric[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.METRICS);
      return saved ? JSON.parse(saved) : generateDefaultProgressMetrics();
    } catch {
      return generateDefaultProgressMetrics();
    }
  });

  const [mentalCheckIns, setMentalCheckIns] = useState<MentalCheckIn[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MENTAL_CHECKINS);
      return saved ? JSON.parse(saved) : DEFAULT_MENTAL_CHECKINS;
    } catch {
      return DEFAULT_MENTAL_CHECKINS;
    }
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Undo / Redo Stacks (persisted across reloads, max 100 entries)
  const [undoStack, setUndoStack] = useState<HistoryStep[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.undo)) return parsed.undo.slice(-100);
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [redoStack, setRedoStack] = useState<HistoryStep[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.redo)) return parsed.redo.slice(-100);
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [undoToast, setUndoToast] = useState<UndoToastState | null>(null);
  const undoToastTimerRef = useRef<any>(null);

  const clearUndoToast = useCallback(() => {
    if (undoToastTimerRef.current) {
      clearTimeout(undoToastTimerRef.current);
      undoToastTimerRef.current = null;
    }
    setUndoToast(null);
  }, []);

  const triggerToast = useCallback(
    (message: string, actionLabel = 'Undo', onAction?: () => void) => {
      clearUndoToast();
      const id = 'toast_' + Date.now();
      setUndoToast({
        id,
        message,
        actionLabel,
        onAction,
      });
      undoToastTimerRef.current = setTimeout(() => {
        setUndoToast(null);
      }, 5000);
    },
    [clearUndoToast]
  );

  // Persist history stacks
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.HISTORY,
        JSON.stringify({
          undo: undoStack.slice(-100),
          redo: redoStack.slice(-100),
        })
      );
    } catch (e) {
      console.warn('History storage limit', e);
    }
  }, [undoStack, redoStack]);

  // Push new history step
  const pushHistory = useCallback(
    (
      description: string,
      tasksBefore: Task[],
      tasksAfter: Task[],
      categoriesBefore?: Category[],
      categoriesAfter?: Category[]
    ) => {
      const step: HistoryStep = {
        id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        description,
        timestamp: Date.now(),
        tasksBefore,
        tasksAfter,
        categoriesBefore,
        categoriesAfter,
      };

      setUndoStack((prev) => [...prev.slice(-99), step]);
      setRedoStack([]); // New action clears redo stack
    },
    []
  );

  // Core Undo Execution
  const undo = useCallback(async () => {
    if (undoStack.length === 0) return;
    const lastStep = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev.slice(-99), lastStep]);

    // Apply tasksBefore & categoriesBefore
    setTasks(lastStep.tasksBefore);
    if (!user) {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(lastStep.tasksBefore));
    } else {
      try {
        const batch = writeBatch(db);
        lastStep.tasksBefore.forEach((t) => {
          batch.set(doc(db, 'tasks', t.id), t);
        });
        await batch.commit();
      } catch (err) {
        console.error('Error undoing tasks to firestore', err);
      }
    }

    if (lastStep.categoriesBefore) {
      setCategories(lastStep.categoriesBefore);
      if (!user) {
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(lastStep.categoriesBefore));
      }
    }

    triggerToast(`Undone: ${lastStep.description}`, 'Redo', () => {
      redo();
    });
  }, [undoStack, user, triggerToast]);

  // Core Redo Execution
  const redo = useCallback(async () => {
    if (redoStack.length === 0) return;
    const nextStep = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev.slice(-99), nextStep]);

    // Apply tasksAfter & categoriesAfter
    setTasks(nextStep.tasksAfter);
    if (!user) {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(nextStep.tasksAfter));
    } else {
      try {
        const batch = writeBatch(db);
        nextStep.tasksAfter.forEach((t) => {
          batch.set(doc(db, 'tasks', t.id), t);
        });
        await batch.commit();
      } catch (err) {
        console.error('Error redoing tasks to firestore', err);
      }
    }

    if (nextStep.categoriesAfter) {
      setCategories(nextStep.categoriesAfter);
      if (!user) {
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(nextStep.categoriesAfter));
      }
    }

    triggerToast(`Redone: ${nextStep.description}`, 'Undo', () => {
      undo();
    });
  }, [redoStack, user, triggerToast]);

  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;
  const nextUndoDescription = undoStack[undoStack.length - 1]?.description || '';
  const nextRedoDescription = redoStack[redoStack.length - 1]?.description || '';

  // Keyboard shortcut handler for Undo (Cmd+Z / Ctrl+Z) and Redo (Cmd+Shift+Z / Cmd+Y / Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in an input, textarea, or contentEditable element
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable)
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (!isCmdOrCtrl) return;

      if (e.key === 'z' || e.key === 'Z') {
        if (e.shiftKey) {
          // Redo
          e.preventDefault();
          redo();
        } else {
          // Undo
          e.preventDefault();
          undo();
        }
      } else if (e.key === 'y' || e.key === 'Y') {
        // Redo (Windows / Linux standard Ctrl+Y)
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Electron IPC bridge listener
  useEffect(() => {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI) {
      const unsubUndo = electronAPI.onUndo(() => {
        const activeEl = document.activeElement;
        if (
          activeEl &&
          (activeEl.tagName === 'INPUT' ||
            activeEl.tagName === 'TEXTAREA' ||
            (activeEl as HTMLElement).isContentEditable)
        ) {
          return;
        }
        undo();
      });

      const unsubRedo = electronAPI.onRedo(() => {
        const activeEl = document.activeElement;
        if (
          activeEl &&
          (activeEl.tagName === 'INPUT' ||
            activeEl.tagName === 'TEXTAREA' ||
            (activeEl as HTMLElement).isContentEditable)
        ) {
          return;
        }
        redo();
      });

      return () => {
        if (typeof unsubUndo === 'function') unsubUndo();
        if (typeof unsubRedo === 'function') unsubRedo();
      };
    }
  }, [undo, redo]);

  // UI Navigation State
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem(STORAGE_KEYS.THEME) as ThemeMode) || 'dark';
  });

  // Modals state
  const [modalState, setModalState] = useState<ModalState>({
    isTaskOpen: false,
    editingTask: null,
    isCategoryOpen: false,
    editingCategory: null,
    isProgressOpen: false,
    isNotificationCenterOpen: false,
    isMentalCheckInOpen: false,
    isLegendOpen: false,
    isGuideOpen: false,
  });

  // Theme application
  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else if (newTheme === 'light') {
      root.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, []);

  useEffect(() => {
    setTheme(theme);
  }, [theme, setTheme]);

  // Persist locally
  useEffect(() => {
    if (!user) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    }
  }, [categories, user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    }
  }, [tasks, user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem(STORAGE_KEYS.HABIT_LOGS, JSON.stringify(habitLogs));
    }
  }, [habitLogs, user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem(STORAGE_KEYS.METRICS, JSON.stringify(progressMetrics));
    }
  }, [progressMetrics, user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem(STORAGE_KEYS.MENTAL_CHECKINS, JSON.stringify(mentalCheckIns));
    }
  }, [mentalCheckIns, user]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  // Push notifications listener
  useEffect(() => {
    const unsub = notificationService.subscribe((newItem) => {
      setNotifications((prev) => [newItem, ...prev.slice(0, 49)]);
    });
    return unsub;
  }, []);

  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);

      if (currentUser) {
        setSyncStatus('syncing');
        // Initial setup for categories if none exist
        try {
          const catRef = collection(db, 'categories');
          const catSnap = await onSnapshot(query(catRef, where('userId', '==', currentUser.uid)), (snap) => {
            if (snap.empty) {
              const batch = writeBatch(db);
              DEFAULT_CATEGORIES.forEach((cat) => {
                const docRef = doc(db, 'categories', cat.id);
                batch.set(docRef, { ...cat, userId: currentUser.uid });
              });
              batch.commit();
            } else {
              const userCats = snap.docs.map((d) => d.data() as Category);
              setCategories(userCats);
            }
          });

          // Sync tasks
          const taskRef = collection(db, 'tasks');
          onSnapshot(query(taskRef, where('userId', '==', currentUser.uid)), (snap) => {
            const userTasks = snap.docs.map((d) => {
              const data = d.data() as Task;
              if ((data.itemType as any) === 'habit') {
                return { ...data, itemType: 'reminder' as ItemType };
              }
              return data;
            });
            setTasks(userTasks);
            setSyncStatus('synced');
            setLastSyncedAt(new Date());
          });

          return () => {
            catSnap();
          };
        } catch (e) {
          console.error(e);
          setSyncStatus('offline');
        }
      } else {
        setSyncStatus('local');
      }
    });

    return () => unsubscribe();
  }, []);

  // Check scheduled tasks for reminders every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;
      const todayDateStr = now.toISOString().split('T')[0];

      tasks.forEach((task) => {
        if (
          !task.completed &&
          task.reminderEnabled &&
          task.dueDate === todayDateStr &&
          task.dueTime === currentTimeStr
        ) {
          const alreadyNotified = notifications.some(
            (n) => n.taskId === task.id && n.timestamp.startsWith(todayDateStr)
          );
          if (!alreadyNotified) {
            notificationService.notify(
              `Reminder: ${task.title}`,
              task.description || `Scheduled for today at ${task.dueTime}.`,
              task.id
            );
          }
        }
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [tasks, notifications]);

  // --- CRUD ACTIONS ---

  // 1. ADD TASK (Empty date, time, duration by default; push enabled only if date & time are set)
  const addTask = async (data: Partial<Task>) => {
    const uid = user ? user.uid : 'local';
    const newId = 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);

    // Push notification only valid if both date and time exist
    const hasDateTime = Boolean(data.dueDate && data.dueTime);
    const reminderEnabled = hasDateTime ? (data.reminderEnabled ?? true) : false;

    const newTask: Task = {
      id: newId,
      userId: uid,
      categoryId: data.categoryId || (categories[0]?.id ?? 'cat_COD'),
      title: data.title || 'Untitled Item',
      description: data.description || '',
      itemType: (data.itemType === ('habit' as any) ? 'reminder' : data.itemType) || 'reminder',
      status: data.status || 'todo',
      priority: data.priority || 'medium',
      dueDate: data.dueDate || undefined, // NO default date!
      dueTime: data.dueTime || undefined, // NO default time!
      duration: data.duration !== undefined ? data.duration : undefined, // NO default duration!
      frequency: data.frequency || 'once',
      targetValue: data.targetValue,
      currentValue: data.currentValue || 0,
      unit: data.unit,
      reminderEnabled,
      streakCount: data.streakCount || 0,
      bestStreak: data.bestStreak || 0,
      order: data.order !== undefined ? data.order : 0,
      completed: data.status === 'completed' || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const prevTasks = [...tasks];
    const nextTasks = [newTask, ...prevTasks];

    if (user) {
      try {
        await setDoc(doc(db, 'tasks', newId), newTask);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `tasks/${newId}`);
      }
    } else {
      setTasks(nextTasks);
    }

    pushHistory(`Created "${newTask.title}"`, prevTasks, nextTasks);

    if (newTask.reminderEnabled && newTask.dueDate && newTask.dueTime) {
      notificationService.notify(
        'Reminder Scheduled',
        `"${newTask.title}" is set for ${newTask.dueDate} ${newTask.dueTime}`.trim()
      );
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>, customHistoryDesc?: string) => {
    const timestamp = new Date().toISOString();
    const cleanUpdates = { ...updates, updatedAt: timestamp };

    // Clean habit type if passed
    if ((cleanUpdates.itemType as any) === 'habit') {
      cleanUpdates.itemType = 'reminder';
    }

    // Disable reminder if date or time cleared
    if (cleanUpdates.dueDate === '' || cleanUpdates.dueDate === undefined || cleanUpdates.dueTime === '' || cleanUpdates.dueTime === undefined) {
      if (cleanUpdates.reminderEnabled) {
        cleanUpdates.reminderEnabled = false;
      }
    }

    const prevTasks = [...tasks];
    const nextTasks = prevTasks.map((t) => (t.id === taskId ? { ...t, ...cleanUpdates } : t));

    if (user) {
      try {
        await updateDoc(doc(db, 'tasks', taskId), cleanUpdates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `tasks/${taskId}`);
      }
    } else {
      setTasks(nextTasks);
    }

    const desc = customHistoryDesc || `Updated "${prevTasks.find((t) => t.id === taskId)?.title || 'task'}"`;
    pushHistory(desc, prevTasks, nextTasks);
  };

  const reorderTasks = async (
    updates: { id: string; status?: TaskStatus; order: number; completed?: boolean; dueDate?: string; dueTime?: string }[],
    customDesc = 'Reordered tasks'
  ) => {
    const timestamp = new Date().toISOString();
    const updateMap = new Map(updates.map((u) => [u.id, u]));

    const prevTasks = [...tasks];
    const nextTasks = prevTasks.map((t) => {
      const u = updateMap.get(t.id);
      if (u) {
        const nextCompleted = u.completed !== undefined ? u.completed : t.completed;
        return {
          ...t,
          ...(u.status !== undefined ? { status: u.status } : {}),
          ...(u.order !== undefined ? { order: u.order } : {}),
          ...(u.dueDate !== undefined ? { dueDate: u.dueDate || undefined } : {}),
          ...(u.dueTime !== undefined ? { dueTime: u.dueTime || undefined } : {}),
          completed: nextCompleted,
          updatedAt: timestamp,
        };
      }
      return t;
    });

    setTasks(nextTasks);

    if (user) {
      try {
        const batch = writeBatch(db);
        updates.forEach((u) => {
          const docRef = doc(db, 'tasks', u.id);
          const fields: Record<string, any> = {
            order: u.order,
            updatedAt: timestamp,
          };
          if (u.status !== undefined) fields.status = u.status;
          if (u.completed !== undefined) fields.completed = u.completed;
          if (u.dueDate !== undefined) fields.dueDate = u.dueDate || null;
          if (u.dueTime !== undefined) fields.dueTime = u.dueTime || null;
          batch.update(docRef, fields);
        });
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, 'tasks/batch');
      }
    }

    pushHistory(customDesc, prevTasks, nextTasks);
  };

  const deleteTask = async (taskId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;

    const prevTasks = [...tasks];
    const nextTasks = prevTasks.filter((t) => t.id !== taskId);

    if (user) {
      try {
        await deleteDoc(doc(db, 'tasks', taskId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `tasks/${taskId}`);
      }
    } else {
      setTasks(nextTasks);
    }

    pushHistory(`Deleted "${target.title}"`, prevTasks, nextTasks);
    triggerToast(`Deleted "${target.title}"`, 'Undo', () => {
      undo();
    });
  };

  const duplicateTask = async (taskId: string) => {
    const original = tasks.find((t) => t.id === taskId);
    if (!original) return;

    await addTask({
      ...original,
      title: `${original.title} (Copy)`,
      order: (original.order ?? 0) + 1,
      completed: false,
      completedAt: undefined,
    });
  };

  const toggleTaskCompletion = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const nextCompleted = !task.completed;
    const nowStr = new Date().toISOString().split('T')[0];

    if (nextCompleted) {
      sounds.playCheck();
      if (task.itemType === 'goal' || (task.streakCount && task.streakCount > 5)) {
        sounds.playCelebration();
      }
    }

    const prevTasks = [...tasks];
    const nextTasks = prevTasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          completed: nextCompleted,
          status: (nextCompleted ? 'completed' : 'todo') as TaskStatus,
          completedAt: nextCompleted ? nowStr : undefined,
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    });

    setTasks(nextTasks);

    if (user) {
      try {
        await updateDoc(doc(db, 'tasks', taskId), {
          completed: nextCompleted,
          status: nextCompleted ? 'completed' : 'todo',
          completedAt: nextCompleted ? nowStr : null,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `tasks/${taskId}`);
      }
    }

    const desc = nextCompleted ? `Completed "${task.title}"` : `Reopened "${task.title}"`;
    pushHistory(desc, prevTasks, nextTasks);
  };

  // Bulk Operations (Atomic 1-step undo)
  const bulkUpdateTasks = async (taskIds: string[], updates: Partial<Task>, description?: string) => {
    if (taskIds.length === 0) return;
    const timestamp = new Date().toISOString();
    const idSet = new Set(taskIds);

    const prevTasks = [...tasks];
    const nextTasks = prevTasks.map((t) => {
      if (idSet.has(t.id)) {
        return { ...t, ...updates, updatedAt: timestamp };
      }
      return t;
    });

    setTasks(nextTasks);

    if (user) {
      try {
        const batch = writeBatch(db);
        taskIds.forEach((id) => {
          batch.update(doc(db, 'tasks', id), { ...updates, updatedAt: timestamp });
        });
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, 'tasks/bulk');
      }
    }

    const desc = description || `Updated ${taskIds.length} tasks`;
    pushHistory(desc, prevTasks, nextTasks);
  };

  const bulkDeleteTasks = async (taskIds: string[]) => {
    if (taskIds.length === 0) return;
    const idSet = new Set(taskIds);
    const count = taskIds.length;

    const prevTasks = [...tasks];
    const nextTasks = prevTasks.filter((t) => !idSet.has(t.id));

    setTasks(nextTasks);

    if (user) {
      try {
        const batch = writeBatch(db);
        taskIds.forEach((id) => {
          batch.delete(doc(db, 'tasks', id));
        });
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, 'tasks/bulk');
      }
    }

    const desc = `Deleted ${count} task${count > 1 ? 's' : ''}`;
    pushHistory(desc, prevTasks, nextTasks);
    triggerToast(`Deleted ${count} task${count > 1 ? 's' : ''}`, 'Undo', () => {
      undo();
    });
  };

  const bulkSetDate = async (taskIds: string[], date?: string) => {
    await bulkUpdateTasks(
      taskIds,
      { dueDate: date || undefined },
      date ? `Moved ${taskIds.length} tasks to ${date}` : `Moved ${taskIds.length} tasks to Backlog`
    );
  };

  const bulkClearDateTime = async (taskIds: string[], timeOnly = false) => {
    if (timeOnly) {
      await bulkUpdateTasks(
        taskIds,
        { dueTime: undefined, reminderEnabled: false },
        `Cleared time for ${taskIds.length} tasks`
      );
    } else {
      await bulkUpdateTasks(
        taskIds,
        { dueDate: undefined, dueTime: undefined, reminderEnabled: false },
        `Moved ${taskIds.length} tasks to Backlog`
      );
    }
  };

  const saveCurrentOrderAsManual = async (orderedTasks: Task[], description = 'Saved manual order') => {
    const timestamp = new Date().toISOString();
    const prevTasks = [...tasks];
    const orderMap = new Map<string, number>();
    orderedTasks.forEach((t, idx) => orderMap.set(t.id, idx));

    const nextTasks = prevTasks.map((t) => {
      if (orderMap.has(t.id)) {
        return { ...t, order: orderMap.get(t.id)!, updatedAt: timestamp };
      }
      return t;
    });

    setTasks(nextTasks);

    if (user) {
      try {
        const batch = writeBatch(db);
        orderedTasks.forEach((t, idx) => {
          batch.update(doc(db, 'tasks', t.id), { order: idx, updatedAt: timestamp });
        });
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, 'tasks/saveOrder');
      }
    }

    pushHistory(description, prevTasks, nextTasks);
  };

  // Category Actions
  const addCategory = async (data: Partial<Category>) => {
    const uid = user ? user.uid : 'local';
    const newId = 'cat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const newCat: Category = {
      id: newId,
      userId: uid,
      name: data.name || 'New Category',
      type: data.type || 'custom',
      color: data.color || '#007AFF',
      icon: data.icon || 'Folder',
      monthlyTarget: data.monthlyTarget,
      monthlyTaskGoal: data.monthlyTaskGoal ?? 20,
      unit: data.unit,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const prevCats = [...categories];
    const nextCats = [...prevCats, newCat];

    if (user) {
      try {
        await setDoc(doc(db, 'categories', newId), newCat);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `categories/${newId}`);
      }
    } else {
      setCategories(nextCats);
    }

    pushHistory(`Added category "${newCat.name}"`, tasks, tasks, prevCats, nextCats);
  };

  const updateCategory = async (catId: string, updates: Partial<Category>) => {
    const cleanUpdates = { ...updates, updatedAt: new Date().toISOString() };
    const prevCats = [...categories];
    const nextCats = prevCats.map((c) => (c.id === catId ? { ...c, ...cleanUpdates } : c));

    if (user) {
      try {
        await updateDoc(doc(db, 'categories', catId), cleanUpdates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `categories/${catId}`);
      }
    } else {
      setCategories(nextCats);
    }

    const catName = prevCats.find((c) => c.id === catId)?.name || 'category';
    pushHistory(`Updated category "${catName}"`, tasks, tasks, prevCats, nextCats);
  };

  const deleteCategory = async (catId: string) => {
    if (categories.length <= 1) {
      alert('You must keep at least one category.');
      return;
    }

    const prevCats = [...categories];
    const catToDelete = prevCats.find((c) => c.id === catId);
    const nextCats = prevCats.filter((c) => c.id !== catId);

    if (user) {
      try {
        await deleteDoc(doc(db, 'categories', catId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `categories/${catId}`);
      }
    } else {
      setCategories(nextCats);
    }

    if (selectedCategory === catId) {
      setSelectedCategory('all');
    }

    pushHistory(`Deleted category "${catToDelete?.name || ''}"`, tasks, tasks, prevCats, nextCats);
  };

  const logHabit = async (taskId: string, date: string, completed: boolean, value = 1, note = '') => {
    const uid = user ? user.uid : 'local';
    const logId = `log_${taskId}_${date}`;
    const newLog: HabitLog = {
      id: logId,
      userId: uid,
      taskId,
      date,
      completed,
      value,
      note,
      createdAt: new Date().toISOString(),
    };

    if (user) {
      try {
        await setDoc(doc(db, 'habitLogs', logId), newLog);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `habitLogs/${logId}`);
      }
    } else {
      setHabitLogs((prev) => [...prev.filter((l) => l.id !== logId), newLog]);
    }
  };

  const logProgress = async (categoryId: string, value: number, date?: string, note = '', taskId?: string) => {
    const uid = user ? user.uid : 'local';
    const newId = 'metric_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const newMetric: ProgressMetric = {
      id: newId,
      userId: uid,
      categoryId,
      taskId,
      date: date || new Date().toISOString().split('T')[0],
      value,
      note,
      createdAt: new Date().toISOString(),
    };

    if (user) {
      try {
        await setDoc(doc(db, 'progressMetrics', newId), newMetric);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `progressMetrics/${newId}`);
      }
    } else {
      setProgressMetrics((prev) => [...prev, newMetric]);
    }

    sounds.playCheck();
  };

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'auth/signin');
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      setSyncStatus('local');
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'auth/signout');
    }
  };

  const triggerTestNotification = () => {
    notificationService.notify(
      'Test Alert from Tempo',
      'Push notification dispatch verified working seamlessly!'
    );
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const importAppData = async (imported: any) => {
    const payload = imported.data || imported;
    if (Array.isArray(payload.categories) && payload.categories.length > 0) {
      setCategories(payload.categories);
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(payload.categories));
    }
    if (Array.isArray(payload.tasks)) {
      const migrated = payload.tasks.map((t: Task) => {
        if ((t.itemType as any) === 'habit') {
          return { ...t, itemType: 'reminder' as ItemType };
        }
        return t;
      });
      setTasks(migrated);
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(migrated));
    }
    if (Array.isArray(payload.habitLogs)) {
      setHabitLogs(payload.habitLogs);
      localStorage.setItem(STORAGE_KEYS.HABIT_LOGS, JSON.stringify(payload.habitLogs));
    }
    if (Array.isArray(payload.progressMetrics)) {
      setProgressMetrics(payload.progressMetrics);
      localStorage.setItem(STORAGE_KEYS.METRICS, JSON.stringify(payload.progressMetrics));
    }
    if (Array.isArray(payload.mentalCheckIns)) {
      setMentalCheckIns(payload.mentalCheckIns);
      localStorage.setItem(STORAGE_KEYS.MENTAL_CHECKINS, JSON.stringify(payload.mentalCheckIns));
    }
    if (payload.pomodoroSettings) {
      localStorage.setItem('tempo_pomodoro_settings', JSON.stringify(payload.pomodoroSettings));
    }
    if (payload.theme) {
      setTheme(payload.theme);
    }
    sounds.playCelebration();
  };

  // Modal handlers
  const openTaskModal = (
    task?: Task | null,
    defaultCategory?: string,
    defaultType?: ItemType,
    defaultStatus?: TaskStatus,
    defaultDueDate?: string,
    defaultDueTime?: string
  ) => {
    setModalState((prev) => ({
      ...prev,
      isTaskOpen: true,
      editingTask: task || null,
      defaultCategory: defaultCategory !== undefined ? defaultCategory : (selectedCategory !== 'all' ? selectedCategory : undefined),
      defaultType: defaultType === ('habit' as any) ? 'reminder' : defaultType,
      defaultStatus,
      defaultDueDate,
      defaultDueTime,
    }));
  };

  const closeTaskModal = () => {
    setModalState((prev) => ({ ...prev, isTaskOpen: false, editingTask: null }));
  };

  const openCategoryModal = (cat?: Category | null) => {
    setModalState((prev) => ({ ...prev, isCategoryOpen: true, editingCategory: cat || null }));
  };

  const closeCategoryModal = () => {
    setModalState((prev) => ({ ...prev, isCategoryOpen: false, editingCategory: null }));
  };

  const openProgressModal = (categoryId?: string) => {
    setModalState((prev) => ({
      ...prev,
      isProgressOpen: true,
      progressCategory: categoryId || (selectedCategory !== 'all' ? selectedCategory : undefined),
    }));
  };

  const closeProgressModal = () => {
    setModalState((prev) => ({ ...prev, isProgressOpen: false, progressCategory: undefined }));
  };

  const openNotificationCenter = () => {
    setModalState((prev) => ({ ...prev, isNotificationCenterOpen: true }));
  };

  const closeNotificationCenter = () => {
    setModalState((prev) => ({ ...prev, isNotificationCenterOpen: false }));
  };

  const openMentalModal = () => {
    setModalState((prev) => ({ ...prev, isMentalCheckInOpen: true }));
  };

  const closeMentalModal = () => {
    setModalState((prev) => ({ ...prev, isMentalCheckInOpen: false }));
  };

  const openLegendModal = () => {
    setModalState((prev) => ({ ...prev, isLegendOpen: true }));
  };

  const closeLegendModal = () => {
    setModalState((prev) => ({ ...prev, isLegendOpen: false }));
  };

  const openGuideModal = () => {
    setModalState((prev) => ({ ...prev, isGuideOpen: true }));
  };

  const closeGuideModal = () => {
    setModalState((prev) => ({ ...prev, isGuideOpen: false }));
  };

  const addMentalCheckIn = async (data: Partial<MentalCheckIn>) => {
    const uid = user ? user.uid : 'local';
    const newId = 'mcheck_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const newCheckIn: MentalCheckIn = {
      id: newId,
      userId: uid,
      date: data.date || new Date().toISOString().split('T')[0],
      situation: data.situation || '',
      emotion: data.emotion || '',
      voteBefore: data.voteBefore,
      distortion1: data.distortion1,
      distortion2: data.distortion2,
      distortion3: data.distortion3,
      afterThought: data.afterThought,
      voteAfter: data.voteAfter || 50,
      createdAt: new Date().toISOString(),
    };

    if (user) {
      try {
        await setDoc(doc(db, 'mentalCheckIns', newId), newCheckIn);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `mentalCheckIns/${newId}`);
      }
    } else {
      setMentalCheckIns((prev) => [newCheckIn, ...prev]);
    }

    sounds.playCelebration();
  };

  const deleteMentalCheckIn = async (id: string) => {
    if (user) {
      try {
        await deleteDoc(doc(db, 'mentalCheckIns', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `mentalCheckIns/${id}`);
      }
    } else {
      setMentalCheckIns((prev) => prev.filter((m) => m.id !== id));
    }
  };

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthLoading,
        categories,
        tasks,
        habitLogs,
        progressMetrics,
        mentalCheckIns,
        notifications,
        unreadNotificationCount,
        viewMode,
        selectedCategory,
        theme,
        syncStatus,
        lastSyncedAt,
        setViewMode,
        setSelectedCategory,
        setTheme,
        modalState,
        openTaskModal,
        closeTaskModal,
        openCategoryModal,
        closeCategoryModal,
        openProgressModal,
        closeProgressModal,
        openNotificationCenter,
        closeNotificationCenter,
        openMentalModal,
        closeMentalModal,
        openLegendModal,
        closeLegendModal,
        openGuideModal,
        closeGuideModal,
        addTask,
        updateTask,
        reorderTasks,
        deleteTask,
        toggleTaskCompletion,
        duplicateTask,
        addCategory,
        updateCategory,
        deleteCategory,
        logHabit,
        logProgress,
        addMentalCheckIn,
        deleteMentalCheckIn,
        bulkUpdateTasks,
        bulkDeleteTasks,
        bulkSetDate,
        bulkClearDateTime,
        saveCurrentOrderAsManual,
        undo,
        redo,
        canUndo,
        canRedo,
        nextUndoDescription,
        nextRedoDescription,
        undoToast,
        clearUndoToast,
        signInWithGoogle,
        signOutUser,
        triggerTestNotification,
        markNotificationRead,
        clearNotifications,
        importAppData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
