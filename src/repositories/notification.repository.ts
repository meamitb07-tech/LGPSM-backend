import { Notification, INotification } from '../models/Notification';

export const notificationRepository = {
  async create(data: Partial<INotification>): Promise<INotification> {
    return await Notification.create(data);
  },

  async findByUserId(userId: string, unreadOnly: boolean = false, page: number = 1, limit: number = 20) {
    const query: any = { userId };
    if (unreadOnly) query.isRead = false;

    const skip = (page - 1) * limit;
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    return { notifications, total, unreadCount, page, totalPages: Math.ceil(total / limit) };
  },

  async markAsRead(id: string, userId: string): Promise<INotification | null> {
    return await Notification.findOneAndUpdate({ _id: id, userId }, { isRead: true }, { new: true });
  },

  async markAllAsRead(userId: string) {
    return await Notification.updateMany({ userId, isRead: false }, { isRead: true });
  }
};
