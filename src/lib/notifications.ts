import { sounds } from './audio';
import { NotificationItem } from '../types';

export class NotificationService {
  private static instance: NotificationService;
  private permission: NotificationPermission = 'default';
  private listeners: ((notification: NotificationItem) => void)[] = [];

  private constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  getPermissionStatus(): NotificationPermission {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'denied';
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('Notifications not supported in this browser.');
      return 'denied';
    }

    try {
      const res = await Notification.requestPermission();
      this.permission = res;
      return res;
    } catch (err) {
      console.error('Failed to request notification permission:', err);
      return 'denied';
    }
  }

  notify(title: string, body: string, taskId?: string): NotificationItem {
    const item: NotificationItem = {
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      title,
      body,
      timestamp: new Date().toISOString(),
      read: false,
      taskId
    };

    // Play subtle Apple sound
    sounds.playNotification();

    // Browser Push Notification if granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: taskId || item.id,
        });
      } catch (e) {
        console.warn('Could not launch native push notification:', e);
      }
    }

    // Trigger local listeners (for in-app banner / center)
    this.listeners.forEach((listener) => listener(item));
    return item;
  }

  subscribe(listener: (notification: NotificationItem) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }
}

export const notificationService = NotificationService.getInstance();
