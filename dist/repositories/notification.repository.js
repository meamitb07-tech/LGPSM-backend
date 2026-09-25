"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRepository = void 0;
const Notification_1 = require("../models/Notification");
exports.notificationRepository = {
    async create(data) {
        return await Notification_1.Notification.create(data);
    },
    async findByUserId(userId, unreadOnly = false, page = 1, limit = 20) {
        const query = { userId };
        if (unreadOnly)
            query.isRead = false;
        const skip = (page - 1) * limit;
        const notifications = await Notification_1.Notification.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await Notification_1.Notification.countDocuments(query);
        const unreadCount = await Notification_1.Notification.countDocuments({ userId, isRead: false });
        return { notifications, total, unreadCount, page, totalPages: Math.ceil(total / limit) };
    },
    async markAsRead(id, userId) {
        return await Notification_1.Notification.findOneAndUpdate({ _id: id, userId }, { isRead: true }, { new: true });
    },
    async markAllAsRead(userId) {
        return await Notification_1.Notification.updateMany({ userId, isRead: false }, { isRead: true });
    },
    async deleteById(id, userId) {
        return await Notification_1.Notification.findOneAndDelete({ _id: id, userId });
    },
    async clearAll(userId) {
        return await Notification_1.Notification.deleteMany({ userId });
    }
};
