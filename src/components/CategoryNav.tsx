import React from 'react';
import { Plus, LayoutGrid, PlusCircle, Edit2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CategoryIcon } from './CategoryIcon';

export const CategoryNav: React.FC = () => {
  const {
    categories,
    tasks,
    selectedCategory,
    setSelectedCategory,
    openCategoryModal,
    openProgressModal,
  } = useApp();

  const getTaskCount = (catId: string) => {
    if (catId === 'all') return tasks.filter((t) => !t.completed).length;
    return tasks.filter((t) => t.categoryId === catId && !t.completed).length;
  };

  return (
    <div className="w-full border-b border-[rgba(255,255,255,0.6)] dark:border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.45)] dark:bg-[rgba(36,36,40,0.45)] backdrop-blur-[12px] [-webkit-backdrop-filter:blur(12px)] py-2 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
        
        {/* Categories list */}
        <div className="flex items-center gap-1.5 flex-nowrap">
          {/* All Categories Option */}
          <button
            onClick={() => setSelectedCategory('all')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] text-xs sm:text-[13px] transition cursor-pointer whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-[rgba(10,132,255,0.12)] text-[#0A84FF] font-medium'
                : 'text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#1C1C1E] dark:hover:text-[#F5F5F7] hover:bg-black/5 dark:hover:bg-white/5 font-normal'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>All</span>
            <span
              className={`text-[11px] ${
                selectedCategory === 'all'
                  ? 'text-[#0A84FF]'
                  : 'text-[#8E8E93] dark:text-[#636366]'
              }`}
            >
              {getTaskCount('all')}
            </span>
          </button>

          {/* Individual Category Pills */}
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const count = getTaskCount(cat.id);

            return (
              <div
                key={cat.id}
                className={`group flex items-center gap-1 px-2.5 py-1 rounded-[10px] text-xs sm:text-[13px] transition whitespace-nowrap ${
                  isSelected
                    ? 'bg-[rgba(10,132,255,0.12)] text-[#0A84FF] font-medium'
                    : 'text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#1C1C1E] dark:hover:text-[#F5F5F7] hover:bg-black/5 dark:hover:bg-white/5 font-normal'
                }`}
              >
                <button
                  onClick={() => setSelectedCategory(cat.id)}
                  className="flex items-center gap-1.5 cursor-pointer"
                >
                  {/* Small category color accent dot or tiny 14px icon */}
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span>{cat.name}</span>
                  {count > 0 && (
                    <span className="text-[11px] opacity-75">
                      {count}
                    </span>
                  )}
                </button>

                {/* Edit Category Icon */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openCategoryModal(cat);
                  }}
                  title={`Edit ${cat.name}`}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-[#F5F5F7] transition cursor-pointer"
                >
                  <Edit2 className="w-2.5 h-2.5" />
                </button>
              </div>
            );
          })}

          {/* Add Category Button */}
          <button
            onClick={() => openCategoryModal()}
            className="flex items-center gap-1 px-2 py-1 rounded-[10px] text-xs text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#1C1C1E] dark:hover:text-[#F5F5F7] hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Category</span>
          </button>
        </div>

        {/* Quick Log Progress Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => openProgressModal(selectedCategory !== 'all' ? selectedCategory : undefined)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] text-xs font-medium text-[#0A84FF] bg-[rgba(10,132,255,0.08)] hover:bg-[rgba(10,132,255,0.15)] dark:bg-[rgba(10,132,255,0.15)] dark:hover:bg-[rgba(10,132,255,0.22)] border border-[#0A84FF]/20 transition cursor-pointer whitespace-nowrap"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#0A84FF]" />
            <span>Log Progress</span>
          </button>
        </div>

      </div>
    </div>
  );
};
