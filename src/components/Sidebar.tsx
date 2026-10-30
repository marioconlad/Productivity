import React from 'react';
import { LayoutGrid, Plus, Edit2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CategoryIcon } from './CategoryIcon';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const {
    categories,
    tasks,
    selectedCategory,
    setSelectedCategory,
    openCategoryModal,
  } = useApp();

  const getTaskCount = (catId: string) => {
    if (catId === 'all') return tasks.filter((t) => !t.completed).length;
    return tasks.filter((t) => t.categoryId === catId && !t.completed).length;
  };

  return (
    <aside
      className={`shrink-0 h-[calc(100vh-3.75rem)] sticky top-[3.75rem] z-30 transition-all duration-200 ease-in-out apple-panel border-r border-t-0 border-b-0 border-l-0 rounded-none overflow-hidden flex flex-col ${
        collapsed
          ? 'w-14'
          : 'w-14 max-[900px]:w-14 min-[900px]:w-[220px]'
      }`}
    >
      {/* Scrollable categories list */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1">
        {/* 'All' Row */}
        <button
          onClick={() => setSelectedCategory('all')}
          title="All Categories"
          className={`w-full flex items-center h-8 px-2.5 rounded-[8px] text-[14px] transition cursor-pointer group ${
            selectedCategory === 'all'
              ? 'bg-[rgba(10,132,255,0.12)] text-[#0A84FF] font-medium'
              : 'text-[#1C1C1E] dark:text-[#F5F5F7] hover:bg-black/5 dark:hover:bg-white/5 font-normal'
          } ${collapsed ? 'justify-center' : 'justify-between max-[900px]:justify-center'}`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-[18px] h-[18px] flex items-center justify-center shrink-0 text-[#0A84FF]">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <span
              className={`truncate text-[14px] ${
                collapsed ? 'hidden' : 'inline max-[900px]:hidden'
              }`}
            >
              All
            </span>
          </div>
          <span
            className={`text-xs text-[#8E8E93] dark:text-[#A1A1A6] font-normal shrink-0 ${
              collapsed ? 'hidden' : 'inline max-[900px]:hidden'
            } ${selectedCategory === 'all' ? 'text-[#0A84FF] font-medium' : ''}`}
          >
            {getTaskCount('all')}
          </span>
        </button>

        {/* Hairline divider */}
        <div className="my-1.5 h-[1px] bg-[rgba(60,60,67,0.08)] dark:bg-[rgba(255,255,255,0.08)]" />

        {/* Category Rows */}
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const count = getTaskCount(cat.id);

          return (
            <div
              key={cat.id}
              className={`group w-full flex items-center h-8 px-2.5 rounded-[8px] text-[14px] transition cursor-pointer relative ${
                isSelected
                  ? 'bg-[rgba(10,132,255,0.12)] text-[#0A84FF] font-medium'
                  : 'text-[#1C1C1E] dark:text-[#F5F5F7] hover:bg-black/5 dark:hover:bg-white/5 font-normal'
              } ${collapsed ? 'justify-center' : 'justify-between max-[900px]:justify-center'}`}
              onClick={() => setSelectedCategory(cat.id)}
              title={`${cat.name} (${count})`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {/* 18px category icon with category accent color */}
                <div
                  className="w-[18px] h-[18px] flex items-center justify-center shrink-0"
                  style={{ color: cat.color }}
                >
                  <CategoryIcon name={cat.icon || cat.type || 'Folder'} size={16} />
                </div>
                <span
                  className={`truncate text-[14px] ${
                    collapsed ? 'hidden' : 'inline max-[900px]:hidden'
                  }`}
                >
                  {cat.name}
                </span>
              </div>

              {/* Right side: item count & subtle edit button on hover */}
              <div
                className={`flex items-center gap-1.5 shrink-0 ${
                  collapsed ? 'hidden' : 'flex max-[900px]:hidden'
                }`}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openCategoryModal(cat);
                  }}
                  title={`Edit ${cat.name}`}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-[#F5F5F7] transition"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <span
                  className={`text-xs text-[#8E8E93] dark:text-[#A1A1A6] font-normal ${
                    isSelected ? 'text-[#0A84FF] font-medium' : ''
                  }`}
                >
                  {count}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom: + New Category plain text button */}
      <div className="p-2 border-t border-[rgba(60,60,67,0.08)] dark:border-[rgba(255,255,255,0.08)] shrink-0">
        <button
          onClick={() => openCategoryModal()}
          title="Add New Category"
          className={`w-full flex items-center h-8 px-2.5 rounded-[8px] text-xs font-medium text-[#0A84FF] hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer ${
            collapsed ? 'justify-center' : 'justify-start gap-2 max-[900px]:justify-center'
          }`}
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span className={collapsed ? 'hidden' : 'inline max-[900px]:hidden'}>
            New Category
          </span>
        </button>
      </div>
    </aside>
  );
};
