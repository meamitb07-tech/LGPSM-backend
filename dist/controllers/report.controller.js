"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportController = void 0;
const report_service_1 = require("../services/report.service");
exports.reportController = {
    async getDashboardStats(req, res) {
        try {
            const user = {
                userId: req.user.userId,
                role: req.user.role
            };
            const data = await report_service_1.reportService.getDashboardStats(user);
            return res.status(200).json({ success: true, data });
        }
        catch (error) {
            return res.status(500).json({ error: 'Internal Server Error', message: error.message });
        }
    },
    async getEventReport(req, res) {
        try {
            const eventId = req.params.eventId;
            const user = {
                userId: req.user.userId,
                role: req.user.role
            };
            const data = await report_service_1.reportService.getEventReport(eventId, user);
            return res.status(200).json({ success: true, data });
        }
        catch (error) {
            if (error.message === 'EVENT_NOT_FOUND')
                return res.status(404).json({ error: 'Not Found', message: 'Event not found or access denied' });
            return res.status(500).json({ error: 'Internal Server Error', message: error.message });
        }
    }
};
