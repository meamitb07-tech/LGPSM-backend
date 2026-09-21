import { Request, Response } from 'express';
import { publicInvitationService } from '../services/publicInvitation.service';

export const publicInvitationController = {
  async getPublicInvitation(req: Request, res: Response) {
    try {
      const token = req.params.token as string;
      const data = await publicInvitationService.getPublicInvitation(token);
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      if (error.message === 'INVITATION_NOT_FOUND' || error.message === 'INVALID_TOKEN') {
        return res.status(404).json({ success: false, error: 'Not Found', message: 'Invitation not found or token is invalid' });
      }
      return res.status(500).json({ success: false, error: 'Internal Server Error', message: error.message });
    }
  },

  async submitRsvp(req: Request, res: Response) {
    try {
      const token = req.params.token as string;
      const { rsvpStatus, dietaryPreference } = req.body;

      const data = await publicInvitationService.submitRsvp(token, rsvpStatus, dietaryPreference);
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      if (error.message === 'INVITATION_NOT_FOUND' || error.message === 'INVALID_TOKEN') {
        return res.status(404).json({ success: false, error: 'Not Found', message: 'Invitation not found or token is invalid' });
      }
      return res.status(500).json({ success: false, error: 'Internal Server Error', message: error.message });
    }
  }
};
