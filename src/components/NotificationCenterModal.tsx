import React, { useState, useEffect } from 'react';
import { X, Bell, BellRing, Check, Volume2, ShieldCheck, Clock, Trash2, Send } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { notificationService } from '../lib/notifications';

export const NotificationCenterModal: React.FC = () => {
  const {
    modalState,
    closeNotificationCenter,
    notifications,
    tasks,
    triggerTestNotification,
    clearNotifications,
  } = useApp();

  const { isNotificationCenterOpen } = modalState;

  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (isNotificationCenterOpen) {
      setPermission(notificationService.getPermissionStatus());
    }
  }, [isNotificationCenterOpen]);

  if (!isNotificationCenterOpen) return null;

  const handleRequestPermission = async () => {
    const res = await notificationService.requestPermission();
    setPermission(res);
    if (res === 'granted') {
      triggerTestNotification();
    }
  };

  const scheduledTasks = tasks.filter((t) => t.reminderEnabled && !t.completed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md apple-panel rounded-2xl shadow-2xl border border-white/60 dark:border-white/10 overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[rgba(60,60,67,0.12)] dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#0A84FF]/10 text-[#0A84FF] flex items-center justify-center">
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#1C1C1E] dark:text-[#F5F5F7]">
                Push Notifications
              </h3>
              <p className="text-[11px] text-[#6E6E73] dark:text-[#A1A1A6]">Task alarms and habit reminders</p>
            </div>
          </div>
          <button
            onClick={closeNotificationCenter}
            className="p-1 rounded-md text-[#6E6E73] hover:text-[#1C1C1E] dark:hover:text-[#F5F5F7] hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          
          {/* Permission Card */}
          <div className="p-3.5 rounded-xl apple-subpanel space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0A84FF]" />
                <span className="text-xs font-medium text-[#1C1C1E] dark:text-[#F5F5F7]">
                  Browser Push Permission
                </span>
              </div>
              <span
                className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  permission === 'granted'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                }`}
              >
                {permission}
              </span>
            </div>

            <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
              {permission === 'granted'
                ? 'Push notifications and sound chimes are enabled for your scheduled reminders.'
                : 'Allow notifications to receive instant audio and system banner reminders when habits or tasks are due.'}
            </p>

            <div className="flex items-center gap-2 pt-1">
              {permission !== 'granted' && (
                <button
                  onClick={handleRequestPermission}
                  className="flex-1 py-1.5 rounded-lg bg-[#0A84FF] hover:bg-[#0071E3] text-white text-xs font-medium shadow-xs transition cursor-pointer"
                >
                  Enable Push Notifications
                </button>
              )}
              <button
                onClick={triggerTestNotification}
                className="flex-1 py-1.5 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 text-[#1C1C1E] dark:text-[#F5F5F7] text-xs font-medium transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5 text-[#0A84FF]" />
                <span>Test Alert Now</span>
              </button>
            </div>
          </div>

          {/* Scheduled Active Reminders */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-medium text-[#6E6E73] dark:text-[#A1A1A6] uppercase tracking-wider">
              Active Push Reminders ({scheduledTasks.length})
            </h4>

            {scheduledTasks.length === 0 ? (
              <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6] italic">No scheduled push reminders active.</p>
            ) : (
              <div className="space-y-1.5">
                {scheduledTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-2.5 rounded-xl apple-subpanel flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-medium text-[#1C1C1E] dark:text-[#F5F5F7]">
                        {t.title}
                      </p>
                      <p className="text-[11px] text-[#6E6E73] dark:text-[#A1A1A6] flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-[#0A84FF]" />
                        <span>{t.dueDate || 'Today'} {t.dueTime ? `@ ${t.dueTime}` : ''}</span>
                      </p>
                    </div>
                    <span className="text-[10px] uppercase font-medium text-[#0A84FF] bg-[#0A84FF]/10 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notification History */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-medium text-[#6E6E73] dark:text-[#A1A1A6] uppercase tracking-wider">
                Recent Alerts ({notifications.length})
              </h4>
              {notifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  className="text-xs text-[#6E6E73] hover:text-[#FF3B30] flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6] italic">No notifications yet.</p>
            ) : (
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-2.5 rounded-xl apple-subpanel space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-[#1C1C1E] dark:text-[#F5F5F7]">
                        {n.title}
                      </p>
                      <span className="text-[10px] text-[#6E6E73] dark:text-[#A1A1A6]">
                        {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6]">{n.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
