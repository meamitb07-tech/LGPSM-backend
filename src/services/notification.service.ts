import { notificationRepository } from '../repositories/notification.repository';
import { INotification } from '../models/Notification';

export const notificationService = {
  async createNotification(data: Partial<INotification>): Promise<INotification> {
    return await notificationRepository.create(data);
  },

  async getUserNotifications(userId: string, unreadOnly: boolean = false, page: number = 1, limit: number = 20) {
    return await notificationRepository.findByUserId(userId, unreadOnly, page, limit);
  },

  async markAsRead(id: string, userId: string): Promise<INotification> {
    const notification = await notificationRepository.markAsRead(id, userId);
    if (!notification) throw new Error('NOTIFICATION_NOT_FOUND');
    return notification;
  },

  async markAllAsRead(userId: string) {
    return await notificationRepository.markAllAsRead(userId);
  }
};
