import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Bell, Target, HelpCircle, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ItemType, Priority, TaskStatus } from '../types';

export const TaskModal: React.FC = () => {
  const {
    modalState,
    closeTaskModal,
    categories,
    addTask,
    updateTask,
    openGuideModal,
  } = useApp();

  const {
    isTaskOpen,
    editingTask,
    defaultCategory,
    defaultType,
    defaultStatus,
    defaultDueDate,
    defaultDueTime,
  } = modalState;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [itemType, setItemType] = useState<ItemType>('reminder');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [duration, setDuration] = useState<string>('');
  const [targetValue, setTargetValue] = useState<string>('');
  const [currentValue, setCurrentValue] = useState<string>('0');
  const [unit, setUnit] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);

  // Form reset: completely empty defaults for date, time, duration
  const resetFormToDefaults = () => {
    setTitle('');
    setDescription('');
    setCategoryId(defaultCategory || categories[0]?.id || '');
    // Only 'reminder' or 'goal'
    setItemType(defaultType === ('habit' as any) ? 'reminder' : (defaultType || 'reminder'));
    setStatus(defaultStatus || 'todo');
    setPriority('medium');
    setDueDate(defaultDueDate || '');
    setDueTime(defaultDueTime || '');
    setDuration('');
    setTargetValue('');
    setCurrentValue('0');
    setUnit('');
    setReminderEnabled(false);
  };

  useEffect(() => {
    if (!isTaskOpen) return;

    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || '');
      setCategoryId(editingTask.categoryId);
      setItemType((editingTask.itemType as any) === 'habit' ? 'reminder' : editingTask.itemType);
      setStatus(editingTask.status);
      setPriority(editingTask.priority || 'medium');
      setDueDate(editingTask.dueDate || '');
      setDueTime(editingTask.dueTime || '');
      setDuration(editingTask.duration ? String(editingTask.duration) : '');
      setTargetValue(editingTask.targetValue ? String(editingTask.targetValue) : '');
      setCurrentValue(editingTask.currentValue ? String(editingTask.currentValue) : '0');
      setUnit(editingTask.unit || '');
      // Only keep reminder enabled if both dueDate and dueTime exist
      const hasBoth = Boolean(editingTask.dueDate && editingTask.dueTime);
      setReminderEnabled(hasBoth ? Boolean(editingTask.reminderEnabled) : false);
    } else {
      resetFormToDefaults();
    }
  }, [
    isTaskOpen,
    editingTask,
    defaultCategory,
    defaultType,
    defaultStatus,
    defaultDueDate,
    defaultDueTime,
    categories,
  ]);

  // When date is cleared, clear time and disable push notification
  const handleDateChange = (val: string) => {
    setDueDate(val);
    if (!val) {
      setDueTime('');
      setReminderEnabled(false);
    }
  };

  const handleTimeChange = (val: string) => {
    setDueTime(val);
    if (!val) {
      setReminderEnabled(false);
    }
  };

  const hasDateTime = Boolean(dueDate && dueTime);

  if (!isTaskOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const payload = {
      title: title.trim(),
      description: description.trim(),
      categoryId: categoryId || categories[0]?.id,
      itemType: (itemType as any) === 'habit' ? 'reminder' : itemType,
      status,
      priority,
      dueDate: dueDate || undefined, // undefined sends to Calendar Backlog (unscheduled)
      dueTime: dueDate && dueTime ? dueTime : undefined,
      duration: duration ? Number(duration) : undefined,
      targetValue: targetValue ? Number(targetValue) : undefined,
      currentValue: currentValue ? Number(currentValue) : 0,
      unit: unit.trim() || undefined,
      reminderEnabled: hasDateTime ? reminderEnabled : false,
    };

    if (editingTask) {
      await updateTask(editingTask.id, payload);
    } else {
      await addTask(payload);
    }

    resetFormToDefaults();
    closeTaskModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg apple-panel rounded-2xl shadow-2xl border border-white/60 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[rgba(60,60,67,0.12)] dark:border-[rgba(255,255,255,0.1)]">
          <h3 className="text-sm font-semibold text-[#1C1C1E] dark:text-[#F5F5F7]">
            {editingTask ? 'Edit Item' : 'New Item'}
          </h3>
          <button
            onClick={closeTaskModal}
            className="p-1 rounded-md text-[#6E6E73] hover:text-[#1C1C1E] dark:hover:text-[#F5F5F7] hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          
          {/* Segmented Type Picker: Reminder & Goal only (Habits removed) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-medium text-[#6E6E73] dark:text-[#A1A1A6] uppercase tracking-wider">
                Item Type
              </label>
              <button
                type="button"
                onClick={openGuideModal}
                className="text-[11px] font-medium text-[#0A84FF] hover:underline flex items-center gap-1 cursor-pointer transition"
              >
                <HelpCircle className="w-3 h-3" />
                <span>How to use Reminder & Goal?</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/10">
              {(['reminder', 'goal'] as ItemType[]).map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setItemType(t)}
                  className={`py-1.5 rounded-lg text-xs font-medium capitalize transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    itemType === t
                      ? 'bg-white dark:bg-white/20 text-[#1C1C1E] dark:text-[#F5F5F7] shadow-xs'
                      : 'text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#1C1C1E] dark:hover:text-[#F5F5F7]'
                  }`}
                >
                  {t === 'reminder' && <Bell className="w-3.5 h-3.5 text-[#0A84FF]" />}
                  {t === 'goal' && <Target className="w-3.5 h-3.5 text-emerald-500" />}
                  <span>{t}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-[#1C1C1E] dark:text-[#F5F5F7] mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              placeholder={
                itemType === 'goal'
                  ? 'e.g. Save $5,000 Emergency Fund'
                  : 'e.g. Review subscription bills'
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/70 dark:bg-black/20 border border-[rgba(60,60,67,0.15)] dark:border-white/10 focus:border-[#0A84FF] focus:outline-none text-sm text-[#1C1C1E] dark:text-[#F5F5F7] transition"
            />
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#1C1C1E] dark:text-[#F5F5F7] mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/70 dark:bg-black/20 border border-[rgba(60,60,67,0.15)] dark:border-white/10 focus:border-[#0A84FF] focus:outline-none text-sm text-[#1C1C1E] dark:text-[#F5F5F7] transition"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#1C1C1E] dark:text-[#F5F5F7] mb-1">
                Kanban Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 rounded-xl bg-white/70 dark:bg-black/20 border border-[rgba(60,60,67,0.15)] dark:border-white/10 focus:border-[#0A84FF] focus:outline-none text-sm text-[#1C1C1E] dark:text-[#F5F5F7] transition"
              >
                <option value="todo" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">To Do</option>
                <option value="in_progress" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">In Progress</option>
                <option value="completed" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">Completed</option>
              </select>
            </div>
          </div>

          {/* Goal-Specific Target Fields */}
          {itemType === 'goal' && (
            <div className="p-3.5 rounded-xl apple-subpanel space-y-3">
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                Goal Target Metrics
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-[#6E6E73] dark:text-[#A1A1A6] mb-1">
                    Target Value
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white/70 dark:bg-black/20 text-xs text-[#1C1C1E] dark:text-[#F5F5F7] border border-[rgba(60,60,67,0.15)] dark:border-white/10 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#6E6E73] dark:text-[#A1A1A6] mb-1">
                    Current Progress
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 1500"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white/70 dark:bg-black/20 text-xs text-[#1C1C1E] dark:text-[#F5F5F7] border border-[rgba(60,60,67,0.15)] dark:border-white/10 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#6E6E73] dark:text-[#A1A1A6] mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    placeholder="$, hrs, km"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white/70 dark:bg-black/20 text-xs text-[#1C1C1E] dark:text-[#F5F5F7] border border-[rgba(60,60,67,0.15)] dark:border-white/10 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Dates & Times (Optional, empty by default) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-[#1C1C1E] dark:text-[#F5F5F7] flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#0A84FF]" />
                  <span>Date (Optional)</span>
                </label>
                {dueDate && (
                  <button
                    type="button"
                    onClick={() => handleDateChange('')}
                    className="text-[10px] text-red-500 hover:underline cursor-pointer"
                  >
                    Clear (to Backlog)
                  </button>
                )}
              </div>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/70 dark:bg-black/20 border border-[rgba(60,60,67,0.15)] dark:border-white/10 focus:border-[#0A84FF] focus:outline-none text-sm text-[#1C1C1E] dark:text-[#F5F5F7] transition"
              />
              <p className="text-[10px] text-[#8E8E93] mt-1">
                Empty date = Backlog item.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-[#1C1C1E] dark:text-[#F5F5F7] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#0A84FF]" />
                  <span>Time (Optional)</span>
                </label>
                {dueTime && (
                  <button
                    type="button"
                    onClick={() => handleTimeChange('')}
                    className="text-[10px] text-red-500 hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <input
                type="time"
                disabled={!dueDate}
                value={dueTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl bg-white/70 dark:bg-black/20 border border-[rgba(60,60,67,0.15)] dark:border-white/10 focus:border-[#0A84FF] focus:outline-none text-sm text-[#1C1C1E] dark:text-[#F5F5F7] transition ${
                  !dueDate ? 'opacity-40 cursor-not-allowed' : ''
                }`}
              />
              <p className="text-[10px] text-[#8E8E93] mt-1">
                {!dueDate ? 'Set a date first to enable time.' : 'Optional label for timeline.'}
              </p>
            </div>
          </div>

          {/* Duration (Optional minutes) */}
          <div>
            <label className="block text-xs font-medium text-[#1C1C1E] dark:text-[#F5F5F7] mb-1">
              Estimated Duration (minutes, optional)
            </label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 45"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/70 dark:bg-black/20 border border-[rgba(60,60,67,0.15)] dark:border-white/10 focus:border-[#0A84FF] focus:outline-none text-sm text-[#1C1C1E] dark:text-[#F5F5F7] transition"
            />
          </div>

          {/* Push Notification Toggle (enabled ONLY when both date and time are set) */}
          <div className={`p-3 rounded-xl apple-subpanel transition-opacity ${hasDateTime ? 'opacity-100' : 'opacity-60'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Bell className={`w-4 h-4 ${hasDateTime ? 'text-[#0A84FF]' : 'text-[#8E8E93]'}`} />
                <div>
                  <p className="text-xs font-medium text-[#1C1C1E] dark:text-[#F5F5F7]">
                    Push Notification Alert
                  </p>
                  <p className="text-[11px] text-[#6E6E73] dark:text-[#A1A1A6]">
                    {hasDateTime ? 'Trigger device chime and alert when due' : 'Add a date and time to enable'}
                  </p>
                </div>
              </div>

              <label className={`relative inline-flex items-center ${hasDateTime ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                <input
                  type="checkbox"
                  disabled={!hasDateTime}
                  checked={reminderEnabled}
                  onChange={(e) => setReminderEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5.5 bg-black/15 dark:bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-[#0A84FF] peer-disabled:opacity-40" />
              </label>
            </div>
          </div>

          {/* Notes / Description */}
          <div>
            <label className="block text-xs font-medium text-[#1C1C1E] dark:text-[#F5F5F7] mb-1">
              Notes & Description
            </label>
            <textarea
              rows={2}
              placeholder="Add optional notes, links, or instructions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/70 dark:bg-black/20 border border-[rgba(60,60,67,0.15)] dark:border-white/10 focus:border-[#0A84FF] focus:outline-none text-sm text-[#1C1C1E] dark:text-[#F5F5F7] transition"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#0A84FF] hover:bg-[#0071E3] active:scale-98 text-white font-medium text-sm shadow-xs transition cursor-pointer"
            >
              {editingTask ? 'Save Changes' : 'Create Task'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
