import { Router, Request, Response, NextFunction } from 'express';
import { sessionController } from '../controllers/session.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { Role } from '../models/User';
import { createSessionSchema, updateSessionSchema } from '../validators/session.validator';
import { ZodSchema } from 'zod';

const validate = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse({ body: req.body });
    next();
  } catch (err: any) {
    res.status(400).json({ error: 'Validation Error', message: 'Invalid input data', details: err.errors });
  }
};

export const eventSessionRoutes = Router({ mergeParams: true });
eventSessionRoutes.use(authenticate);

eventSessionRoutes.post('/', authorizeRoles(Role.ORGANIZER), validate(createSessionSchema), sessionController.createSession);
eventSessionRoutes.get('/', authorizeRoles(Role.ORGANIZER), sessionController.getSessions);

export const sessionRoutes = Router();
sessionRoutes.use(authenticate);

sessionRoutes.get('/:sessionId', authorizeRoles(Role.ORGANIZER), sessionController.getSessionById);
sessionRoutes.patch('/:sessionId', authorizeRoles(Role.ORGANIZER), validate(updateSessionSchema), sessionController.updateSession);
sessionRoutes.delete('/:sessionId', authorizeRoles(Role.ORGANIZER), sessionController.deleteSession);
