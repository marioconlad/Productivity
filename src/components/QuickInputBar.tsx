import React, { useState, useRef, useMemo } from 'react';
import {
  Plus,
  Calendar,
  Clock,
  ChevronDown,
  Bell,
  Target,
  Sparkles,
  Tag,
  AlertCircle,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CategoryIcon } from './CategoryIcon';
import { ItemType, Priority } from '../types';
import { parseNaturalLanguageTask } from '../lib/nlpParser';

interface QuickInputBarProps {
  defaultCategoryId?: string;
}

export const QuickInputBar: React.FC<QuickInputBarProps> = ({ defaultCategoryId }) => {
  const { categories, addTask, selectedCategory } = useApp();
  const [inputValue, setInputValue] = useState('');
  const [manualCategoryId, setManualCategoryId] = useState<string>(
    defaultCategoryId || (selectedCategory !== 'all' ? selectedCategory : (categories[0]?.id || ''))
  );
  const [manualItemType, setManualItemType] = useState<ItemType>('reminder');
  const [manualDueDate, setManualDueDate] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse natural language from current text
  const parsed = useMemo(() => {
    return parseNaturalLanguageTask(inputValue, categories);
  }, [inputValue, categories]);

  // Effective values: NO DEFAULT DATE OR TIME! Unset is undefined (unscheduled / Backlog)
  const effectiveCategoryId = parsed.categoryId || manualCategoryId || categories[0]?.id;
  const effectiveItemType: ItemType = (parsed.itemType as any) === 'habit' ? 'reminder' : (parsed.itemType || manualItemType);
  const effectiveDueDate = parsed.dueDate || manualDueDate || undefined;
  const effectiveDueTime = parsed.dueTime || undefined;
  const effectivePriority = parsed.priority || 'medium';

  const activeCategory = categories.find((c) => c.id === effectiveCategoryId) || categories[0];
  const hasSmartTokens = parsed.tokens.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const titleToUse = parsed.cleanTitle.trim() || inputValue.trim();
    if (!titleToUse || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await addTask({
        title: titleToUse,
        categoryId: effectiveCategoryId,
        itemType: effectiveItemType,
        priority: effectivePriority,
        status: 'todo',
        dueDate: effectiveDueDate,
        dueTime: effectiveDueDate ? effectiveDueTime : undefined,
        reminderEnabled: Boolean(effectiveDueDate && effectiveDueTime),
        frequency: 'once',
      });

      // Reset input fields
      setInputValue('');
      setManualDueDate('');
      setShowDatePicker(false);
      inputRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      <form
        onSubmit={handleSubmit}
        className="apple-subpanel rounded-[14px] p-2 sm:p-2.5 transition-all focus-within:ring-2 focus-within:ring-[#0A84FF]/30"
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Main Text Input */}
          <div className="flex-1 flex items-center gap-2.5 px-2">
            <div className="w-5 h-5 rounded-full border border-dashed border-[rgba(60,60,67,0.3)] dark:border-[rgba(255,255,255,0.3)] flex items-center justify-center shrink-0">
              <Plus className="w-3 h-3 text-[#8E8E93]" />
            </div>
            <input
              ref={inputRef}
              type="text"
              required
              placeholder="Add a task, e.g. Finish report tomorrow #cod or Workout #sport"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full bg-transparent text-xs sm:text-sm font-normal text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-hidden"
            />
          </div>

          {/* Controls: Category Selector & Type & Add Button */}
          <div className="flex items-center justify-between sm:justify-end gap-1.5 pt-1 sm:pt-0 border-t sm:border-t-0 border-[rgba(60,60,67,0.08)] dark:border-[rgba(255,255,255,0.08)]">
            
            {/* Category Picker */}
            <div className="relative">
              <select
                value={effectiveCategoryId}
                onChange={(e) => setManualCategoryId(e.target.value)}
                className="appearance-none pl-7 pr-6 py-1 rounded-[8px] bg-white/70 dark:bg-[rgba(255,255,255,0.08)] text-xs font-medium text-[var(--text-primary)] hover:bg-white/90 dark:hover:bg-[rgba(255,255,255,0.14)] border border-[rgba(60,60,67,0.12)] dark:border-[rgba(255,255,255,0.12)] transition cursor-pointer focus:outline-hidden"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-white dark:bg-[#2C2C2E] text-[var(--text-primary)]">
                    {c.name}
                  </option>
                ))}
              </select>
              <div
                className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: activeCategory?.color }}
              >
                <CategoryIcon name={activeCategory?.icon || activeCategory?.type || 'Folder'} size={12} />
              </div>
              <ChevronDown className="w-3 h-3 text-[var(--text-secondary)] absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-current" />
            </div>

            {/* Type Picker: Reminder vs Goal only */}
            <div className="relative">
              <select
                value={effectiveItemType}
                onChange={(e) => setManualItemType(e.target.value as ItemType)}
                className="appearance-none pl-6 pr-5 py-1 rounded-[8px] bg-white/70 dark:bg-[rgba(255,255,255,0.08)] text-xs font-medium text-[var(--text-primary)] hover:bg-white/90 dark:hover:bg-[rgba(255,255,255,0.14)] border border-[rgba(60,60,67,0.12)] dark:border-[rgba(255,255,255,0.12)] transition cursor-pointer focus:outline-hidden capitalize"
              >
                <option value="reminder" className="bg-white dark:bg-[#2C2C2E] text-[var(--text-primary)]">Reminder</option>
                <option value="goal" className="bg-white dark:bg-[#2C2C2E] text-[var(--text-primary)]">Goal</option>
              </select>
              <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]">
                {effectiveItemType === 'goal' ? (
                  <Target className="w-3 h-3 text-emerald-500" />
                ) : (
                  <Bell className="w-3 h-3 text-[#0A84FF]" />
                )}
              </div>
              <ChevronDown className="w-3 h-3 text-[var(--text-secondary)] absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none stroke-current" />
            </div>

            {/* Optional Due Date Toggle */}
            <div className="relative">
              {showDatePicker ? (
                <div className="flex items-center gap-1">
                  <input
                    type="date"
                    value={manualDueDate}
                    onChange={(e) => setManualDueDate(e.target.value)}
                    autoFocus
                    className="px-2 py-1 rounded-[8px] bg-white/80 dark:bg-[rgba(255,255,255,0.08)] text-xs text-[var(--text-primary)] border border-[rgba(60,60,67,0.12)] dark:border-[rgba(255,255,255,0.12)] focus:outline-hidden"
                  />
                  {manualDueDate && (
                    <button
                      type="button"
                      onClick={() => {
                        setManualDueDate('');
                        setShowDatePicker(false);
                      }}
                      title="Clear date (unscheduled)"
                      className="p-1 text-[var(--text-secondary)] hover:text-red-500 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDatePicker(true)}
                  title={effectiveDueDate ? `Date: ${effectiveDueDate}` : 'Add date (empty = Backlog)'}
                  className={`p-1.5 rounded-[8px] hover:bg-white/60 dark:hover:bg-white/[0.08] transition cursor-pointer ${
                    effectiveDueDate
                      ? 'text-[#0A84FF] bg-[rgba(10,132,255,0.1)]'
                      : 'text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-[#F5F5F7]'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Add Submit Button with System Blue Accent */}
            <button
              type="submit"
              disabled={!inputValue.trim() || isSubmitting}
              className="flex items-center gap-1 px-3 py-1 rounded-[8px] bg-[#0A84FF] hover:bg-[#0071E3] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium transition cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add</span>
            </button>
          </div>
        </div>
      </form>

      {/* Smart Detected Tokens Live Preview */}
      {hasSmartTokens && (
        <div className="flex items-center gap-2 px-1 text-xs text-zinc-600 dark:text-zinc-400 flex-wrap animate-fadeIn">
          <span className="flex items-center gap-1 font-semibold text-[11px] text-blue-600 dark:text-blue-400">
            <Sparkles className="w-3 h-3" />
            <span>Detected:</span>
          </span>

          {parsed.cleanTitle && parsed.cleanTitle !== inputValue && (
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Title: &ldquo;{parsed.cleanTitle}&rdquo;
            </span>
          )}

          {parsed.categoryName && (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: `${parsed.categoryColor || '#007AFF'}15`,
                color: parsed.categoryColor || '#007AFF',
              }}
            >
              <Tag className="w-2.5 h-2.5" />
              <span>{parsed.categoryName}</span>
            </span>
          )}

          {parsed.dueDateLabel && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-full">
              <Calendar className="w-2.5 h-2.5" />
              <span>{parsed.dueDateLabel}</span>
            </span>
          )}

          {parsed.dueTimeLabel && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full">
              <Clock className="w-2.5 h-2.5" />
              <span>{parsed.dueTimeLabel}</span>
            </span>
          )}

          {parsed.priority && (
            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 rounded-md">
              <AlertCircle className="w-2.5 h-2.5" />
              <span>{parsed.priority}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
};
