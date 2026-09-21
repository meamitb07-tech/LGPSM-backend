import { Request, Response, NextFunction } from 'express';
import { eventService } from '../services/event.service';
import { EventStatus } from '../models/Event';

export const eventController = {
  async createEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const organizerId = (req as any).user.userId;
      const event = await eventService.createEvent(organizerId, req.body);
      
      res.status(201).json({
        success: true,
        data: {
          eventId: (event as any)._id.toString(),
          status: event.status.toLowerCase(),
          createdAt: event.createdAt
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async getEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const organizerId = (req as any).user.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const filter = {
        status: req.query.status as EventStatus,
        categoryId: req.query.categoryId as string
      };

      const result = await eventService.getEventsByOrganizer(organizerId, filter, { page, limit });
      
      res.status(200).json({
        success: true,
        data: result.events,
        meta: {
          page,
          limit,
          total: result.total
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async getEventById(req: Request, res: Response, next: NextFunction) {
    try {
      const organizerId = (req as any).user.userId;
      const eventId = req.params.eventId as string;
      
      const event = await eventService.getEventById(eventId, organizerId);
      
      res.status(200).json({ success: true, data: event });
    } catch (error) {
      if ((error as Error).message === 'EVENT_NOT_FOUND') {
        res.status(404).json({ error: 'Not Found', message: 'Event not found or inaccessible', details: [] });
      } else {
        next(error);
      }
    }
  },

  async updateEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const organizerId = (req as any).user.userId;
      const eventId = req.params.eventId as string;
      
      const event = await eventService.updateEvent(eventId, organizerId, req.body);
      
      res.status(200).json({ success: true, data: event });
    } catch (error) {
       if ((error as Error).message === 'EVENT_NOT_FOUND') {
        res.status(404).json({ error: 'Not Found', message: 'Event not found or inaccessible', details: [] });
      } else {
        next(error);
      }
    }
  },

  async deleteEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const organizerId = (req as any).user.userId;
      const eventId = req.params.eventId as string;
      
      const event = await eventService.deactivateEvent(eventId, organizerId);
      
      res.status(200).json({ success: true, data: { eventId: (event as any)._id, status: event.status } });
    } catch (error) {
       if ((error as Error).message === 'EVENT_NOT_FOUND') {
        res.status(404).json({ error: 'Not Found', message: 'Event not found or inaccessible', details: [] });
      } else {
        next(error);
      }
    }
  }
};
