import React, { useState, useEffect } from 'react';
import { X, PlusCircle, Calendar, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CategoryIcon } from './CategoryIcon';

export const LogProgressModal: React.FC = () => {
  const {
    modalState,
    closeProgressModal,
    categories,
    tasks,
    logProgress,
  } = useApp();

  const { isProgressOpen, progressCategory } = modalState;

  const [categoryId, setCategoryId] = useState('');
  const [value, setValue] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState('');

  useEffect(() => {
    setCategoryId(progressCategory || categories[0]?.id || '');
    setValue('');
    setDate(new Date().toISOString().split('T')[0]);
    setNote('');
    setSelectedTaskId('');
  }, [progressCategory, categories, isProgressOpen]);

  if (!isProgressOpen) return null;

  const currentCat = categories.find((c) => c.id === categoryId);
  const catGoals = tasks.filter((t) => t.categoryId === categoryId && t.itemType === 'goal' && !t.completed);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value || isNaN(Number(value))) return;

    await logProgress(
      categoryId || categories[0]?.id,
      Number(value),
      date || new Date().toISOString().split('T')[0],
      note.trim() || undefined,
      selectedTaskId || undefined
    );

    closeProgressModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md apple-panel rounded-2xl shadow-2xl border border-white/60 dark:border-white/10 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[rgba(60,60,67,0.12)] dark:border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#0A84FF]/10 text-[#0A84FF] flex items-center justify-center">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#1C1C1E] dark:text-[#F5F5F7]">
                Log Progress
              </h3>
              <p className="text-[11px] text-[#6E6E73] dark:text-[#A1A1A6]">Record numerical progress & charts data</p>
            </div>
          </div>
          <button
            onClick={closeProgressModal}
            className="p-1 rounded-md text-[#6E6E73] hover:text-[#1C1C1E] dark:hover:text-[#F5F5F7] hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          
          {/* Category Picker */}
          <div>
            <label className="block text-xs font-medium text-[#1C1C1E] dark:text-[#F5F5F7] mb-1">
              Select Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/70 dark:bg-black/20 border border-[rgba(60,60,67,0.15)] dark:border-white/10 focus:border-[#0A84FF] focus:outline-none text-sm text-[#1C1C1E] dark:text-[#F5F5F7] transition"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                  {c.name} ({c.unit || 'units'})
                </option>
              ))}
            </select>
          </div>

          {/* Amount / Value Input */}
          <div>
            <label className="block text-xs font-medium text-[#1C1C1E] dark:text-[#F5F5F7] mb-1">
              Progress Amount ({currentCat?.unit || 'units'}) *
            </label>
            <div className="relative">
              {currentCat?.unit === '$' && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6E6E73] font-medium">
                  $
                </span>
              )}
              <input
                type="number"
                step="any"
                required
                autoFocus
                placeholder={currentCat?.unit === '$' ? '50.00' : '2.5'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className={`w-full py-2 rounded-xl bg-white/70 dark:bg-black/20 border border-[rgba(60,60,67,0.15)] dark:border-white/10 focus:border-[#0A84FF] focus:outline-none text-sm font-medium text-[#1C1C1E] dark:text-[#F5F5F7] transition ${
                  currentCat?.unit === '$' ? 'pl-7 pr-3' : 'px-3'
                }`}
              />
            </div>
          </div>

          {/* Optional Goal Attribution */}
          {catGoals.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-[#1C1C1E] dark:text-[#F5F5F7] mb-1">
                Link to Goal (Optional)
              </label>
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-white/70 dark:bg-black/20 border border-[rgba(60,60,67,0.15)] dark:border-white/10 focus:border-[#0A84FF] focus:outline-none text-xs text-[#1C1C1E] dark:text-[#F5F5F7] transition"
              >
                <option value="" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">-- General category progress --</option>
                {catGoals.map((g) => (
                  <option key={g.id} value={g.id} className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                    {g.title} ({g.currentValue || 0}/{g.targetValue} {g.unit || ''})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-medium text-[#1C1C1E] dark:text-[#F5F5F7] mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/70 dark:bg-black/20 border border-[rgba(60,60,67,0.15)] dark:border-white/10 focus:border-[#0A84FF] focus:outline-none text-sm text-[#1C1C1E] dark:text-[#F5F5F7] transition"
            />
          </div>

          {/* Note / Memo */}
          <div>
            <label className="block text-xs font-medium text-[#1C1C1E] dark:text-[#F5F5F7] mb-1">
              Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Weekly grocery savings, Chapters 3-4 read, Zone 2 treadmill"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/70 dark:bg-black/20 border border-[rgba(60,60,67,0.15)] dark:border-white/10 focus:border-[#0A84FF] focus:outline-none text-xs text-[#1C1C1E] dark:text-[#F5F5F7] transition"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#0A84FF] hover:bg-[#0071E3] active:scale-98 text-white font-medium text-sm shadow-xs transition cursor-pointer"
            >
              Save Progress Entry
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
