/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { RemindersTrackerView } from './components/RemindersTrackerView';
import { KanbanView } from './components/KanbanView';
import { CalendarView } from './components/CalendarView';
import { AnalyticsView } from './components/AnalyticsView';
import { TaskModal } from './components/TaskModal';
import { CategoryModal } from './components/CategoryModal';
import { LogProgressModal } from './components/LogProgressModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { MentalCheckInModal } from './components/MentalCheckInModal';
import { CognitiveDistortionLegendModal } from './components/CognitiveDistortionLegendModal';
import { ItemTypesGuideModal } from './components/ItemTypesGuideModal';
import { Plus } from 'lucide-react';

const MainContent: React.FC = () => {
  const { viewMode, openTaskModal, selectedCategory } = useApp();

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('tempo_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('tempo_sidebar_collapsed', String(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-[var(--text-primary)] transition-colors selection:bg-[#0A84FF] selection:text-white">
      {/* Top Header */}
      <Header
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={toggleSidebar}
      />

      {/* Main App Body with Unified Left Category Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebar}
        />

        <main className="flex-1 min-w-0 overflow-y-auto pb-20">
          {viewMode === 'list' && <RemindersTrackerView />}
          {viewMode === 'kanban' && <KanbanView />}
          {viewMode === 'calendar' && <CalendarView />}
          {viewMode === 'analytics' && <AnalyticsView />}
        </main>
      </div>

      {/* Floating Action Button (Mobile Friendly Apple Action) */}
      <div className="fixed bottom-6 right-6 z-30 md:hidden">
        <button
          onClick={() => openTaskModal(null, selectedCategory !== 'all' ? selectedCategory : undefined)}
          aria-label="Add new item"
          className="w-13 h-13 rounded-full bg-[#0A84FF] active:scale-95 text-white shadow-md shadow-blue-500/25 flex items-center justify-center cursor-pointer transition ring-1 ring-white/30"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* Sheet Modals */}
      <TaskModal />
      <CategoryModal />
      <LogProgressModal />
      <NotificationCenterModal />
      <MentalCheckInModal />
      <CognitiveDistortionLegendModal />
      <ItemTypesGuideModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
