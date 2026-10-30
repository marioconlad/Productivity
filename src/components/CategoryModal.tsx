import React, { useState, useEffect } from 'react';
import { X, Trash2, Palette, Smile, Sparkles, Folder, Pipette } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CategoryType } from '../types';
import { CategoryIcon } from './CategoryIcon';

const APPLE_COLORS = [
  // Reds & Corals
  '#FF2D55', // Apple Signature Coral
  '#EF4444', // Crimson Red
  '#FA7065', // Salmon Rose
  '#F43F5E', // Vivid Rose
  '#FB7185', // Pale Rose
  // Oranges & Ambers
  '#F97316', // Sunset Orange
  '#FB923C', // Pale Apricot
  '#F59E0B', // Warm Amber
  '#FBBF24', // Honey Gold
  '#FACC15', // Sunflower Yellow
  // Greens & Limes
  '#84CC16', // Vibrant Lime
  '#10B981', // Emerald
  '#34D399', // Pale Sage Green
  '#A7F3D0', // Soft Pastel Mint
  '#059669', // Forest Pine
  // Teals & Cyans
  '#14B8A6', // Ocean Teal
  '#2DD4BF', // Pale Teal / Mint
  '#06B6D4', // Aqua Cyan
  // Blues
  '#007AFF', // Apple System Blue
  '#38BDF8', // Pale Sky Blue
  '#3B82F6', // Royal Cobalt
  '#6366F1', // Apple Indigo
  '#818CF8', // Pale Indigo
  // Purples & Pinks
  '#8B5CF6', // Vivid Violet
  '#A855F7', // Royal Purple
  '#C084FC', // Pale Lilac / Lavender
  '#DDD6FE', // Soft Pastel Violet
  '#EC4899', // Hot Pink
  '#F472B6', // Pale Pink
  // Neutrals & Earth
  '#64748B', // Cool Slate
  '#94A3B8', // Pale Slate
  '#78350F', // Warm Cocoa
];

const PRESET_EMOJIS = [
  {
    group: 'Tech & Work',
    emojis: ['💻', '🖥️', '⚡', '⚙️', '📱', '🚀', '🛠️', '🔑', '📊', '📝', '🧪', '💼'],
  },
  {
    group: 'Finance & Saving',
    emojis: ['💰', '💵', '💳', '🪙', '📈', '🏦', '💎', '🧾', '🏷️', '🛍️', '💹', '🔒'],
  },
  {
    group: 'Study & Mind',
    emojis: ['📚', '📖', '🎓', '🧠', '💡', '🔬', '🔭', '✍️', '📐', '♟️', '🔍', '📜'],
  },
  {
    group: 'Fitness & Health',
    emojis: ['🏃', '🏋️', '🚴', '🏊', '🧘', '🧗', '🥊', '⚽', '🎾', '🥗', '💧', '⏱️'],
  },
  {
    group: 'Habits & Goals',
    emojis: ['🎯', '🔥', '⭐', '🏆', '🌱', '✨', '🔔', '📅', '✅', '🥇', '🚀', '🌟'],
  },
  {
    group: 'Creative & Music',
    emojis: ['🎨', '📷', '🎬', '🎵', '🎸', '🎧', '🎭', '✍️', '🎹', '🎙️', '🧶', '✒️'],
  },
  {
    group: 'Lifestyle & Home',
    emojis: ['☕', '✈️', '🐶', '🐱', '🌿', '🏠', '🚗', '🍔', '🍕', '😴', '❤️', '☀️'],
  },
];

