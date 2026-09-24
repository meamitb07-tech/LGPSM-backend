import { auditLogRepository } from '../repositories/auditLog.repository';
import { IAuditLog } from '../models/AuditLog';

export const auditLogService = {
  async logAction(data: Partial<IAuditLog>): Promise<IAuditLog> {
    return await auditLogRepository.create(data);
  },

  async getLogs(filters: { eventId?: string; actorId?: string; action?: string; page?: number; limit?: number }) {
    return await auditLogRepository.findLogs(filters);
  }
};
