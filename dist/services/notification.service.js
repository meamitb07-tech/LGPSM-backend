"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = void 0;
const notification_repository_1 = require("../repositories/notification.repository");
exports.notificationService = {
    async createNotification(data) {
        return await notification_repository_1.notificationRepository.create(data);
    },
    async getUserNotifications(userId, unreadOnly = false, page = 1, limit = 20) {
        return await notification_repository_1.notificationRepository.findByUserId(userId, unreadOnly, page, limit);
    },
    async markAsRead(id, userId) {
        const notification = await notification_repository_1.notificationRepository.markAsRead(id, userId);
        if (!notification)
            throw new Error('NOTIFICATION_NOT_FOUND');
        return notification;
    },
    async markAllAsRead(userId) {
        return await notification_repository_1.notificationRepository.markAllAsRead(userId);
    },
    async deleteNotification(id, userId) {
        return await notification_repository_1.notificationRepository.deleteById(id, userId);
    },
    async clearAllNotifications(userId) {
        return await notification_repository_1.notificationRepository.clearAll(userId);
    }
};
