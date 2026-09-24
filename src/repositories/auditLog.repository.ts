import { AuditLog, IAuditLog } from '../models/AuditLog';

export const auditLogRepository = {
  async create(data: Partial<IAuditLog>): Promise<IAuditLog> {
    return await AuditLog.create(data);
  },

  async findLogs(filters: { eventId?: string; actorId?: string; action?: string; page?: number; limit?: number }) {
    const query: any = {};
    if (filters.eventId) query.eventId = filters.eventId;
    if (filters.actorId) query.actorId = filters.actorId;
    if (filters.action) query.action = filters.action;

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const logs = await AuditLog.find(query)
      .populate('actorId', 'fullName email role')
      .populate('eventId', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AuditLog.countDocuments(query);

    return { logs, total, page, totalPages: Math.ceil(total / limit) };
  }
};
