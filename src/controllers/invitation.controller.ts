import { Request, Response } from 'express';
import { invitationService } from '../services/invitation.service';

export const invitationController = {
  async sendInvitations(req: Request, res: Response) {
    try {
      const eventId = req.params.eventId as string;
      const { inviteeIds, channel } = req.body;
      const organizerId = (req as any).user.userId;

      const results = await invitationService.sendInvitations(eventId, organizerId, inviteeIds, channel);
      return res.status(200).json({ message: 'Invitations processed', results });
    } catch (error: any) {
      if (error.message === 'EVENT_NOT_FOUND') return res.status(404).json({ error: 'Not Found', message: 'Event not found or access denied' });
      if (error.message === 'INVALID_INVITEES') return res.status(400).json({ error: 'Bad Request', message: 'One or more invitees do not belong to this event' });
      return res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
  },

  async resendInvitations(req: Request, res: Response) {
    try {
      const eventId = req.params.eventId as string;
      const { invitationIds } = req.body;
      const organizerId = (req as any).user.userId;

      const results = await invitationService.resendInvitations(eventId, organizerId, invitationIds);
      return res.status(200).json({ message: 'Invitations resend processed', results });
    } catch (error: any) {
      if (error.message === 'EVENT_NOT_FOUND') return res.status(404).json({ error: 'Not Found', message: 'Event not found or access denied' });
      if (error.message === 'INVALID_INVITATIONS') return res.status(400).json({ error: 'Bad Request', message: 'One or more invitations do not belong to this event' });
      return res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
  },

  async getInvitations(req: Request, res: Response) {
    try {
      const eventId = req.params.eventId as string;
      const organizerId = (req as any).user.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const data = await invitationService.getInvitations(eventId, organizerId, page, limit);
      return res.status(200).json(data);
    } catch (error: any) {
      if (error.message === 'EVENT_NOT_FOUND') return res.status(404).json({ error: 'Not Found', message: 'Event not found or access denied' });
      return res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
  }
};