export const CategoryModal: React.FC = () => {
  const {
    modalState,
    closeCategoryModal,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useApp();

  const { isCategoryOpen, editingCategory } = modalState;

  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('custom');
  const [color, setColor] = useState(APPLE_COLORS[0]);
  const [selectedEmoji, setSelectedEmoji] = useState('🎯');
  const [customEmojiInput, setCustomEmojiInput] = useState('');
  const [monthlyTarget, setMonthlyTarget] = useState<string>('');
  const [unit, setUnit] = useState('');

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name);
      setType((editingCategory.type as CategoryType) || 'custom');
      setColor(editingCategory.color);
      const iconVal = editingCategory.icon || 'Folder';
      setSelectedEmoji(iconVal);
      setCustomEmojiInput(iconVal);
      setMonthlyTarget(editingCategory.monthlyTarget ? String(editingCategory.monthlyTarget) : '');
      setUnit(editingCategory.unit || '');
    } else {
      setName('');
      setType('custom');
      setColor(APPLE_COLORS[Math.floor(Math.random() * APPLE_COLORS.length)]);
      setSelectedEmoji('🎯');
      setCustomEmojiInput('');
      setMonthlyTarget('50');
      setUnit('units');
    }
  }, [editingCategory, isCategoryOpen]);

  if (!isCategoryOpen) return null;

  const currentIcon = customEmojiInput.trim() || selectedEmoji || 'Folder';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      name: name.trim(),
      type,
      color,
      icon: currentIcon,
      monthlyTarget: monthlyTarget ? Number(monthlyTarget) : undefined,
      unit: unit.trim() || undefined,
    };

    if (editingCategory) {
      await updateCategory(editingCategory.id, payload);
    } else {
      await addCategory(payload);
    }

    closeCategoryModal();
  };

  const handleDelete = async () => {
    if (!editingCategory) return;
    if (confirm(`Are you sure you want to delete category "${editingCategory.name}"?`)) {
      await deleteCategory(editingCategory.id);
      closeCategoryModal();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg apple-panel rounded-2xl shadow-2xl border border-white/60 dark:border-white/10 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[rgba(60,60,67,0.12)] dark:border-white/10 shrink-0">
          <div>
            <h3 className="text-sm font-semibold text-[#1C1C1E] dark:text-[#F5F5F7]">
              {editingCategory ? 'Edit Category' : 'Create New Category'}
            </h3>
            <p className="text-[11px] text-[#6E6E73] dark:text-[#A1A1A6]">
              Personalize with keyboard emojis, Apple colors, and target metrics
            </p>
          </div>
          <button
            onClick={closeCategoryModal}
            className="p-1 rounded-md text-[#6E6E73] hover:text-[#1C1C1E] dark:hover:text-[#F5F5F7] hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Live Preview Card */}
          <div className="p-3.5 rounded-xl apple-subpanel flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg shadow-xs transition-all"
                style={{ backgroundColor: color }}
              >
                <CategoryIcon name={currentIcon} size={20} />
              </span>
              <div>
                <p className="text-[10px] font-medium text-[#6E6E73] dark:text-[#A1A1A6] uppercase tracking-wider">Preview</p>
                <h4 className="text-sm font-medium text-[#1C1C1E] dark:text-[#F5F5F7]">
                  {name.trim() || 'Category Name'}
                </h4>
              </div>
            </div>

            <div className="text-right">
              <span
                className="px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ backgroundColor: `${color}18`, color }}
              >
                Target: {unit === '$' ? '$' : ''}
                {monthlyTarget || '0'} {unit !== '$' ? unit : ''}
              </span>
            </div>
          </div>

          {/* Category Title */}
          <div>
            <label className="block text-xs font-medium text-[#1C1C1E] dark:text-[#F5F5F7] mb-1">
              Category Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Real Estate Savings, Japanese Practice, Marathon"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/70 dark:bg-black/20 border border-[rgba(60,60,67,0.15)] dark:border-white/10 focus:border-[#0A84FF] focus:outline-none text-sm text-[#1C1C1E] dark:text-[#F5F5F7] transition"
            />
          </div>

          {/* Custom Keyboard Emoji Selector */}
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl apple-subpanel space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[#1C1C1E] dark:text-[#F5F5F7] flex items-center gap-1.5">
                  <Smile className="w-4 h-4 text-amber-500" />
                  <span>Choose Emoji from Keyboard</span>
                </label>
                <span className="text-[10px] text-[#6E6E73] dark:text-[#A1A1A6]">
                  Mac: <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[#1C1C1E] dark:text-[#F5F5F7] font-mono">⌃⌘Space</kbd>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Type or paste any emoji from your keyboard..."
                    value={customEmojiInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomEmojiInput(val);
                      if (val.trim()) setSelectedEmoji(val.trim());
                    }}
                    className="w-full pl-3 pr-8 py-2 rounded-xl bg-white/70 dark:bg-black/20 text-sm border border-[rgba(60,60,67,0.15)] dark:border-white/10 focus:outline-none focus:border-[#0A84FF] text-[#1C1C1E] dark:text-[#F5F5F7] placeholder:text-[#6E6E73]"
                  />
                  {customEmojiInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomEmojiInput('');
                        setSelectedEmoji('🎯');
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6E6E73] hover:text-[#1C1C1E] dark:hover:text-[#F5F5F7] p-0.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 border border-[rgba(60,60,67,0.15)] dark:border-white/10 bg-white/70 dark:bg-black/20 shadow-2xs"
                  style={{ color }}
                >
                  <CategoryIcon name={currentIcon} size={20} />
                </div>
              </div>
            </div>

            {/* Categorized Preset Emojis Grid */}
            <div className="space-y-2.5 p-3.5 rounded-xl apple-subpanel max-h-48 overflow-y-auto">
              <span className="text-[10px] font-medium text-[#6E6E73] dark:text-[#A1A1A6] uppercase tracking-wider block mb-1">
                Popular Preset Emojis
              </span>
              {PRESET_EMOJIS.map((grp) => (
                <div key={grp.group} className="space-y-1">
                  <span className="text-[10px] uppercase font-medium text-[#6E6E73] dark:text-[#A1A1A6]">
                    {grp.group}
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {grp.emojis.map((emoji) => {
                      const isSelected = currentIcon === emoji;
                      return (
                        <button
                          type="button"
                          key={emoji}
                          onClick={() => {
                            setSelectedEmoji(emoji);
                            setCustomEmojiInput(emoji);
                          }}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition cursor-pointer ${
                            isSelected
                              ? 'bg-[#0A84FF]/15 text-[#0A84FF] ring-1 ring-[#0A84FF] scale-105'
                              : 'hover:bg-black/5 dark:hover:bg-white/10'
                          }`}
                        >
                          {emoji}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Color Palette (Expanded Colors + Color Picker) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[#1C1C1E] dark:text-[#F5F5F7] flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-[#0A84FF]" />
                <span>Category Color</span>
              </label>

              {/* Native Custom Color Picker */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[#6E6E73] dark:text-[#A1A1A6] font-mono uppercase">{color}</span>
                <label className="relative cursor-pointer flex items-center justify-center w-7 h-7 rounded-lg border border-[rgba(60,60,67,0.15)] dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 shadow-2xs transition">
                  <Pipette className="w-3.5 h-3.5 text-[#6E6E73] dark:text-[#A1A1A6]" />
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    title="Choose any custom color"
                  />
                </label>
              </div>
            </div>

            {/* Apple Color Swatches Grid */}
            <div className="flex items-center gap-2 flex-wrap p-3 rounded-xl apple-subpanel">
              {APPLE_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform cursor-pointer shrink-0 ${
                    color.toLowerCase() === c.toLowerCase()
                      ? 'scale-125 ring-2 ring-offset-2 ring-[#0A84FF] dark:ring-offset-zinc-900 shadow-xs'
                      : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>

          {/* Monthly Target & Unit */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl apple-subpanel">
            <div>
              <label className="block text-xs font-medium text-[#1C1C1E] dark:text-[#F5F5F7] mb-1">
                Monthly Target
              </label>
              <input
                type="number"
                placeholder="e.g. 800"
                value={monthlyTarget}
                onChange={(e) => setMonthlyTarget(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white/70 dark:bg-black/20 text-xs text-[#1C1C1E] dark:text-[#F5F5F7] focus:outline-none border border-[rgba(60,60,67,0.15)] dark:border-white/10"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#1C1C1E] dark:text-[#F5F5F7] mb-1">
                Target Unit
              </label>
              <input
                type="text"
                placeholder="$, hours, workouts, chapters"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white/70 dark:bg-black/20 text-xs text-[#1C1C1E] dark:text-[#F5F5F7] focus:outline-none border border-[rgba(60,60,67,0.15)] dark:border-white/10"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center gap-2">
            {editingCategory && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3.5 py-2.5 rounded-xl bg-red-500/10 text-[#FF3B30] font-medium text-xs sm:text-sm hover:bg-red-500/20 transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-[#0A84FF] hover:bg-[#0071E3] active:scale-98 text-white font-medium text-sm shadow-xs transition cursor-pointer"
            >
              {editingCategory ? 'Save Category Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
