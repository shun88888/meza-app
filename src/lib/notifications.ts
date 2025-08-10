// Push notification utilities

export class NotificationManager {
  private static instance: NotificationManager;
  private registration: ServiceWorkerRegistration | null = null;

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  async init(): Promise<boolean> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push messaging is not supported');
      return false;
    }

    try {
      if (!this.registration) {
        this.registration = await navigator.serviceWorker.register('/sw.js');
      }
      console.log('Service Worker registered successfully');
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }

  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.registration) {
      await this.init();
    }

    if (!this.registration) {
      return null;
    }

    try {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return null;
      }

      // Check if already subscribed
      const existingSubscription = await this.registration.pushManager.getSubscription();
      if (existingSubscription) {
        return existingSubscription;
      }

      // Create new subscription
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
      });

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
      
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  async unsubscribeFromPush(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        // Optionally notify server about unsubscription
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscription })
      });

      if (!response.ok) {
        throw new Error('Failed to send subscription to server');
      }
    } catch (error) {
      console.error('Error sending subscription to server:', error);
      throw error;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async sendNotification(title: string, body: string, type: string = 'general', userId?: string): Promise<boolean> {
    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          body,
          type,
          userId
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  async getNotifications(unreadOnly: boolean = false, limit?: number): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (unreadOnly) params.append('unread', 'true');
      if (limit) params.append('limit', limit.toString());

      const response = await fetch(`/api/notifications?${params}`);
      if (response.ok) {
        const data = await response.json();
        return data.notifications || [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationId,
          isRead: true
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }
}

// Convenience functions
export const notificationManager = NotificationManager.getInstance();

export async function initNotifications(): Promise<boolean> {
  return await notificationManager.init();
}

export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  return await notificationManager.subscribeToPush();
}

export async function sendNotification(title: string, body: string, type?: string): Promise<boolean> {
  return await notificationManager.sendNotification(title, body, type);
}