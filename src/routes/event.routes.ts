import { Router, Request, Response, NextFunction } from 'express';
import { eventController } from '../controllers/event.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { Role } from '../models/User';
import { createEventSchema, updateEventSchema } from '../validators/event.validator';
import { ZodSchema } from 'zod';

const router = Router();

// Zod validation middleware wrapper
const validate = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse({ body: req.body });
    next();
  } catch (err: any) {
    res.status(400).json({ error: 'Validation Error', message: 'Invalid input data', details: err.errors });
  }
};

// All event routes require authentication
router.use(authenticate);

// Organizer specific routes
router.post('/', authorizeRoles(Role.ORGANIZER), validate(createEventSchema), eventController.createEvent);
router.get('/', authorizeRoles(Role.ORGANIZER), eventController.getEvents);
router.get('/:eventId', authorizeRoles(Role.ORGANIZER), eventController.getEventById);
router.patch('/:eventId', authorizeRoles(Role.ORGANIZER), validate(updateEventSchema), eventController.updateEvent);
router.delete('/:eventId', authorizeRoles(Role.ORGANIZER), eventController.deleteEvent);

export default router;
