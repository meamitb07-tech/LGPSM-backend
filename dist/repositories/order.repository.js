"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderRepository = void 0;
const Order_1 = require("../models/Order");
exports.orderRepository = {
    async create(data) {
        return await Order_1.Order.create(data);
    },
    async findById(id) {
        return await Order_1.Order.findById(id).populate('eventId').populate('ticketTierId').populate('userId', 'fullName email');
    },
    async findByUserId(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const orders = await Order_1.Order.find({ userId })
            .populate('eventId', 'title schedule location')
            .populate('ticketTierId', 'name price')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await Order_1.Order.countDocuments({ userId });
        return { orders, total, page, totalPages: Math.ceil(total / limit) };
    },
    async updateStatus(id, status, providerOrderId) {
        const update = { status };
        if (providerOrderId)
            update.providerOrderId = providerOrderId;
        return await Order_1.Order.findByIdAndUpdate(id, update, { new: true });
    }
};
