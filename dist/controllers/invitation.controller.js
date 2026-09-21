"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invitationController = void 0;
const invitation_service_1 = require("../services/invitation.service");
exports.invitationController = {
    async sendInvitations(req, res) {
        try {
            const eventId = req.params.eventId;
            const { inviteeIds, channel } = req.body;
            const organizerId = req.user.id;
            const results = await invitation_service_1.invitationService.sendInvitations(eventId, organizerId, inviteeIds, channel);
            return res.status(200).json({ message: 'Invitations processed', results });
        }
        catch (error) {
            if (error.message === 'EVENT_NOT_FOUND')
                return res.status(404).json({ error: 'Not Found', message: 'Event not found or access denied' });
            if (error.message === 'INVALID_INVITEES')
                return res.status(400).json({ error: 'Bad Request', message: 'One or more invitees do not belong to this event' });
            return res.status(500).json({ error: 'Internal Server Error', message: error.message });
        }
    },
    async resendInvitations(req, res) {
        try {
            const eventId = req.params.eventId;
            const { invitationIds } = req.body;
            const organizerId = req.user.id;
            const results = await invitation_service_1.invitationService.resendInvitations(eventId, organizerId, invitationIds);
            return res.status(200).json({ message: 'Invitations resend processed', results });
        }
        catch (error) {
            if (error.message === 'EVENT_NOT_FOUND')
                return res.status(404).json({ error: 'Not Found', message: 'Event not found or access denied' });
            if (error.message === 'INVALID_INVITATIONS')
                return res.status(400).json({ error: 'Bad Request', message: 'One or more invitations do not belong to this event' });
            return res.status(500).json({ error: 'Internal Server Error', message: error.message });
        }
    },
    async getInvitations(req, res) {
        try {
            const eventId = req.params.eventId;
            const organizerId = req.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const data = await invitation_service_1.invitationService.getInvitations(eventId, organizerId, page, limit);
            return res.status(200).json(data);
        }
        catch (error) {
            if (error.message === 'EVENT_NOT_FOUND')
                return res.status(404).json({ error: 'Not Found', message: 'Event not found or access denied' });
            return res.status(500).json({ error: 'Internal Server Error', message: error.message });
        }
    }
};
