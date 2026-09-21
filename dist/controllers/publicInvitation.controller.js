"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicInvitationController = void 0;
const publicInvitation_service_1 = require("../services/publicInvitation.service");
exports.publicInvitationController = {
    async getPublicInvitation(req, res) {
        try {
            const token = req.params.token;
            const data = await publicInvitation_service_1.publicInvitationService.getPublicInvitation(token);
            return res.status(200).json({ success: true, data });
        }
        catch (error) {
            if (error.message === 'INVITATION_NOT_FOUND' || error.message === 'INVALID_TOKEN') {
                return res.status(404).json({ success: false, error: 'Not Found', message: 'Invitation not found or token is invalid' });
            }
            return res.status(500).json({ success: false, error: 'Internal Server Error', message: error.message });
        }
    },
    async submitRsvp(req, res) {
        try {
            const token = req.params.token;
            const { rsvpStatus, dietaryPreference } = req.body;
            const data = await publicInvitation_service_1.publicInvitationService.submitRsvp(token, rsvpStatus, dietaryPreference);
            return res.status(200).json({ success: true, data });
        }
        catch (error) {
            if (error.message === 'INVITATION_NOT_FOUND' || error.message === 'INVALID_TOKEN') {
                return res.status(404).json({ success: false, error: 'Not Found', message: 'Invitation not found or token is invalid' });
            }
            return res.status(500).json({ success: false, error: 'Internal Server Error', message: error.message });
        }
    }
};
