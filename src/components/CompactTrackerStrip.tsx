import React, { useMemo } from 'react';
import { PlusCircle, Flame, Plus, Settings2, Edit2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CategoryIcon } from './CategoryIcon';

export const CompactTrackerStrip: React.FC = () => {
  const {
    categories,
    tasks,
    progressMetrics,
    selectedCategory,
    setSelectedCategory,
    openProgressModal,
    openCategoryModal,
  } = useApp();

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Metrics for current month
  const monthlyMetrics = useMemo(() => {
    return progressMetrics.filter((m) => {
      const d = new Date(m.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }, [progressMetrics, currentMonth, currentYear]);

  // Compute tracker stats for each category
  const trackerCards = useMemo(() => {
    return categories.map((cat) => {
      const catTasks = tasks.filter((t) => t.categoryId === cat.id);
      const activeCount = catTasks.filter((t) => !t.completed).length;
      const catMetrics = monthlyMetrics.filter((m) => m.categoryId === cat.id);
      const totalLogged = catMetrics.reduce((sum, m) => sum + (m.value || 0), 0);
      const target = cat.monthlyTarget || 50;
      const percent = Math.min(100, Math.round((totalLogged / target) * 100));

      const habits = catTasks.filter((t) => t.itemType === 'habit');
      const maxStreak = Math.max(0, ...habits.map((h) => h.streakCount || 0));

      return {
        category: cat,
        activeCount,
        totalLogged,
        target,
        percent,
        maxStreak,
      };
    });
  }, [categories, tasks, monthlyMetrics]);

  return (
    <div className="space-y-2">
      {/* Tracker Strip Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-[#6E6E73] dark:text-[#A1A1A6] uppercase tracking-wider">
            Category Trackers
          </span>
          {selectedCategory !== 'all' && (
            <button
              onClick={() => setSelectedCategory('all')}
              className="text-[11px] text-[#0A84FF] hover:underline font-medium cursor-pointer"
            >
              (Show All)
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Add Category Button */}
          <button
            onClick={() => openCategoryModal()}
            className="flex items-center gap-1 text-xs font-medium text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#1C1C1E] dark:hover:text-[#F5F5F7] transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#0A84FF]" />
            <span>Add Category</span>
          </button>

          {/* Log Progress Button */}
          <button
            onClick={() => openProgressModal(selectedCategory !== 'all' ? selectedCategory : undefined)}
            className="flex items-center gap-1 text-xs font-medium text-[#0A84FF] hover:underline transition cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Log Progress</span>
          </button>
        </div>
      </div>

      {/* Grid of Compact Tracker Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {trackerCards.map((item) => {
          const isSelected = selectedCategory === item.category.id;
          const isCurrency = item.category.unit === '$';

          return (
            <div
              key={item.category.id}
              onClick={() => setSelectedCategory(isSelected ? 'all' : item.category.id)}
              className={`p-3 rounded-xl transition-all cursor-pointer relative overflow-hidden group apple-subpanel ${
                isSelected
                  ? 'bg-[#0A84FF]/10 ring-1.5 ring-[#0A84FF]'
                  : 'hover:bg-black/5 dark:hover:bg-white/10'
              }`}
            >
              {/* Category Icon, Name, and Edit Button */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs shadow-2xs"
                    style={{ backgroundColor: item.category.color }}
                  >
                    <CategoryIcon
                      name={item.category.icon || item.category.type}
                      size={13}
                    />
                  </span>
                  <div>
                    <h4 className="text-xs font-medium text-[#1C1C1E] dark:text-[#F5F5F7] truncate flex items-center gap-1">
                      {item.category.name}
                    </h4>
                    <p className="text-[10px] text-[#6E6E73] dark:text-[#A1A1A6]">
                      {item.activeCount} active tasks
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {item.maxStreak > 0 && (
                    <span className="flex items-center gap-0.5 text-[10px] font-medium text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-md">
                      <Flame className="w-2.5 h-2.5 fill-amber-500" />
                      {item.maxStreak}d
                    </span>
                  )}
                  {/* Edit Category Trigger */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openCategoryModal(item.category);
                    }}
                    title={`Edit ${item.category.name} (emoji, color, target)`}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-[#6E6E73] hover:text-[#1C1C1E] dark:hover:text-[#F5F5F7] hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress metric values */}
              <div className="space-y-1">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-medium text-[#1C1C1E] dark:text-[#F5F5F7] font-mono">
                    {isCurrency ? '$' : ''}
                    {item.totalLogged}
                    <span className="text-[#6E6E73] dark:text-[#A1A1A6] font-normal ml-0.5">
                      / {isCurrency ? '$' : ''}
                      {item.target} {!isCurrency ? item.category.unit : ''}
                    </span>
                  </span>
                  <span className="text-[11px] font-medium text-[#6E6E73] dark:text-[#A1A1A6] font-mono">
                    {item.percent}%
                  </span>
                </div>

                {/* Slim Apple Progress Bar */}
                <div className="w-full h-1 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${item.percent}%`,
                      backgroundColor: item.category.color,
                    }}
                  />
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};
