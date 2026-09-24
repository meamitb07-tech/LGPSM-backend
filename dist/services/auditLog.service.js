"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogService = void 0;
const auditLog_repository_1 = require("../repositories/auditLog.repository");
exports.auditLogService = {
    async logAction(data) {
        return await auditLog_repository_1.auditLogRepository.create(data);
    },
    async getLogs(filters) {
        return await auditLog_repository_1.auditLogRepository.findLogs(filters);
    }
};
