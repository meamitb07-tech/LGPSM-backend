import { Router, Request, Response, NextFunction } from 'express';
import { ticketTierController } from '../controllers/ticketTier.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { Role } from '../models/User';
import { createTicketTierSchema, updateTicketTierSchema } from '../validators/ticketTier.validator';

const validate = (schema: any) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, errors: result.error.format() });
  }
  req.body = result.data;
  next();
};

export const eventTicketTierRoutes = Router({ mergeParams: true });
eventTicketTierRoutes.get('/', ticketTierController.getTicketTiers);
eventTicketTierRoutes.post('/', authenticate, authorizeRoles(Role.ORGANIZER, Role.ADMIN), validate(createTicketTierSchema), ticketTierController.createTicketTier);

export const ticketTierRoutes = Router();
ticketTierRoutes.use(authenticate);
ticketTierRoutes.patch('/:id', authorizeRoles(Role.ORGANIZER, Role.ADMIN), validate(updateTicketTierSchema), ticketTierController.updateTicketTier);
ticketTierRoutes.delete('/:id', authorizeRoles(Role.ORGANIZER, Role.ADMIN), ticketTierController.deleteTicketTier);
