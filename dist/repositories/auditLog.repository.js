"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogRepository = void 0;
const AuditLog_1 = require("../models/AuditLog");
exports.auditLogRepository = {
    async create(data) {
        return await AuditLog_1.AuditLog.create(data);
    },
    async findLogs(filters) {
        const query = {};
        if (filters.eventId)
            query.eventId = filters.eventId;
        if (filters.actorId)
            query.actorId = filters.actorId;
        if (filters.action)
            query.action = filters.action;
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;
        const logs = await AuditLog_1.AuditLog.find(query)
            .populate('actorId', 'fullName email role')
            .populate('eventId', 'title')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await AuditLog_1.AuditLog.countDocuments(query);
        return { logs, total, page, totalPages: Math.ceil(total / limit) };
    }
};
