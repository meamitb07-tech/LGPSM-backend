import { Router, Request, Response, NextFunction } from 'express';
import { systemUserAssignmentController } from '../controllers/systemUserAssignment.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { Role } from '../models/User';
import { createAssignmentSchema, updateAssignmentSchema } from '../validators/systemUserAssignment.validator';
import { ZodSchema } from 'zod';

const validate = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse({ body: req.body });
    next();
  } catch (err: any) {
    res.status(400).json({
  	  error: 'Validation Error',
  	  message: 'Invalid input data',
  	  details: err.issues,
  	  receivedBody: req.body
    });
  }
};

export const eventAssignmentRoutes = Router({ mergeParams: true });
eventAssignmentRoutes.use(authenticate);

eventAssignmentRoutes.post('/', authorizeRoles(Role.ORGANIZER), validate(createAssignmentSchema), systemUserAssignmentController.createAssignment);
eventAssignmentRoutes.get('/', authorizeRoles(Role.ORGANIZER), systemUserAssignmentController.getAssignmentsByEvent);

export const assignmentRoutes = Router();
assignmentRoutes.use(authenticate);

assignmentRoutes.patch('/:assignmentId', authorizeRoles(Role.ORGANIZER), validate(updateAssignmentSchema), systemUserAssignmentController.updateAssignment);
assignmentRoutes.delete('/:assignmentId', authorizeRoles(Role.ORGANIZER), systemUserAssignmentController.deleteAssignment);

export const myAssignmentRoutes = Router();
myAssignmentRoutes.use(authenticate);
myAssignmentRoutes.get('/', authorizeRoles(Role.SYSTEM_USER), systemUserAssignmentController.getMyAssignments);
